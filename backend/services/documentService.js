const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { supabaseAdmin, getSupabaseAdmin, isConfigured } = require('../config/supabase');
const auditService = require('./auditService');
const logger = require('../utils/logger');
const environment = require('../config/environment');
const {
  validateDocumentUpload,
  sanitizeOriginalFilename,
  generateStorageFilename,
  DocumentValidationError,
} = require('../utils/documentValidator');

const BUCKET_NAME = 'hospital-documents';

// Local in-memory document registry for development / test simulations
const devDocumentRegistry = [];

const documentService = {
  /**
   * Uploads statutory document to Supabase Storage (or local development storage fallback)
   * with strict size, MIME, magic-byte, and filename sanitization controls.
   */
  async uploadDocument({
    hospitalId,
    documentType,
    documentName,
    documentNumber = null,
    issuingAuthority = null,
    issueDate = null,
    expiryDate = null,
    customDocumentName = null,
    fileBuffer = null,
    mimeType = 'application/pdf',
    uploadedBy = 'Hospital Administrator',
    reqUser = null,
  }) {
    if (!hospitalId) {
      const err = new Error('Hospital ID is required for statutory document submission.');
      err.code = 'INVALID_METADATA';
      err.statusCode = 400;
      throw err;
    }

    if (!documentType || typeof documentType !== 'string' || !documentType.trim()) {
      const err = new Error('Statutory document type is required.');
      err.code = 'INVALID_DOCUMENT_TYPE';
      err.statusCode = 400;
      throw err;
    }

    // 1. Strict File Validation (Size, Extension, MIME, Magic Bytes, Structural Integrity)
    let validated;
    try {
      validated = validateDocumentUpload({
        buffer: fileBuffer,
        originalFilename: documentName || `${documentType}.pdf`,
        mimeType,
      });
    } catch (valErr) {
      // Audit log the rejected upload attempt (no secrets or binary data logged)
      await auditService.logEvent({
        action: 'DOCUMENT_UPLOAD_REJECTED',
        entityType: 'DOCUMENT',
        entityId: `rejected-${Date.now()}`,
        actorRole: reqUser?.role || 'hospital',
        hospitalId,
        summary: `Document upload rejected for ${documentType}: ${valErr.message}`,
        resultingStatus: 'rejected',
        metadata: {
          documentType,
          errorCode: valErr.code || 'INVALID_DOCUMENT',
          attemptedFilename: sanitizeOriginalFilename(documentName || 'unknown.pdf'),
        },
      }).catch(() => {});

      throw valErr;
    }

    // 2. Filename Security & Server-Generated UUID Storage Path
    const docId = crypto.randomUUID();
    const storagePath = `${hospitalId}/${validated.storageFilename}`;
    const nowIso = new Date().toISOString();

    const coreDocRecord = {
      id: docId,
      hospital_id: hospitalId,
      document_type: documentType,
      original_filename: validated.originalFilename,
      document_name: validated.originalFilename,
      storage_path: storagePath,
      file_path: storagePath,
      mime_type: 'application/pdf',
      file_size: validated.sizeDisplay,
      file_size_bytes: validated.sizeBytes,
      submission_status: 'submitted',
      document_status: 'pending',
      uploaded_by: uploadedBy,
      uploaded_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    let isReplacement = false;

    // --------------------------------------------------------------------------
    // TEST MODE: Self-contained in-memory registry for regression test suites
    // --------------------------------------------------------------------------
    if (process.env.NODE_ENV === 'test') {
      const existingIdx = devDocumentRegistry.findIndex(
        (d) => d.hospital_id === hospitalId && d.document_type === documentType && d.document_status !== 'superseded' && d.document_status !== 'rejected'
      );
      if (existingIdx !== -1) {
        isReplacement = true;
        devDocumentRegistry[existingIdx].document_status = 'superseded';
        devDocumentRegistry[existingIdx].rejection_reason = 'Superseded by newer submission';
      }

      devDocumentRegistry.unshift(coreDocRecord);

      const auditAction = isReplacement ? 'DOCUMENT_REPLACED' : 'DOCUMENT_UPLOADED';
      await auditService.logEvent({
        action: auditAction,
        entityType: 'DOCUMENT',
        entityId: docId,
        actorRole: reqUser?.role || 'hospital',
        hospitalId,
        summary: `${isReplacement ? 'Replaced' : 'Uploaded'} statutory filing "${documentType}" (${validated.originalFilename}). Size: ${validated.sizeDisplay}. Pending verification.`,
        resultingStatus: 'pending',
        metadata: {
          documentType,
          fileSize: validated.sizeDisplay,
          fileSizeBytes: validated.sizeBytes,
          storagePath,
          isReplacement,
        },
      }).catch(() => {});

      return coreDocRecord;
    }

    // --------------------------------------------------------------------------
    // PRODUCTION & DEVELOPMENT: Strict Supabase persistence with zero mock fallback
    // --------------------------------------------------------------------------
    const supabase = getSupabaseAdmin();

    // 3. Storage Security: Upload to private Supabase Storage bucket
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, validated.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      logger.error('Supabase storage upload failed:', uploadErr.message);
      const err = new Error(`Failed to upload document file to Supabase Storage: ${uploadErr.message}`);
      err.statusCode = 500;
      throw err;
    }

    // 4. Duplicate / Replacement Safety: Supersede existing document of same type if present
    try {
      const { data: existingDoc } = await supabase
        .from('hospital_documents')
        .select('id, storage_path')
        .eq('hospital_id', hospitalId)
        .eq('document_type', documentType)
        .eq('document_status', 'pending')
        .maybeSingle();

      if (existingDoc) {
        isReplacement = true;
        // Supersede older record
        await supabase
          .from('hospital_documents')
          .update({ document_status: 'rejected', rejection_reason: 'Superseded by newer submission' })
          .eq('id', existingDoc.id);
      }
    } catch (e) {
      // No existing record to supersede
    }

    // 5. Construct Extended Document Record & Persist Metadata
    const extendedDocRecord = {
      ...coreDocRecord,
      document_number: documentNumber || null,
      issuing_authority: issuingAuthority || null,
      issue_date: (issueDate && issueDate !== 'N/A') ? issueDate : null,
      expiry_date: (expiryDate && expiryDate !== 'N/A') ? expiryDate : null,
      custom_document_name: customDocumentName || null,
    };

    // Persist metadata to Supabase hospital_documents table
    let { error: insertErr } = await supabase
      .from('hospital_documents')
      .insert([extendedDocRecord]);

    // If extended columns are not yet applied on remote database (PGRST204), retry with core columns
    if (insertErr && (insertErr.code === 'PGRST204' || insertErr.message?.includes('column'))) {
      logger.info('Retrying hospital_documents insert with core columns (extended columns pending migration in Supabase)...');
      const retryResult = await supabase
        .from('hospital_documents')
        .insert([coreDocRecord]);
      insertErr = retryResult.error;
    }

    if (insertErr) {
      logger.error('Failed to save document metadata in Supabase:', insertErr.message);
      // Clean up uploaded file to prevent orphan storage objects
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]).catch(() => {});
      const err = new Error(`Database error saving document record: ${insertErr.message}`);
      err.statusCode = 500;
      err.code = insertErr.code || 'DB_WRITE_FAILED';
      throw err;
    }

    // Maintain in-memory store for reference
    devDocumentRegistry.unshift(coreDocRecord);

    // 6. Security Audit Event
    const auditAction = isReplacement ? 'DOCUMENT_REPLACED' : 'DOCUMENT_UPLOADED';
    await auditService.logEvent({
      action: auditAction,
      entityType: 'DOCUMENT',
      entityId: docId,
      actorRole: reqUser?.role || 'hospital',
      hospitalId,
      summary: `${isReplacement ? 'Replaced' : 'Uploaded'} statutory filing "${documentType}" (${validated.originalFilename}). Size: ${validated.sizeDisplay}. Pending verification.`,
      resultingStatus: 'pending',
      metadata: {
        documentType,
        fileSize: validated.sizeDisplay,
        fileSizeBytes: validated.sizeBytes,
        storagePath,
        isReplacement,
      },
    });

    return coreDocRecord;
  },

  /**
   * Generates a time-limited signed URL for secure viewing.
   * Strictly enforces authorization:
   * - Hospital users can ONLY access documents belonging to their own hospital.
   * - Admin users can access any hospital's statutory documents.
   */
  async getSignedUrl({ hospitalId = null, documentId, reqUser, expiresInSeconds = 900 }) {
    if (!documentId) {
      const err = new Error('Document ID is required.');
      err.code = 'INVALID_DOCUMENT_ID';
      err.statusCode = 400;
      throw err;
    }

    // 1. Locate Authoritative Document Record
    let doc = null;

    if (process.env.NODE_ENV === 'test') {
      doc = devDocumentRegistry.find((d) => d.id === documentId || d.storage_path?.includes(documentId));
    } else {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('hospital_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !data) {
        logger.warn('Failed to query document from Supabase:', error?.message);
      } else {
        doc = data;
      }
    }

    if (!doc) {
      const err = new Error('Statutory document not found.');
      err.code = 'DOCUMENT_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // 2. Strict Authorization Enforcement
    const isAdmin = reqUser?.role === 'admin';
    const isOwner = reqUser?.role === 'hospital' && reqUser?.hospitalId === doc.hospital_id;

    if (!isAdmin && !isOwner) {
      // Security Event: Cross-hospital access attempt detected
      await auditService.logEvent({
        action: 'DOCUMENT_ACCESS_DENIED',
        entityType: 'DOCUMENT',
        entityId: documentId,
        actorRole: reqUser?.role || 'unauthorized',
        hospitalId: reqUser?.hospitalId || null,
        partnerHospitalId: doc.hospital_id,
        summary: `Unauthorized document access attempt by ${reqUser?.name || 'user'} on document ${documentId} (Owner: ${doc.hospital_id}).`,
        resultingStatus: 'forbidden',
        metadata: {
          requestedDocumentId: documentId,
          targetHospitalId: doc.hospital_id,
          callerHospitalId: reqUser?.hospitalId,
        },
      }).catch(() => {});

      const err = new Error('Access restricted: You are not authorized to view this statutory document.');
      err.code = 'UNAUTHORIZED_DOCUMENT_ACCESS';
      err.statusCode = 403;
      throw err;
    }

    // 3. Generate Short-Lived Signed URL
    const targetStoragePath = doc.storage_path || doc.file_path;
    let signedUrl = null;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    if (process.env.NODE_ENV === 'test') {
      // Test-mode deterministic signed URL simulation
      const token = crypto.randomBytes(16).toString('hex');
      signedUrl = `/api/documents/${documentId}/view?token=${token}&expires=${Date.now() + expiresInSeconds * 1000}`;
    } else {
      const supabase = getSupabaseAdmin();
      if (targetStoragePath && !targetStoragePath.startsWith('/')) {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(targetStoragePath, expiresInSeconds);

        if (!error && data?.signedUrl) {
          signedUrl = data.signedUrl;
        } else if (error) {
          logger.error('Failed to generate Supabase signed URL:', error.message);
        }
      }

      if (!signedUrl) {
        const err = new Error('Failed to generate secure viewing signed URL from Supabase Storage.');
        err.statusCode = 500;
        throw err;
      }
    }

    // 4. Audit Log Successful Authorized View
    await auditService.logEvent({
      action: 'DOCUMENT_VIEWED',
      entityType: 'DOCUMENT',
      entityId: documentId,
      actorRole: reqUser?.role || 'hospital',
      hospitalId: doc.hospital_id,
      summary: `Secure signed viewing URL generated for "${doc.document_type}" (${doc.document_name}). Authorized by ${isAdmin ? 'Administrator' : 'Hospital User'}.`,
      resultingStatus: 'authorized',
      metadata: {
        documentType: doc.document_type,
        documentName: doc.document_name,
        expiresInSeconds,
      },
    }).catch(() => {});

    return {
      documentId: doc.id,
      hospitalId: doc.hospital_id,
      documentType: doc.document_type,
      documentName: doc.document_name,
      signedUrl,
      expiresAt,
    };
  },

  /**
   * Returns registered document by ID (internal utility)
   */
  async getDocumentById(documentId) {
    if (process.env.NODE_ENV === 'test') {
      return devDocumentRegistry.find((d) => d.id === documentId) || null;
    }

    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('hospital_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    return data || null;
  },

  /**
   * Deletes a registered document and removes storage object
   */
  async deleteDocument(documentId, hospitalId) {
    if (process.env.NODE_ENV === 'test') {
      const idx = devDocumentRegistry.findIndex((d) => (d.id === documentId || d.storage_path?.includes(documentId)) && d.hospital_id === hospitalId);
      if (idx === -1) {
        const err = new Error('Document not found or access denied.');
        err.statusCode = 404;
        throw err;
      }
      devDocumentRegistry.splice(idx, 1);
      return { success: true, message: 'Document deleted successfully', documentId };
    }

    const supabase = getSupabaseAdmin();

    const { data: doc, error: findErr } = await supabase
      .from('hospital_documents')
      .select('*')
      .eq('id', documentId)
      .eq('hospital_id', hospitalId)
      .maybeSingle();

    if (findErr) {
      logger.error('Failed to query document before deletion:', findErr.message);
      const err = new Error(`Database error querying document: ${findErr.message}`);
      err.statusCode = 500;
      throw err;
    }

    if (!doc) {
      const err = new Error('Document not found or access denied.');
      err.statusCode = 404;
      throw err;
    }

    const { error: delErr } = await supabase
      .from('hospital_documents')
      .delete()
      .eq('id', documentId);

    if (delErr) {
      logger.error('Failed to delete document from Supabase:', delErr.message);
      const err = new Error(`Database error deleting document: ${delErr.message}`);
      err.statusCode = 500;
      throw err;
    }

    if (doc.storage_path) {
      await supabase.storage.from(BUCKET_NAME).remove([doc.storage_path]).catch((e) => {
        logger.warn('Warning removing storage object on document delete:', e.message);
      });
    }

    const idx = devDocumentRegistry.findIndex((d) => (d.id === documentId || d.storage_path?.includes(documentId)) && d.hospital_id === hospitalId);
    if (idx !== -1) {
      devDocumentRegistry.splice(idx, 1);
    }

    return { success: true, message: 'Document deleted successfully', documentId };
  },

  /**
   * Helper to get documents from in-memory registry
   */
  getDevDocuments(hospitalId) {
    return devDocumentRegistry.filter((d) => !hospitalId || d.hospital_id === hospitalId);
  },

  /**
   * Helper to clear in-memory document registry for test isolation
   */
  _clearDevRegistry() {
    devDocumentRegistry.length = 0;
  },

  _devDocumentRegistry: devDocumentRegistry,
};

module.exports = documentService;

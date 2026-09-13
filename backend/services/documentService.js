const { supabaseAdmin, isConfigured } = require('../config/supabase');
const auditService = require('./auditService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'hospital-documents';

const documentService = {
  /**
   * Uploads statutory document to Supabase Storage (or local storage fallback)
   */
  async uploadDocument({
    hospitalId,
    documentType,
    documentName,
    fileBuffer = null,
    fileSize = '2.4 MB',
    uploadedBy = 'Hospital Administrator',
  }) {
    const docId = `doc-${hospitalId}-${Date.now()}`;
    const sanitizedFilename = documentName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${hospitalId}/${Date.now()}_${sanitizedFilename}`;

    let documentUrl = `/documents/${sanitizedFilename}`;

    if (isConfigured && supabaseAdmin && fileBuffer) {
      try {
        const { error: uploadErr } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(storagePath, fileBuffer, {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (uploadErr) {
          logger.warn('Supabase storage upload returned error:', uploadErr.message);
        } else {
          documentUrl = storagePath;
        }
      } catch (err) {
        logger.warn('Failed to upload to Supabase storage:', err.message);
      }
    } else if (fileBuffer) {
      // Local development fallback
      const uploadDir = path.join(__dirname, '..', 'uploads', hospitalId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, sanitizedFilename), fileBuffer);
      documentUrl = `/uploads/${hospitalId}/${sanitizedFilename}`;
    }

    const documentRecord = {
      id: docId,
      hospital_id: hospitalId,
      document_type: documentType,
      document_name: sanitizedFilename,
      file_path: documentUrl,
      file_size: fileSize,
      submission_status: 'submitted',
      document_status: 'pending',
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
    };

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('hospital_documents').insert([documentRecord]);
      } catch (err) {
        logger.warn('Failed to save document metadata in Supabase:', err.message);
      }
    }

    await auditService.logEvent({
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: docId,
      actorRole: 'hospital',
      hospitalId,
      summary: `Uploaded statutory filing "${documentType}" (${sanitizedFilename}). Document pending verification.`,
      resultingStatus: 'pending',
      metadata: { documentType, fileSize },
    });

    return documentRecord;
  },

  /**
   * Generates a time-limited signed URL for secure viewing
   */
  async getSignedUrl(hospitalId, documentId, expiresInSeconds = 900) {
    if (isConfigured && supabaseAdmin) {
      try {
        const { data: doc } = await supabaseAdmin
          .from('hospital_documents')
          .select('file_path')
          .eq('id', documentId)
          .single();

        if (doc && doc.file_path && !doc.file_path.startsWith('/')) {
          const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .createSignedUrl(doc.file_path, expiresInSeconds);

          if (!error && data?.signedUrl) {
            return { signedUrl: data.signedUrl, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
          }
        }
      } catch (err) {
        logger.warn('Failed to generate Supabase signed URL:', err.message);
      }
    }

    // Development fallback
    return {
      signedUrl: `/documents/sample_${documentId}.pdf`,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }
};

module.exports = documentService;

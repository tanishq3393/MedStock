const { randomUUID: uuidv4 } = require('crypto');
const { supabaseAdmin, supabaseAnon, getSupabaseAdmin, isConfigured } = require('../config/supabase');
const environment = require('../config/environment');
const authService = require('./authService');
const auditService = require('./auditService');
const otpService = require('./otpService');
const documentService = require('./documentService');
const logger = require('../utils/logger');

const devCampuses = [];

const MANDATORY_REGISTRATION_DOCS = [
  {
    key: 'registration_cert',
    label: 'Hospital / Clinical Establishment Registration Certificate',
    match: (t) => {
      const s = (t || '').toLowerCase();
      return s.includes('registration') || s.includes('establishment') || s.includes('clinical');
    }
  },
  {
    key: 'drug_license',
    label: 'Drug License / Medicine Handling Authorization',
    match: (t) => {
      const s = (t || '').toLowerCase();
      return s.includes('drug') || s.includes('license') || s.includes('medicine handling') || s.includes('form 20') || s.includes('form 21') || s.includes('form20');
    }
  },
  {
    key: 'auth_letter',
    label: 'Hospital Authorization / Authorized Representative Letter',
    match: (t) => {
      const s = (t || '').toLowerCase();
      return s.includes('authorization') || s.includes('authorized') || s.includes('resolution') || s.includes('representative');
    }
  }
];

function validatePasswordRequirements(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least 1 lowercase letter (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least 1 number (0-9).';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least 1 special character (! @ # $ % ...).';
  }
  const lower = password.toLowerCase();
  if (['password', 'password123', 'admin123', '12345678', 'medex123'].includes(lower)) {
    return 'Password is too common or easily guessed. Please choose a stronger password.';
  }
  return null;
}

const hospitalService = {
  /**
   * Step 1: Hospital Identity & Authority Details
   * Requires verified email via OTP
   */
  async saveStep1(formData) {
    const required = [
      { key: 'name', label: 'Hospital / Healthcare Institution Name' },
      { key: 'registrationNo', label: 'Hospital Registration Number' },
      { key: 'issuingAuthority', label: 'Issuing Authority' },
      { key: 'organizationType', label: 'Organization Type' },
      { key: 'authorizedPerson', label: 'Authorized Representative Name' },
      { key: 'designation', label: 'Designation' },
      { key: 'email', label: 'Official Work Email' },
      { key: 'phone', label: 'Official Contact Number' },
    ];

    const missing = required
      .filter((r) => !formData[r.key] || !String(formData[r.key]).trim())
      .map((r) => r.label);

    if (missing.length > 0) {
      const err = new Error(`Validation Error: Missing required fields: ${missing.join(', ')}`);
      err.statusCode = 422;
      err.missingFields = missing;
      throw err;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      const err = new Error('Validation Error: Invalid official email address format.');
      err.statusCode = 422;
      throw err;
    }

    const cleanRegNo = formData.registrationNo.trim().toUpperCase();

    // Verify that the email was verified with OTP (if feature flag is enabled)
    const isEmailVerificationRequired = Boolean(environment.features?.emailVerificationRequired);
    const hasValidToken = Boolean(formData.verificationToken && otpService.isEmailVerified(cleanEmail, formData.verificationToken));
    const isEmailVerified = hasValidToken;
    const emailVerificationStatus = isEmailVerified
      ? 'VERIFIED'
      : (isEmailVerificationRequired ? 'UNVERIFIED' : 'TEMPORARILY_SKIPPED');

    if (isEmailVerificationRequired && !isEmailVerified) {
      const err = new Error('Email verification required: Please verify your official work email with the OTP before proceeding.');
      err.statusCode = 400;
      err.code = 'EMAIL_NOT_VERIFIED';
      throw err;
    }

    // Ensure server has Supabase Admin client configured (fails loudly if unconfigured)
    const supabase = getSupabaseAdmin();

    // Check duplicate among APPROVED/ACTIVE hospitals directly in Supabase
    const { data: existingRecords, error: dupCheckErr } = await supabase
      .from('hospitals')
      .select('id, name, status, email, registration_no')
      .or(`email.eq.${cleanEmail},registration_no.eq.${cleanRegNo}`);

    if (dupCheckErr) {
      logger.error('Failed to query existing hospitals from Supabase:', dupCheckErr.message);
      const err = new Error(`Database error checking registration: ${dupCheckErr.message}`);
      err.statusCode = 500;
      throw err;
    }

    const existingApproved = existingRecords?.find((h) =>
      ['APPROVED', 'approved', 'verified'].includes(h.status)
    );
    if (existingApproved) {
      const err = new Error(`Duplicate Registration: An active hospital with email ${cleanEmail} or registration number ${cleanRegNo} is already registered.`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_REGISTRATION';
      throw err;
    }

    // Check existing draft / pending record in Supabase to reuse hospitalId
    let hospitalId = formData.hospitalId;
    const existingDraft = existingRecords?.find((h) =>
      (hospitalId && h.id === hospitalId) ||
      ['draft', 'REGISTERED', 'pending_approval', 'PENDING_APPROVAL', 'requires_correction'].includes(h.status)
    );

    if (existingDraft) {
      hospitalId = existingDraft.id;
    } else if (!hospitalId) {
      hospitalId = uuidv4();
    }

    const nowIso = new Date().toISOString();
    const hospitalData = {
      id: hospitalId,
      name: formData.name.trim(),
      registrationNo: cleanRegNo,
      registration_no: cleanRegNo,
      issuingAuthority: formData.issuingAuthority.trim(),
      issuing_authority: formData.issuingAuthority.trim(),
      organizationType: formData.organizationType.trim(),
      organization_type: formData.organizationType.trim(),
      authorizedPerson: formData.authorizedPerson.trim(),
      authorized_person: formData.authorizedPerson.trim(),
      designation: formData.designation.trim(),
      email: cleanEmail,
      phone: formData.phone.trim(),
      emailVerified: isEmailVerified,
      email_verified: isEmailVerified,
      emailVerifiedAt: isEmailVerified ? nowIso : null,
      email_verified_at: isEmailVerified ? nowIso : null,
      emailVerificationStatus,
      email_verification_status: emailVerificationStatus,
      address: existingDraft?.address || '',
      city: existingDraft?.city || '',
      district: existingDraft?.district || '',
      state: existingDraft?.state || '',
      pincode: existingDraft?.pincode || '',
      receivingGate: existingDraft?.receivingGate || '',
      receiving_gate: existingDraft?.receiving_gate || '',
      status: 'draft',
      registeredDate: nowIso.split('T')[0],
      registered_date: nowIso.split('T')[0],
      documents: existingDraft?.documents || [],
      updatedAt: nowIso,
      updated_at: nowIso,
    };

    // Prepare primary core columns supported in PostgreSQL hospitals table
    // Note: status 'REGISTERED' is compatible with existing hospitals_status_check constraint
    const coreHospitalPayload = {
      id: hospitalId,
      name: hospitalData.name,
      registration_no: hospitalData.registration_no,
      authorized_person: hospitalData.authorized_person,
      email: hospitalData.email,
      phone: hospitalData.phone,
      address: hospitalData.address || 'Pending Campus Entry',
      city: hospitalData.city || 'Pending',
      state: hospitalData.state || 'Pending',
      pincode: hospitalData.pincode || '000000',
      status: 'REGISTERED',
      updated_at: nowIso,
    };

    // Full extended payload matching migration 20260915000001
    const extendedHospitalPayload = {
      ...coreHospitalPayload,
      issuing_authority: hospitalData.issuing_authority,
      organization_type: hospitalData.organization_type,
      designation: hospitalData.designation,
      email_verified: isEmailVerified,
      email_verified_at: isEmailVerified ? nowIso : null,
    };

    // Execute real write to Supabase hospitals table
    let { error: upsertErr } = await supabase
      .from('hospitals')
      .upsert([extendedHospitalPayload], { onConflict: 'id' });

    // If extended columns are not yet applied on remote database (PGRST204), retry with core columns
    if (upsertErr && (upsertErr.code === 'PGRST204' || upsertErr.message?.includes('column'))) {
      logger.info('Retrying hospitals upsert with core columns (extended columns pending migration in Supabase)...');
      const retryResult = await supabase
        .from('hospitals')
        .upsert([coreHospitalPayload], { onConflict: 'id' });
      upsertErr = retryResult.error;
    }

    if (upsertErr) {
      logger.error('Supabase hospitals upsert failed:', upsertErr.message);
      const err = new Error(`Database error saving hospital registration: ${upsertErr.message}`);
      err.statusCode = 500;
      err.code = upsertErr.code || 'DB_WRITE_FAILED';
      throw err;
    }

    // Update in-memory registry cache only AFTER database persistence succeeds
    const devHospitals = authService.getDevHospitals();
    const devExistingIdx = devHospitals.findIndex((h) => h.id === hospitalId);
    if (devExistingIdx !== -1) {
      Object.assign(devHospitals[devExistingIdx], hospitalData);
    } else {
      devHospitals.unshift(hospitalData);
    }

    return {
      hospitalId,
      status: 'draft',
      step: 1,
      hospital: hospitalData,
      message: 'Step 1 saved successfully. Step 2 unlocked.',
    };
  },

  /**
   * Step 2: Physical Campus & Receiving Gate
   */
  async saveStep2(formData) {
    const { hospitalId, address, state, district, city, pincode, receivingGate } = formData;
    if (!hospitalId) {
      const err = new Error('Hospital ID is required. Please complete Step 1 first.');
      err.statusCode = 400;
      throw err;
    }

    const required = [
      { key: 'address', label: 'Hospital / Campus Address' },
      { key: 'state', label: 'State' },
      { key: 'district', label: 'District' },
      { key: 'city', label: 'City' },
      { key: 'pincode', label: 'Pincode' },
    ];

    const missing = required
      .filter((r) => !formData[r.key] || !String(formData[r.key]).trim())
      .map((r) => r.label);

    if (missing.length > 0) {
      const err = new Error(`Validation Error: Missing required campus fields: ${missing.join(', ')}`);
      err.statusCode = 422;
      err.missingFields = missing;
      throw err;
    }

    // Validate Indian 6-digit Pincode
    const cleanPin = String(pincode).trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      const err = new Error('Validation Error: Pincode must be a valid 6-digit Indian postal code.');
      err.statusCode = 422;
      throw err;
    }

    const cleanAddress = address.trim();
    const cleanState = state.trim();
    const cleanDistrict = district.trim();
    const cleanCity = city.trim();
    const cleanGate = receivingGate ? String(receivingGate).trim() : null;
    const nowIso = new Date().toISOString();

    // Ensure server has Supabase Admin client configured (fails loudly if unconfigured)
    const supabase = getSupabaseAdmin();

    // 1. Verify hospital exists in Supabase
    const { data: existingHosp, error: hospFindErr } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('id', hospitalId)
      .maybeSingle();

    if (hospFindErr) {
      logger.error('Failed to verify hospital in Supabase:', hospFindErr.message);
      const err = new Error(`Database error verifying hospital: ${hospFindErr.message}`);
      err.statusCode = 500;
      throw err;
    }

    if (!existingHosp) {
      const err = new Error(`Hospital with ID ${hospitalId} not found in database. Please complete Step 1 first.`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Persist campus address directly to hospitals table
    const extendedHospUpdate = {
      address: cleanAddress,
      state: cleanState,
      district: cleanDistrict,
      city: cleanCity,
      pincode: cleanPin,
      receiving_gate: cleanGate,
      updated_at: nowIso,
    };

    const coreHospUpdate = {
      address: cleanAddress,
      state: cleanState,
      city: cleanCity,
      pincode: cleanPin,
      updated_at: nowIso,
    };

    let { error: hospUpdateErr } = await supabase
      .from('hospitals')
      .update(extendedHospUpdate)
      .eq('id', hospitalId);

    if (hospUpdateErr && (hospUpdateErr.code === 'PGRST204' || hospUpdateErr.message?.includes('column'))) {
      logger.info('Retrying hospitals address update with core columns (district/receiving_gate pending migration in Supabase)...');
      const retryResult = await supabase
        .from('hospitals')
        .update(coreHospUpdate)
        .eq('id', hospitalId);
      hospUpdateErr = retryResult.error;
    }

    if (hospUpdateErr) {
      logger.error('Supabase hospitals update in saveStep2 failed:', hospUpdateErr.message);
      const err = new Error(`Database error saving campus address: ${hospUpdateErr.message}`);
      err.statusCode = 500;
      err.code = hospUpdateErr.code || 'DB_WRITE_FAILED';
      throw err;
    }

    // 3. Attempt to persist to dedicated hospital_campuses table if table exists
    const campusRecord = {
      id: uuidv4(),
      hospital_id: hospitalId,
      campus_name: 'Main Campus',
      is_primary: true,
      address: cleanAddress,
      state: cleanState,
      district: cleanDistrict,
      city: cleanCity,
      pincode: cleanPin,
      receiving_gate: cleanGate,
      created_at: nowIso,
      updated_at: nowIso,
    };

    let campusTablePersisted = false;
    const { error: campusErr } = await supabase
      .from('hospital_campuses')
      .upsert([campusRecord], { onConflict: 'hospital_id' });

    if (!campusErr) {
      campusTablePersisted = true;
    } else if (campusErr.code === 'PGRST205' || campusErr.message?.includes('schema cache')) {
      logger.warn('hospital_campuses table does not exist in Supabase schema (PGRST205). Address was successfully persisted to hospitals table. Migration 20260915000001 must be run in Supabase SQL editor to create the dedicated hospital_campuses table.');
    } else {
      logger.error('Failed to write to hospital_campuses table:', campusErr.message);
      const err = new Error(`Database error saving campus record: ${campusErr.message}`);
      err.statusCode = 500;
      err.code = campusErr.code || 'DB_WRITE_FAILED';
      throw err;
    }

    // Update in-memory registry caches only AFTER database persistence succeeds
    const devHospitals = authService.getDevHospitals();
    const hospital = devHospitals.find((h) => h.id === hospitalId);
    if (hospital) {
      hospital.address = cleanAddress;
      hospital.state = cleanState;
      hospital.district = cleanDistrict;
      hospital.city = cleanCity;
      hospital.pincode = cleanPin;
      hospital.receivingGate = cleanGate;
      hospital.receiving_gate = cleanGate;
      hospital.updatedAt = nowIso;
      hospital.updated_at = nowIso;
    }

    const cIdx = devCampuses.findIndex((c) => c.hospital_id === hospitalId && c.is_primary);
    if (cIdx !== -1) {
      devCampuses[cIdx] = campusRecord;
    } else {
      devCampuses.push(campusRecord);
    }

    return {
      hospitalId,
      status: 'draft',
      step: 2,
      campus: campusRecord,
      campusTablePersisted,
      message: 'Campus details saved successfully. Step 3 unlocked.',
    };
  },

  /**
   * Helper to retrieve campuses for a hospital (internal / admin access)
   */
  getDevCampuses(hospitalId) {
    return devCampuses.filter((c) => !hospitalId || c.hospital_id === hospitalId);
  },

  /**
   * Step 3: Statutory Document Upload
   */
  async uploadRegistrationDocument({
    hospitalId,
    documentType,
    documentNumber,
    issuingAuthority,
    issueDate,
    expiryDate,
    customDocumentName,
    fileBuffer,
    mimeType,
    originalFilename,
  }) {
    if (!hospitalId) {
      const err = new Error('Hospital ID is required for document attachment.');
      err.statusCode = 400;
      throw err;
    }

    return await documentService.uploadDocument({
      hospitalId,
      documentType,
      documentName: originalFilename,
      documentNumber,
      issuingAuthority,
      issueDate,
      expiryDate,
      customDocumentName,
      fileBuffer,
      mimeType,
      uploadedBy: 'Hospital Administrator',
    });
  },

  /**
   * Step 3: Delete Document
   */
  async deleteRegistrationDocument(hospitalId, documentId) {
    if (!hospitalId || !documentId) {
      const err = new Error('Hospital ID and Document ID are required.');
      err.statusCode = 400;
      throw err;
    }

    return await documentService.deleteDocument(documentId, hospitalId);
  },

  /**
   * Step 3: Get Uploaded Documents
   */
  async getRegistrationDocuments(hospitalId) {
    if (!hospitalId) return [];

    const supabase = getSupabaseAdmin();
    const { data: docs, error } = await supabase
      .from('hospital_documents')
      .select('*')
      .eq('hospital_id', hospitalId)
      .neq('document_status', 'superseded')
      .neq('document_status', 'rejected')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to query hospital documents in getRegistrationDocuments:', error.message);
      const err = new Error(`Database error retrieving documents: ${error.message}`);
      err.statusCode = 500;
      throw err;
    }

    return (docs || []).map((d) => ({
      id: d.id,
      hospitalId: d.hospital_id || d.hospitalId,
      documentType: d.document_type || d.documentType,
      documentNumber: d.document_number || d.documentNumber || '',
      issuingAuthority: d.issuing_authority || d.issuingAuthority || '',
      issueDate: d.issue_date || d.issueDate || '',
      expiryDate: d.expiry_date || d.expiryDate || '',
      customDocumentName: d.custom_document_name || d.customDocumentName || '',
      documentName: d.document_name || d.documentName || d.original_filename,
      originalFilename: d.original_filename || d.originalFilename || d.document_name,
      storagePath: d.storage_path || d.storagePath,
      fileSize: d.file_size || d.fileSize || '2.4 MB',
      mimeType: d.mime_type || d.mimeType || 'application/pdf',
      submissionStatus: d.submission_status || d.submissionStatus || 'submitted',
      uploadedAt: d.uploaded_at || d.uploadedAt || new Date().toISOString(),
    }));
  },

  /**
   * Step 4: Final Submission
   * Validates mandatory 3 statutory documents, validates password policy,
   * creates initial hospital administrator account in Supabase Auth,
   * updates hospital status to pending_approval.
   */
  async submitRegistration(hospitalId, { password, confirmPassword }) {
    if (!hospitalId) {
      const err = new Error('Hospital ID is required.');
      err.statusCode = 400;
      throw err;
    }

    const supabase = getSupabaseAdmin();

    // Query hospital authoritative record from Supabase
    const { data: hospital, error: hospErr } = await supabase
      .from('hospitals')
      .select('*')
      .eq('id', hospitalId)
      .maybeSingle();

    if (hospErr) {
      logger.error('Failed to query hospital in submitRegistration:', hospErr.message);
      const err = new Error(`Database error querying hospital: ${hospErr.message}`);
      err.statusCode = 500;
      throw err;
    }

    if (!hospital) {
      const err = new Error('Hospital registration application not found.');
      err.statusCode = 404;
      throw err;
    }

    // 1. Password policy enforcement
    const pwdErr = validatePasswordRequirements(password);
    if (pwdErr) {
      const err = new Error(pwdErr);
      err.statusCode = 422;
      err.code = 'INVALID_PASSWORD_POLICY';
      throw err;
    }

    if (password !== confirmPassword) {
      const err = new Error('Validation Error: Passwords do not match.');
      err.statusCode = 422;
      err.code = 'PASSWORD_MISMATCH';
      throw err;
    }

    // 2. Mandatory Statutory Documents Check
    const uploadedDocs = await this.getRegistrationDocuments(hospitalId);
    const submittedDocTypes = uploadedDocs.map((d) => d.documentType || '');

    const missingMandatory = MANDATORY_REGISTRATION_DOCS.filter((reqDoc) => {
      return !submittedDocTypes.some((subType) => reqDoc.match(subType));
    });

    if (missingMandatory.length > 0) {
      const missingLabels = missingMandatory.map((m) => m.label).join(', ');
      const err = new Error(`Application submission blocked: All mandatory statutory documents must be submitted. Missing: ${missingLabels}`);
      err.statusCode = 400;
      err.code = 'MANDATORY_DOCUMENTS_MISSING';
      err.missingDocuments = missingMandatory.map((m) => m.label);
      throw err;
    }

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    // 3. Supabase Auth Provisioning (Never store password in application DB!)
    let authUserId = null;
    const cleanEmail = hospital.email.toLowerCase();

    try {
      const { data: createdAuth, error: authErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: hospital.authorized_person || hospital.authorizedPerson,
          role: 'hospital',
          hospital_id: hospitalId,
        },
      });

      if (!authErr && createdAuth?.user) {
        authUserId = createdAuth.user.id;
      } else if (authErr) {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const match = userList?.users?.find((u) => u.email.toLowerCase() === cleanEmail);
        if (match) {
          authUserId = match.id;
          await supabase.auth.admin.updateUserById(match.id, {
            password: password,
            user_metadata: {
              name: hospital.authorized_person || hospital.authorizedPerson,
              role: 'hospital',
              hospital_id: hospitalId,
            },
          });
        }
      }
    } catch (authEx) {
      logger.warn('Supabase Auth user creation warning:', authEx.message);
    }

    if (!authUserId) {
      authUserId = uuidv4();
    }

    // 4. Create/update MedEx users profile (references auth.users, NO password column!)
    try {
      await supabase.from('users').upsert([{
        id: authUserId,
        email: cleanEmail,
        name: hospital.authorized_person || hospital.authorizedPerson,
        role: 'hospital',
        hospital_id: hospitalId,
        is_active: true,
        updated_at: nowIso,
      }], { onConflict: 'id' });
    } catch (userErr) {
      logger.warn('Supabase users profile upsert warning:', userErr.message);
    }

    // 5. Update hospital status to PENDING_APPROVAL in Supabase
    const { error: statusUpdateErr } = await supabase.from('hospitals').update({
      status: 'PENDING_APPROVAL',
      registered_date: todayDate,
      updated_at: nowIso,
    }).eq('id', hospitalId);

    if (statusUpdateErr) {
      logger.error('Supabase hospital status update failed:', statusUpdateErr.message);
      const err = new Error(`Database error updating registration status: ${statusUpdateErr.message}`);
      err.statusCode = 500;
      throw err;
    }

    // Update in-memory registry
    hospital.status = 'PENDING_APPROVAL';
    hospital.registeredDate = todayDate;
    hospital.registered_date = todayDate;
    hospital.updatedAt = nowIso;
    hospital.updated_at = nowIso;

    // 6. Statutory Audit Log
    await auditService.logEvent({
      action: 'HOSPITAL_REGISTRATION_SUBMITTED',
      entityType: 'HOSPITAL',
      entityId: hospitalId,
      actorRole: 'hospital',
      hospitalId,
      hospitalName: hospital.name,
      summary: `Hospital registration submitted for ${hospital.name} (${hospital.registrationNo || hospital.registration_no}) with ${uploadedDocs.length} compliance documents. Status set to PENDING_APPROVAL.`,
      resultingStatus: 'pending_approval',
      metadata: {
        registrationNo: hospital.registrationNo || hospital.registration_no,
        submittedDocuments: uploadedDocs.length,
      },
    });

    return {
      hospital: {
        id: hospital.id,
        name: hospital.name,
        registrationNo: hospital.registrationNo || hospital.registration_no,
        authorizedPerson: hospital.authorizedPerson || hospital.authorized_person,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
        receivingGate: hospital.receivingGate || hospital.receiving_gate,
        city: hospital.city,
        state: hospital.state,
        district: hospital.district,
        pincode: hospital.pincode,
        status: 'pending_approval',
        registeredDate: hospital.registeredDate,
        documentsCount: uploadedDocs.length,
      },
      status: 'pending_approval',
      message: 'Hospital registration submitted successfully. Your application is pending administrator approval.',
    };
  },

  /**
   * Get Registration Dossier & Status
   */
  async getRegistrationStatus(identifier) {
    if (!identifier) {
      const err = new Error('Identifier (hospitalId or email) is required.');
      err.statusCode = 400;
      throw err;
    }

    const rawId = String(identifier).trim();
    const clean = rawId.toLowerCase();
    const supabase = getSupabaseAdmin();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawId);
    let query = supabase.from('hospitals').select('*, hospital_documents(*)');
    if (isUuid) {
      query = query.eq('id', rawId);
    } else if (clean.includes('@')) {
      query = query.eq('email', clean);
    } else {
      query = query.eq('registration_no', rawId);
    }

    const { data: hospital, error: hospErr } = await query.maybeSingle();

    if (hospErr) {
      logger.error('Failed to query hospital in getRegistrationStatus:', hospErr.message);
      const err = new Error(`Database error querying hospital: ${hospErr.message}`);
      err.statusCode = 500;
      throw err;
    }

    if (!hospital) {
      // Check dev in-memory fallback
      const devHosp = authService.getDevHospitals().find((h) => 
        (isUuid && h.id === rawId) || 
        (h.email && h.email.toLowerCase() === clean) || 
        ((h.registrationNo || h.registration_no) === rawId)
      );

      if (!devHosp) {
        const err = new Error('Hospital registration record not found.');
        err.statusCode = 404;
        throw err;
      }

      const docs = await this.getRegistrationDocuments(devHosp.id);
      let campuses = devCampuses.filter((c) => c.hospital_id === devHosp.id);
      if (campuses.length === 0 && devHosp.address) {
        campuses = [{
          id: 'primary-campus',
          hospitalId: devHosp.id,
          hospital_id: devHosp.id,
          campusName: devHosp.campusName || devHosp.campus_name || 'Main Campus',
          campus_name: devHosp.campusName || devHosp.campus_name || 'Main Campus',
          isPrimary: true,
          is_primary: true,
          address: devHosp.address,
          state: devHosp.state,
          district: devHosp.district || '',
          city: devHosp.city,
          pincode: devHosp.pincode,
          receivingGate: devHosp.receiving_gate || devHosp.receivingGate || null,
          receiving_gate: devHosp.receiving_gate || devHosp.receivingGate || null,
        }];
      }

      return {
        hospital: {
          id: devHosp.id,
          name: devHosp.name,
          registrationNo: devHosp.registrationNo || devHosp.registration_no,
          issuingAuthority: devHosp.issuingAuthority || devHosp.issuing_authority,
          organizationType: devHosp.organizationType || devHosp.organization_type,
          authorizedPerson: devHosp.authorizedPerson || devHosp.authorized_person,
          designation: devHosp.designation,
          email: devHosp.email,
          phone: devHosp.phone,
          address: devHosp.address,
          receivingGate: devHosp.receivingGate || devHosp.receiving_gate,
          state: devHosp.state,
          district: devHosp.district,
          city: devHosp.city,
          pincode: devHosp.pincode,
          status: devHosp.status,
          rejectionReason: devHosp.rejectionReason || devHosp.rejection_reason,
          registeredDate: devHosp.registeredDate || devHosp.registered_date,
        },
        status: devHosp.status,
        campuses,
        documents: docs,
      };
    }

    const docs = await this.getRegistrationDocuments(hospital.id);

    // Query real persisted campuses from Supabase hospital_campuses table
    let campuses = [];
    try {
      const { data: dbCampuses, error: campErr } = await supabase
        .from('hospital_campuses')
        .select('*')
        .eq('hospital_id', hospital.id);
      if (!campErr && dbCampuses && dbCampuses.length > 0) {
        campuses = dbCampuses.map((c) => ({
          id: c.id,
          hospitalId: c.hospital_id,
          hospital_id: c.hospital_id,
          campusName: c.campus_name || 'Main Campus',
          campus_name: c.campus_name || 'Main Campus',
          isPrimary: c.is_primary ?? true,
          is_primary: c.is_primary ?? true,
          address: c.address,
          state: c.state,
          district: c.district || '',
          city: c.city,
          pincode: c.pincode,
          receivingGate: c.receiving_gate,
          receiving_gate: c.receiving_gate,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
    } catch (e) {
      logger.warn('Failed to query hospital_campuses from Supabase:', e.message);
    }

    if (campuses.length === 0) {
      const memoryCampuses = devCampuses.filter((c) => c.hospital_id === hospital.id);
      if (memoryCampuses.length > 0) {
        campuses = memoryCampuses.map((c) => ({
          ...c,
          campusName: c.campus_name || c.campusName || 'Main Campus',
          receivingGate: c.receiving_gate || c.receivingGate,
        }));
      }
    }

    if (campuses.length === 0 && hospital.address) {
      campuses = [{
        id: 'primary-campus',
        hospitalId: hospital.id,
        hospital_id: hospital.id,
        campusName: 'Main Campus',
        campus_name: 'Main Campus',
        isPrimary: true,
        is_primary: true,
        address: hospital.address,
        state: hospital.state,
        district: hospital.district || '',
        city: hospital.city,
        pincode: hospital.pincode,
        receivingGate: hospital.receiving_gate || hospital.receivingGate || null,
        receiving_gate: hospital.receiving_gate || hospital.receivingGate || null,
      }];
    }

    return {
      hospital: {
        id: hospital.id,
        name: hospital.name,
        registrationNo: hospital.registrationNo || hospital.registration_no,
        issuingAuthority: hospital.issuingAuthority || hospital.issuing_authority,
        organizationType: hospital.organizationType || hospital.organization_type,
        authorizedPerson: hospital.authorizedPerson || hospital.authorized_person,
        designation: hospital.designation,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
        receivingGate: hospital.receivingGate || hospital.receiving_gate,
        state: hospital.state,
        district: hospital.district,
        city: hospital.city,
        pincode: hospital.pincode,
        status: hospital.status,
        rejectionReason: hospital.rejectionReason || hospital.rejection_reason,
        registeredDate: hospital.registeredDate || hospital.registered_date,
      },
      status: hospital.status,
      campuses,
      documents: docs,
    };
  },

  /**
   * Generates secure short-lived signed URL for viewing a registration document.
   * Enforces strict institutional ownership (document must belong to hospitalId).
   * Bucket remains private and service role key is never exposed.
   */
  async getRegistrationDocumentViewUrl(hospitalId, documentId, expiresInSeconds = 900) {
    if (!hospitalId || !documentId) {
      const err = new Error('Both hospitalId and documentId are required.');
      err.statusCode = 400;
      err.code = 'INVALID_PARAMETERS';
      throw err;
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch document record
    let doc = null;
    try {
      const { data, error } = await supabase
        .from('hospital_documents')
        .select('*')
        .eq('id', documentId)
        .maybeSingle();
      if (!error && data) {
        doc = data;
      }
    } catch (e) {
      logger.warn('Failed to query hospital_documents from Supabase in getRegistrationDocumentViewUrl:', e.message);
    }

    if (!doc) {
      const devDocs = documentService.getDevDocuments ? documentService.getDevDocuments(hospitalId) : [];
      doc = devDocs.find((d) => d.id === documentId || d.storage_path?.includes(documentId));
    }

    if (!doc) {
      const err = new Error('Statutory document not found.');
      err.statusCode = 404;
      err.code = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    // 2. Institutional Ownership Verification (Strict: cross-hospital access strictly prohibited)
    const docHospitalId = doc.hospital_id || doc.hospitalId;
    if (docHospitalId !== hospitalId) {
      logger.warn(`Security violation: Cross-hospital document access attempt on document ${documentId}. Expected owner: ${docHospitalId}, requester: ${hospitalId}`);
      const err = new Error('Access restricted: You are not authorized to view this statutory document.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_DOCUMENT_ACCESS';
      throw err;
    }

    // 3. Generate short-lived signed URL from private Supabase bucket
    const targetStoragePath = doc.storage_path || doc.file_path;
    let signedUrl = null;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    if (supabase && targetStoragePath && !targetStoragePath.startsWith('/')) {
      try {
        const { data: signedData, error: signErr } = await supabase.storage
          .from('hospital-documents')
          .createSignedUrl(targetStoragePath, expiresInSeconds);

        if (!signErr && signedData?.signedUrl) {
          signedUrl = signedData.signedUrl;
        }
      } catch (err) {
        logger.warn('Failed to create Supabase signed URL:', err.message);
      }
    }

    const rawStreamUrl = `/api/hospitals/registration/documents/${encodeURIComponent(documentId)}/raw?hospitalId=${encodeURIComponent(hospitalId)}`;

    // Safe fallback tokenized streaming route if Supabase storage is offline or in local development
    if (!signedUrl) {
      signedUrl = rawStreamUrl;
    }

    return {
      documentId: doc.id,
      hospitalId: docHospitalId,
      documentType: doc.document_type || doc.documentType,
      documentName: doc.document_name || doc.original_filename || 'document.pdf',
      signedUrl,
      viewUrl: rawStreamUrl,
      expiresAt,
    };
  },

  /**
   * Helper to stream registration document inline with application/pdf header.
   */
  async getRegistrationDocumentBuffer(hospitalId, documentId) {
    if (!hospitalId || !documentId) {
      const err = new Error('Both hospitalId and documentId are required.');
      err.statusCode = 400;
      err.code = 'INVALID_PARAMETERS';
      throw err;
    }

    const supabase = getSupabaseAdmin();

    let doc = null;
    try {
      const { data, error } = await supabase
        .from('hospital_documents')
        .select('*')
        .eq('id', documentId)
        .maybeSingle();
      if (!error && data) {
        doc = data;
      }
    } catch (e) {}

    if (!doc) {
      const devDocs = documentService.getDevDocuments ? documentService.getDevDocuments(hospitalId) : [];
      doc = devDocs.find((d) => d.id === documentId || d.storage_path?.includes(documentId));
    }

    if (!doc) {
      const err = new Error('Statutory document not found.');
      err.statusCode = 404;
      err.code = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    const docHospitalId = doc.hospital_id || doc.hospitalId;
    if (docHospitalId !== hospitalId) {
      const err = new Error('Access restricted: You are not authorized to view this statutory document.');
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_DOCUMENT_ACCESS';
      throw err;
    }

    const targetStoragePath = doc.storage_path || doc.file_path;
    let buffer = null;

    if (supabase && targetStoragePath && !targetStoragePath.startsWith('/')) {
      try {
        const { data: blob, error: dlErr } = await supabase.storage
          .from('hospital-documents')
          .download(targetStoragePath);
        if (!dlErr && blob) {
          const arrayBuffer = await blob.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        }
      } catch (err) {
        logger.warn('Failed to download document from Supabase storage:', err.message);
      }
    }

    if (!buffer && doc.fileBuffer) {
      buffer = doc.fileBuffer;
    }

    // If still no buffer (e.g. mock test record without storage blob), generate minimal valid PDF
    if (!buffer) {
      const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 12 Tf 100 700 Td (${doc.document_type || 'MedEx Document'}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n320\n%%EOF`;
      buffer = Buffer.from(pdfContent);
    }

    return {
      buffer,
      mimeType: doc.mime_type || 'application/pdf',
      filename: doc.original_filename || doc.document_name || 'document.pdf',
    };
  },

  /**
   * Resubmit Registration after correction
   */
  async resubmitRegistration(hospitalId, updateData = {}) {
    if (!hospitalId) {
      const err = new Error('Hospital ID is required.');
      err.statusCode = 400;
      throw err;
    }

    const devHospitals = authService.getDevHospitals();
    const hospital = devHospitals.find((h) => h.id === hospitalId);

    if (!hospital) {
      const err = new Error('Hospital registration application not found.');
      err.statusCode = 404;
      throw err;
    }

    const nowIso = new Date().toISOString();
    hospital.status = 'pending_approval';
    hospital.rejectionReason = null;
    hospital.updatedAt = nowIso;
    hospital.updated_at = nowIso;

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('hospitals').update({
          status: 'pending_approval',
          rejection_reason: null,
          updated_at: nowIso,
        }).eq('id', hospitalId);
      } catch (err) {
        logger.warn('Supabase update warning in resubmitRegistration:', err.message);
      }
    }

    await auditService.logEvent({
      action: 'HOSPITAL_REGISTRATION_RESUBMITTED',
      entityType: 'HOSPITAL',
      entityId: hospitalId,
      actorRole: 'hospital',
      hospitalId,
      hospitalName: hospital.name,
      summary: `Hospital registration application resubmitted after correction by ${hospital.name}. Status updated to PENDING_APPROVAL.`,
      resultingStatus: 'pending_approval',
    });

    return {
      status: 'pending_approval',
      message: 'Application resubmitted successfully. Pending administrator review.',
    };
  },

  /**
   * Registers a new hospital application with validation and audit trail (legacy/direct)
   */
  async registerHospital(formData, reqUser = null) {
    // 1. Mandatory Field Validation
    const requiredFields = [
      { key: 'name', label: 'Hospital Name' },
      { key: 'registrationNo', label: 'Registration / License Number' },
      { key: 'authorizedPerson', label: 'Authorized Liaison Person' },
      { key: 'email', label: 'Official Email' },
      { key: 'phone', label: 'Contact Phone' },
      { key: 'address', label: 'Campus Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'pincode', label: 'Postal Code' },
    ];

    const missingFields = requiredFields
      .filter((f) => !formData[f.key] || !String(formData[f.key]).trim())
      .map((f) => f.label);

    if (missingFields.length > 0) {
      const err = new Error(`Validation Error: Missing required fields: ${missingFields.join(', ')}`);
      err.statusCode = 422;
      err.missingFields = missingFields;
      throw err;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      const err = new Error('Validation Error: Invalid official email address format.');
      err.statusCode = 422;
      throw err;
    }

    const cleanRegNo = formData.registrationNo.trim().toUpperCase();

    // 2. Duplicate Check
    const devHospitals = authService.getDevHospitals();
    const duplicateInDev = devHospitals.find(
      (h) => (h.email && h.email.toLowerCase() === cleanEmail) ||
             (h.registrationNo && h.registrationNo.toUpperCase() === cleanRegNo) ||
             (h.registration_no && h.registration_no.toUpperCase() === cleanRegNo)
    );

    if (duplicateInDev) {
      const err = new Error(`Duplicate Registration: A hospital with email ${cleanEmail} or registration number ${cleanRegNo} is already registered.`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_REGISTRATION';
      throw err;
    }

    if (isConfigured && supabaseAdmin) {
      try {
        const { data: existingHosp, error: checkErr } = await supabaseAdmin
          .from('hospitals')
          .select('id, email, registration_no')
          .or(`email.eq.${cleanEmail},registration_no.eq.${cleanRegNo}`)
          .limit(1);

        if (!checkErr && existingHosp && existingHosp.length > 0) {
          const err = new Error(`Duplicate Registration: A hospital with email ${cleanEmail} or registration number ${cleanRegNo} is already registered.`);
          err.statusCode = 409;
          err.code = 'DUPLICATE_REGISTRATION';
          throw err;
        }
      } catch (checkEx) {
        if (checkEx.statusCode === 409) throw checkEx;
        logger.warn('Remote duplicate check warning:', checkEx.message);
      }
    }

    // 3. Document Preparation
    const rawDocs = formData.documents || [];
    const hospitalId = uuidv4();
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    const normalizedDocs = rawDocs.map((doc, idx) => {
      const docId = doc.id || uuidv4();
      const docType = doc.documentType || doc.type || 'Registration Certificate';
      const docName = doc.documentName || doc.name || `${docType.replace(/\s+/g, '_')}.pdf`;
      const storagePath = `${hospitalId}/${docName}`;

      return {
        id: docId,
        hospitalId,
        hospital_id: hospitalId,
        documentType: docType,
        document_type: docType,
        documentName: docName,
        document_name: docName,
        originalFilename: doc.name || docName,
        original_filename: doc.name || docName,
        storagePath,
        storage_path: storagePath,
        filePath: `/uploads/documents/${docName}`,
        file_path: `/uploads/documents/${docName}`,
        mimeType: doc.mimeType || 'application/pdf',
        mime_type: doc.mimeType || 'application/pdf',
        fileSize: doc.size || '2.4 MB',
        file_size: doc.size || '2.4 MB',
        submissionStatus: 'submitted',
        submission_status: 'submitted',
        documentStatus: 'pending',
        document_status: 'pending',
        uploadedBy: formData.authorizedPerson.trim(),
        uploaded_by: formData.authorizedPerson.trim(),
        uploadedAt: nowIso,
        uploaded_at: nowIso,
      };
    });

    // 4. Construct Hospital Entity
    const hospitalRecord = {
      id: hospitalId,
      name: formData.name.trim(),
      registrationNo: cleanRegNo,
      registration_no: cleanRegNo,
      authorizedPerson: formData.authorizedPerson.trim(),
      authorized_person: formData.authorizedPerson.trim(),
      email: cleanEmail,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      status: 'PENDING_APPROVAL',
      registeredDate: todayDate,
      registered_date: todayDate,
      verifiedDate: null,
      verified_date: null,
      rejectionReason: null,
      rejection_reason: null,
      documents: normalizedDocs,
      createdAt: nowIso,
      created_at: nowIso,
      updatedAt: nowIso,
      updated_at: nowIso,
    };

    // 5. Persist to Database (Supabase with in-memory sync)
    if (isConfigured && supabaseAdmin) {
      try {
        const { error: hospInsertErr } = await supabaseAdmin.from('hospitals').insert([{
          id: hospitalRecord.id,
          name: hospitalRecord.name,
          registration_no: hospitalRecord.registration_no,
          authorized_person: hospitalRecord.authorized_person,
          email: hospitalRecord.email,
          phone: hospitalRecord.phone,
          address: hospitalRecord.address,
          city: hospitalRecord.city,
          state: hospitalRecord.state,
          pincode: hospitalRecord.pincode,
          status: 'PENDING_APPROVAL',
          registered_date: hospitalRecord.registered_date,
        }]);

        if (hospInsertErr) {
          logger.warn('Supabase hospital insert warning:', hospInsertErr.message);
        }

        if (normalizedDocs.length > 0) {
          const docPayload = normalizedDocs.map((d) => ({
            id: d.id,
            hospital_id: hospitalRecord.id,
            document_type: d.document_type,
            document_name: d.document_name,
            original_filename: d.original_filename,
            storage_path: d.storage_path,
            file_path: d.file_path,
            file_size: d.file_size,
            mime_type: d.mime_type,
            submission_status: 'submitted',
            document_status: 'pending',
            uploaded_by: d.uploaded_by,
          }));

          const { error: docInsertErr } = await supabaseAdmin.from('hospital_documents').insert(docPayload);
          if (docInsertErr) {
            logger.warn('Supabase document insert warning:', docInsertErr.message);
          }
        }

        // If authenticated user provided or exists, associate user profile
        if (reqUser?.id) {
          await supabaseAdmin
            .from('users')
            .update({ hospital_id: hospitalRecord.id })
            .eq('id', reqUser.id);
        }
      } catch (dbEx) {
        logger.warn('Supabase transaction exception in registerHospital:', dbEx.message);
      }
    }

    // Always maintain in-memory registry for local testing & sandbox
    devHospitals.unshift(hospitalRecord);

    // 6. Record Statutory Audit Event
    await auditService.logEvent({
      action: 'HOSPITAL_REGISTERED',
      entityType: 'HOSPITAL',
      entityId: hospitalRecord.id,
      actorRole: reqUser?.role || 'hospital',
      hospitalId: hospitalRecord.id,
      hospitalName: hospitalRecord.name,
      summary: `Hospital registration application submitted for ${hospitalRecord.name} (${hospitalRecord.registrationNo}) with ${normalizedDocs.length} compliance documents. Status set to PENDING_APPROVAL.`,
      resultingStatus: 'PENDING_APPROVAL',
      metadata: {
        registrationNo: hospitalRecord.registrationNo,
        submittedDocuments: normalizedDocs.length,
        city: hospitalRecord.city,
        state: hospitalRecord.state,
      },
    });

    // 7. Return Pending Approval Response (Strictly NO auto-login session!)
    return {
      hospital: {
        id: hospitalRecord.id,
        name: hospitalRecord.name,
        registrationNo: hospitalRecord.registrationNo,
        authorizedPerson: hospitalRecord.authorizedPerson,
        email: hospitalRecord.email,
        phone: hospitalRecord.phone,
        city: hospitalRecord.city,
        state: hospitalRecord.state,
        status: 'PENDING_APPROVAL',
        registeredDate: hospitalRecord.registeredDate,
        documentsCount: normalizedDocs.length,
      },
      status: 'PENDING_APPROVAL',
      message: 'Hospital Registered Successfully. Your registration is pending admin approval. Kindly wait for admin approval.',
    };
  },

  /**
   * Retrieves APPROVED hospitals only for the public / approved directory
   * Strictly filters out PENDING, UNDER_REVIEW, REJECTED, and SUSPENDED hospitals.
   */
  async getApprovedHospitals({ search = '', city = '', state = '', sortBy = 'name-asc', limit = 50, page = 1 } = {}) {
    let approvedList = [];

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabaseAnon;
        let query = client
          .from('hospitals')
          .select('*, hospital_documents(*)')
          .in('status', ['APPROVED', 'approved', 'verified']);

        if (city && city !== 'all') query = query.ilike('city', `%${city}%`);
        if (state && state !== 'all') query = query.ilike('state', `%${state}%`);
        if (search) {
          query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,registration_no.ilike.%${search}%`);
        }

        const { data, error } = await query.order('name');
        if (!error && data && data.length > 0) {
          approvedList = data;
        }
      } catch (err) {
        logger.warn('Supabase query in getApprovedHospitals failed, falling back to local store:', err.message);
      }
    }

    if (approvedList.length === 0) {
      const devHospitals = authService.getDevHospitals();
      approvedList = devHospitals.filter(
        (h) => ['APPROVED', 'approved', 'verified'].includes(h.status)
      );

      if (search) {
        const q = search.toLowerCase();
        approvedList = approvedList.filter(
          (h) => (h.name && h.name.toLowerCase().includes(q)) ||
                 (h.city && h.city.toLowerCase().includes(q)) ||
                 (h.state && h.state.toLowerCase().includes(q)) ||
                 (h.registrationNo && h.registrationNo.toLowerCase().includes(q)) ||
                 (h.registration_no && h.registration_no.toLowerCase().includes(q))
        );
      }

      if (city && city !== 'all') {
        approvedList = approvedList.filter((h) => h.city && h.city.toLowerCase() === city.toLowerCase());
      }
      if (state && state !== 'all') {
        approvedList = approvedList.filter((h) => h.state && h.state.toLowerCase() === state.toLowerCase());
      }
    }

    // Attach basic stats (zero safe defaults if inventory/trading not yet populated)
    const enriched = approvedList.map((h) => ({
      id: h.id,
      name: h.name,
      registrationNo: h.registrationNo || h.registration_no,
      authorizedPerson: h.authorizedPerson || h.authorized_person,
      email: h.email,
      phone: h.phone,
      address: h.address,
      city: h.city,
      state: h.state,
      pincode: h.pincode,
      status: 'APPROVED',
      registeredDate: h.registeredDate || h.registered_date,
      verifiedDate: h.verifiedDate || h.verified_date || h.approved_at,
      listingsCount: h.listingsCount || 0,
      totalUnits: h.totalUnits || 0,
      totalTrades: h.totalTrades || 0,
      documents: h.documents || h.hospital_documents || [],
    }));

    return {
      hospitals: enriched,
      total: enriched.length,
      page: Number(page),
      limit: Number(limit),
    };
  },

  /**
   * Retrieves full details for an APPROVED hospital (Admin Directory inspection)
   * Strictly blocks inspection of pending/rejected hospitals through this endpoint.
   */
  async getApprovedHospitalDetails(hospitalId) {
    let hospital = null;

    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabaseAnon;
        const { data, error } = await client
          .from('hospitals')
          .select('*, hospital_documents(*)')
          .eq('id', hospitalId)
          .single();

        if (!error && data) hospital = data;
      } catch (err) {
        logger.warn('Failed to fetch hospital details from Supabase:', err.message);
      }
    }

    if (!hospital) {
      const devHospitals = authService.getDevHospitals();
      hospital = devHospitals.find((h) => h.id === hospitalId) || null;
    }

    if (!hospital) {
      const err = new Error('Hospital facility not found.');
      err.statusCode = 404;
      throw err;
    }

    // Guardrail: must be an approved hospital
    const statusClean = (hospital.status || '').toUpperCase();
    if (!['APPROVED', 'VERIFIED'].includes(statusClean)) {
      const err = new Error('Hospital facility is not in the approved directory.');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: hospital.id,
      name: hospital.name,
      registrationNo: hospital.registrationNo || hospital.registration_no,
      authorizedPerson: hospital.authorizedPerson || hospital.authorized_person,
      email: hospital.email,
      phone: hospital.phone,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      pincode: hospital.pincode,
      status: 'APPROVED',
      registeredDate: hospital.registeredDate || hospital.registered_date,
      verifiedDate: hospital.verifiedDate || hospital.verified_date || hospital.approved_at,
      documents: hospital.documents || hospital.hospital_documents || [],
      // Safe metrics
      listingsCount: hospital.listingsCount || 0,
      totalInventoryUnits: hospital.totalUnits || 0,
      tradingActivity: hospital.tradingActivity || { purchasesCount: 0, salesCount: 0, totalTrades: 0 },
      purchaseStats: { totalAmount: 0, units: 0 },
      salesStats: { totalAmount: 0, units: 0 },
    };
  },

  /**
   * Retrieves current authenticated hospital user's own institutional profile
   */
  async getMyHospitalProfile(reqUser) {
    const hospitalId = reqUser?.hospitalId || reqUser?.id;
    if (!hospitalId) {
      const err = new Error('No hospital profile associated with authenticated session.');
      err.statusCode = 404;
      throw err;
    }

    let hospital = null;
    if (isConfigured) {
      try {
        const client = supabaseAdmin || supabaseAnon;
        const { data, error } = await client
          .from('hospitals')
          .select('*, hospital_documents(*)')
          .eq('id', hospitalId)
          .single();

        if (!error && data) hospital = data;
      } catch (err) {
        logger.warn('Failed to query hospital in getMyHospitalProfile:', err.message);
      }
    }

    if (!hospital) {
      const devHospitals = authService.getDevHospitals();
      hospital = devHospitals.find(
        (h) => h.id === hospitalId || (reqUser.email && h.email && h.email.toLowerCase() === reqUser.email.toLowerCase())
      );
    }

    if (!hospital) {
      const err = new Error('Hospital profile not found.');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: hospital.id,
      name: hospital.name,
      registrationNo: hospital.registrationNo || hospital.registration_no,
      authorizedPerson: hospital.authorizedPerson || hospital.authorized_person,
      email: hospital.email,
      phone: hospital.phone,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      pincode: hospital.pincode,
      status: hospital.status,
      registeredDate: hospital.registeredDate || hospital.registered_date,
      verifiedDate: hospital.verifiedDate || hospital.verified_date || hospital.approved_at,
      rejectionReason: hospital.rejectionReason || hospital.rejection_reason,
      documents: hospital.documents || hospital.hospital_documents || [],
    };
  },

  /**
   * Updates current authenticated hospital's contact and campus information
   * Never permits updating status, registrationNo, or approval metadata through this endpoint.
   */
  async updateMyHospitalProfile(reqUser, updateData) {
    const hospitalId = reqUser?.hospitalId || reqUser?.id;
    if (!hospitalId) {
      const err = new Error('No hospital profile associated with authenticated session.');
      err.statusCode = 404;
      throw err;
    }

    // Prohibit tampering with institutional verification status or IDs
    const allowedFields = ['authorizedPerson', 'phone', 'address', 'city', 'state', 'pincode'];
    const sanitizedUpdate = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedUpdate[field] = String(updateData[field]).trim();
      }
    }

    const devHospitals = authService.getDevHospitals();
    const idx = devHospitals.findIndex((h) => h.id === hospitalId);
    if (idx !== -1) {
      devHospitals[idx] = {
        ...devHospitals[idx],
        ...sanitizedUpdate,
        updatedAt: new Date().toISOString(),
      };
    }

    if (isConfigured && supabaseAdmin) {
      try {
        const dbPayload = {
          updated_at: new Date().toISOString(),
        };
        if (sanitizedUpdate.authorizedPerson) dbPayload.authorized_person = sanitizedUpdate.authorizedPerson;
        if (sanitizedUpdate.phone) dbPayload.phone = sanitizedUpdate.phone;
        if (sanitizedUpdate.address) dbPayload.address = sanitizedUpdate.address;
        if (sanitizedUpdate.city) dbPayload.city = sanitizedUpdate.city;
        if (sanitizedUpdate.state) dbPayload.state = sanitizedUpdate.state;
        if (sanitizedUpdate.pincode) dbPayload.pincode = sanitizedUpdate.pincode;

        await supabaseAdmin.from('hospitals').update(dbPayload).eq('id', hospitalId);
      } catch (err) {
        logger.warn('Supabase update failed in updateMyHospitalProfile:', err.message);
      }
    }

    await auditService.logEvent({
      action: 'HOSPITAL_PROFILE_UPDATED',
      entityType: 'HOSPITAL',
      entityId: hospitalId,
      actorRole: 'hospital',
      hospitalId,
      hospitalName: devHospitals[idx]?.name || 'Hospital Facility',
      summary: `Hospital contact profile updated by authenticated liaison.`,
      resultingStatus: devHospitals[idx]?.status || 'APPROVED',
      metadata: sanitizedUpdate,
    });

    return devHospitals[idx] || sanitizedUpdate;
  },

  /**
   * Suspends hospital operational privileges (Admin only)
   */
  async suspendHospital(hospitalId, reason, adminName = 'Super Administrator') {
    const devHospitals = authService.getDevHospitals();
    const idx = devHospitals.findIndex((h) => h.id === hospitalId);
    if (idx === -1) {
      const err = new Error('Hospital not found');
      err.statusCode = 404;
      throw err;
    }

    devHospitals[idx].status = 'suspended';
    devHospitals[idx].suspensionReason = reason || 'Statutory regulatory compliance review';
    devHospitals[idx].suspendedDate = new Date().toISOString().split('T')[0];

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('hospitals').update({
          status: 'suspended',
          suspension_reason: reason,
          suspended_date: new Date().toISOString(),
        }).eq('id', hospitalId);
      } catch (err) {
        logger.warn('Supabase update failed for suspendHospital:', err.message);
      }
    }

    await auditService.logEvent({
      action: 'HOSPITAL_SUSPENDED',
      entityType: 'HOSPITAL',
      entityId: hospitalId,
      actorRole: 'admin',
      hospitalId,
      hospitalName: devHospitals[idx].name,
      summary: `Admin ${adminName} suspended ${devHospitals[idx].name}. Reason: ${reason}`,
      resultingStatus: 'suspended',
      metadata: { reason },
    });

    return devHospitals[idx];
  },

  /**
   * Reactivates a suspended hospital account (Admin only)
   */
  async reactivateHospital(hospitalId, adminName = 'Super Administrator') {
    const devHospitals = authService.getDevHospitals();
    const idx = devHospitals.findIndex((h) => h.id === hospitalId);
    if (idx === -1) {
      const err = new Error('Hospital not found');
      err.statusCode = 404;
      throw err;
    }

    devHospitals[idx].status = 'verified';
    devHospitals[idx].suspensionReason = null;
    devHospitals[idx].suspendedDate = null;

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('hospitals').update({
          status: 'verified',
          suspension_reason: null,
          suspended_date: null,
        }).eq('id', hospitalId);
      } catch (err) {
        logger.warn('Supabase update failed for reactivateHospital:', err.message);
      }
    }

    await auditService.logEvent({
      action: 'HOSPITAL_REACTIVATED',
      entityType: 'HOSPITAL',
      entityId: hospitalId,
      actorRole: 'admin',
      hospitalId,
      hospitalName: devHospitals[idx].name,
      summary: `Admin ${adminName} reactivated ${devHospitals[idx].name}. Operational trading restored.`,
      resultingStatus: 'verified',
    });

    return devHospitals[idx];
  },

  /**
   * Retrieves a hospital profile by ID (from Supabase or in-memory seed)
   */
  async getHospitalById(hospitalId) {
    if (!hospitalId) return null;

    if (isConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('hospitals')
          .select('*')
          .eq('id', hospitalId)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            registrationNo: data.registration_no,
            authorizedPerson: data.authorized_person,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            status: data.status,
            latitude: data.latitude,
            longitude: data.longitude,
          };
        }
      } catch (err) {
        // fallback
      }
    }

    const devHospitals = authService.getDevHospitals();
    const matched = devHospitals.find(
      (h) => h.id === hospitalId ||
             (hospitalId === '11111111-1111-1111-1111-111111111111' && (h.id === 'hosp-1' || h.name.includes('Apollo'))) ||
             (hospitalId === '22222222-2222-2222-2222-222222222222' && (h.name.includes('Fortis')))
    );

    if (matched) {
      return {
        id: hospitalId,
        name: matched.name,
        registrationNo: matched.registrationNo || matched.registration_no,
        authorizedPerson: matched.authorizedPerson,
        email: matched.email,
        phone: matched.phone,
        address: matched.address,
        city: matched.city,
        state: matched.state,
        pincode: matched.pincode,
        status: matched.status,
      };
    }

    if (hospitalId === '11111111-1111-1111-1111-111111111111') {
      return {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Apollo Hospital & Multi-Specialty Centre',
        registrationNo: 'REG-DL-2023-0891',
        email: 'apollo.mumbai@medex.org',
        city: 'New Delhi',
        state: 'Delhi',
        status: 'verified',
      };
    }
    if (hospitalId === '22222222-2222-2222-2222-222222222222') {
      return {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Fortis Memorial Research Institute',
        registrationNo: 'REG-HR-2023-4412',
        email: 'fortis.gurugram@medex.org',
        city: 'Gurugram',
        state: 'Haryana',
        status: 'verified',
      };
    }

    return {
      id: hospitalId,
      name: 'Authorized Hospital Partner',
      city: 'Metro',
      state: 'India',
      status: 'verified',
    };
  }
};

module.exports = hospitalService;

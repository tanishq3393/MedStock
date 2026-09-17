const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const environment = require('../../config/environment');
const { getSupabaseAdmin, isConfigured, supabaseAdmin } = require('../../config/supabase');
const otpService = require('../../shared/services/otpService');
const auditService = require('../../shared/services/auditService');
const logger = require('../../shared/utils/logger');
const { validateDocumentUpload } = require('../../shared/utils/documentValidator');

// In-memory admin store for test isolation and fallback
const devAdminProfiles = new Map();
const devAdminDocuments = new Map();

// Reserved system usernames
const RESERVED_USERNAMES = new Set(['root', 'system', 'null', 'undefined', 'api']);

class AdminRegistrationService {
  /**
   * Retrieves registration runtime configuration
   */
  getConfig() {
    return {
      emailVerificationRequired: Boolean(environment.features?.emailVerificationRequired),
    };
  }

  /**
   * Checks if a User ID (username) is available
   */
  async checkUsername(rawUsername) {
    if (!rawUsername || typeof rawUsername !== 'string') {
      return { available: false, message: 'User ID is required.' };
    }

    const username = rawUsername.trim().toLowerCase();

    if (username.length < 3 || username.length > 50) {
      return { available: false, message: 'User ID must be between 3 and 50 characters.' };
    }

    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
      return { available: false, message: 'User ID may only contain alphanumeric characters, dots, underscores, and hyphens.' };
    }

    if (RESERVED_USERNAMES.has(username)) {
      return { available: false, message: 'This User ID is reserved by the platform.' };
    }

    // Check in-memory store
    for (const [_, profile] of devAdminProfiles) {
      if (profile.username.toLowerCase() === username) {
        return { available: false, message: 'User ID is already taken.' };
      }
    }

    // Check Supabase if configured
    if (isConfigured && supabaseAdmin) {
      try {
        const { data: profileMatch } = await supabaseAdmin
          .from('admin_profiles')
          .select('id, username')
          .ilike('username', username)
          .maybeSingle();

        if (profileMatch) {
          return { available: false, message: 'User ID is already taken.' };
        }

        const { data: userMatch } = await supabaseAdmin
          .from('users')
          .select('id, username')
          .ilike('username', username)
          .maybeSingle();

        if (userMatch) {
          return { available: false, message: 'User ID is already taken.' };
        }

        const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
        const authMatch = authList?.users?.find(
          (u) => u.user_metadata?.username?.toLowerCase() === username
        );
        if (authMatch) {
          return { available: false, message: 'User ID is already taken.' };
        }
      } catch (dbErr) {
        logger.warn('Error checking username in Supabase:', dbErr.message);
      }
    }

    return { available: true, message: 'User ID is available.' };
  }

  /**
   * Checks if an official email is already registered
   */
  async checkEmail(rawEmail) {
    if (!rawEmail || typeof rawEmail !== 'string') {
      return { available: false, message: 'Email address is required.' };
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { available: false, message: 'Invalid email address format.' };
    }

    // Check in-memory store
    for (const [_, profile] of devAdminProfiles) {
      if (profile.email.toLowerCase() === email) {
        return { available: false, message: 'Email is already registered as an administrator.' };
      }
    }

    // Check Supabase if configured
    if (isConfigured && supabaseAdmin) {
      try {
        const { data: userMatch } = await supabaseAdmin
          .from('users')
          .select('id, email, role')
          .ilike('email', email)
          .maybeSingle();

        if (userMatch && userMatch.role === 'admin') {
          return { available: false, message: 'Email is already registered as an administrator.' };
        }
      } catch (dbErr) {
        logger.warn('Error checking email in Supabase:', dbErr.message);
      }
    }

    return { available: true, message: 'Email is available.' };
  }

  /**
   * Validates and securely stores statutory Authorization Letter
   */
  async uploadAuthorizationLetter({ fileBuffer, originalFilename, mimeType = 'application/pdf' }) {
    if (!fileBuffer || fileBuffer.length === 0) {
      const err = new Error('Authorization letter file is required.');
      err.statusCode = 400;
      err.code = 'INVALID_DOCUMENT';
      throw err;
    }

    const validated = validateDocumentUpload({
      buffer: fileBuffer,
      originalFilename: originalFilename || 'Authorization_Letter.pdf',
      mimeType,
    });

    const docId = crypto.randomUUID();
    const storagePath = `admin-letters/${validated.storageFilename}`;
    const nowIso = new Date().toISOString();

    const docRecord = {
      documentId: docId,
      documentType: 'AUTHORIZATION_LETTER',
      documentName: validated.originalFilename,
      originalFilename: validated.originalFilename,
      storagePath,
      filePath: storagePath,
      fileSize: validated.sizeDisplay,
      fileSizeBytes: validated.sizeBytes,
      mimeType: 'application/pdf',
      documentStatus: 'verified',
      uploadedAt: nowIso,
    };

    // Store in dev buffer
    devAdminDocuments.set(docId, {
      ...docRecord,
      buffer: validated.buffer,
    });

    // If Supabase is configured and in production/connected mode, upload to private bucket
    if (isConfigured && supabaseAdmin && process.env.NODE_ENV !== 'test') {
      try {
        await supabaseAdmin.storage
          .from('hospital-documents')
          .upload(storagePath, validated.buffer, {
            contentType: 'application/pdf',
            upsert: true,
          });
      } catch (storageErr) {
        logger.warn('Supabase storage upload warning for admin letter:', storageErr.message);
      }
    }

    return docRecord;
  }

  /**
   * Atomic Administrator Registration submission
   */
  async submitRegistration(formData) {
    // ----------------------------------------------------
    // STEP 1 VALIDATION: Administrator Information
    // ----------------------------------------------------
    const legalName = (formData.fullName || formData.legalName || '').trim();
    if (!legalName || legalName.length < 2) {
      const err = new Error('Supervisory Officer Legal Name is required (minimum 2 characters).');
      err.statusCode = 422;
      throw err;
    }

    const email = (formData.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const err = new Error('A valid Government / Regulatory Work Email address is required.');
      err.statusCode = 422;
      throw err;
    }

    const phone = (formData.phone || '').trim();
    const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
    if (!phone || !phoneRegex.test(phone)) {
      const err = new Error('A valid contact phone number is required.');
      err.statusCode = 422;
      throw err;
    }

    // ----------------------------------------------------
    // STEP 2 VALIDATION: Regulatory Authority
    // ----------------------------------------------------
    const regulatoryAuthority = (formData.regulatoryAuthority || '').trim();
    if (!regulatoryAuthority) {
      const err = new Error('Regulatory Authority / Department is required.');
      err.statusCode = 422;
      throw err;
    }

    const department = (formData.department || '').trim();
    if (!department) {
      const err = new Error('Official Department information is required.');
      err.statusCode = 422;
      throw err;
    }

    const designation = (formData.designation || '').trim();
    if (!designation) {
      const err = new Error('Official Role / Designation is required.');
      err.statusCode = 422;
      throw err;
    }

    const employeeId = (formData.employeeId || '').trim();
    if (!employeeId) {
      const err = new Error('Government / Regulatory Employee ID is required.');
      err.statusCode = 422;
      throw err;
    }

    // ----------------------------------------------------
    // STEP 3 VALIDATION: Verification & Credentials
    // ----------------------------------------------------
    // 1. Email OTP Verification Requirement
    const isEmailVerificationRequired = Boolean(environment.features?.emailVerificationRequired);
    const hasValidToken = Boolean(formData.verificationToken && otpService.isEmailVerified(email, formData.verificationToken));
    const emailVerified = hasValidToken;
    const emailVerificationStatus = emailVerified
      ? 'VERIFIED'
      : (isEmailVerificationRequired ? 'UNVERIFIED' : 'TEMPORARILY_SKIPPED');

    if (isEmailVerificationRequired && !emailVerified) {
      const err = new Error('Official work email OTP verification is required before submission.');
      err.statusCode = 400;
      err.code = 'EMAIL_NOT_VERIFIED';
      throw err;
    }

    // 2. User ID (strictly above password in UI)
    const username = (formData.username || formData.userId || '').trim().toLowerCase();
    const usernameCheck = await this.checkUsername(username);
    if (!usernameCheck.available) {
      const err = new Error(usernameCheck.message || 'User ID is unavailable.');
      err.statusCode = 409;
      err.code = 'DUPLICATE_USER_ID';
      throw err;
    }

    // 3. Password Requirements
    const password = formData.password || '';
    const confirmPassword = formData.confirmPassword || '';

    if (!password || password.length < 8) {
      const err = new Error('Supervisory password must be at least 8 characters long.');
      err.statusCode = 422;
      err.code = 'WEAK_PASSWORD';
      throw err;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      const err = new Error('Password must include at least one uppercase letter, one lowercase letter, and one numeric digit.');
      err.statusCode = 422;
      err.code = 'WEAK_PASSWORD';
      throw err;
    }

    if (password !== confirmPassword) {
      const err = new Error('Create Password and Confirm Password do not match.');
      err.statusCode = 422;
      err.code = 'PASSWORD_MISMATCH';
      throw err;
    }

    // 4. Authorization Letter Document
    const documentMeta = formData.authorizationDocument || formData.document;
    if (!documentMeta || (!documentMeta.documentId && !documentMeta.storagePath && !documentMeta.filePath)) {
      const err = new Error('Government / Regulatory Authorization Letter must be uploaded.');
      err.statusCode = 422;
      err.code = 'MISSING_DOCUMENT';
      throw err;
    }

    // ----------------------------------------------------
    // PERSISTENCE & IDENTITY CREATION
    // ----------------------------------------------------
    const nowIso = new Date().toISOString();
    const adminId = crypto.randomUUID();
    let authUserId = null;

    // 1. Supabase Auth Identity Creation
    if (isConfigured && supabaseAdmin) {
      try {
        const { data: createdAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: legalName,
            role: 'admin',
            username,
            regulatory_authority: regulatoryAuthority,
            department,
            designation,
            employee_id: employeeId,
          },
        });

        if (!authErr && createdAuth?.user) {
          authUserId = createdAuth.user.id;
        } else if (authErr) {
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const match = userList?.users?.find((u) => u.email.toLowerCase() === email);
          if (match) {
            authUserId = match.id;
            await supabaseAdmin.auth.admin.updateUserById(match.id, {
              password,
              user_metadata: {
                name: legalName,
                role: 'admin',
                username,
                regulatory_authority: regulatoryAuthority,
                department,
                designation,
                employee_id: employeeId,
              },
            });
          } else {
            logger.warn('Supabase Auth user creation error:', authErr.message);
          }
        }
      } catch (authEx) {
        logger.warn('Supabase Auth creation exception:', authEx.message);
      }
    }

    if (!authUserId) {
      authUserId = crypto.randomUUID();
    }

    // 2. Canonical users profile table (linked to auth.users, NO password column)
    const userProfileRecord = {
      id: authUserId,
      email,
      name: legalName,
      role: 'admin',
      department,
      phone,
      username,
      designation,
      regulatory_authority: regulatoryAuthority,
      employee_id: employeeId,
      email_verified: emailVerified,
      email_verified_at: emailVerified ? nowIso : null,
      is_active: true,
      updated_at: nowIso,
    };

    if (isConfigured && supabaseAdmin) {
      try {
        const { error: upsertErr } = await supabaseAdmin.from('users').upsert([userProfileRecord], { onConflict: 'id' });
        if (upsertErr) {
          logger.warn(`Notice: Migration '20260917000001_admin_registration_system.sql' pending on database (${upsertErr.message}). Applying backward-compatible baseline schema write to preserve canonical admin role.`);
          const baselineRecord = {
            id: authUserId,
            email,
            name: legalName,
            role: 'admin',
            department,
            phone,
            is_active: true,
            updated_at: nowIso,
          };
          const { error: baseErr } = await supabaseAdmin.from('users').upsert([baselineRecord], { onConflict: 'id' });
          if (baseErr) {
            logger.error('Supabase users profile baseline upsert error:', baseErr.message);
          }
        }
      } catch (userErr) {
        logger.warn('Supabase users profile upsert error:', userErr.message);
      }
    }

    // 3. Dedicated admin_profiles table
    const adminProfileRecord = {
      id: adminId,
      user_id: authUserId,
      username,
      legal_name: legalName,
      email,
      phone,
      regulatory_authority: regulatoryAuthority,
      department,
      designation,
      employee_id: employeeId,
      status: 'active',
      email_verified: emailVerified,
      email_verified_at: emailVerified ? nowIso : null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('admin_profiles').upsert([adminProfileRecord], { onConflict: 'username' });
      } catch (adminErr) {
        logger.warn('Supabase admin_profiles upsert error:', adminErr.message);
      }
    }

    // 4. Dedicated admin_documents table
    const documentId = documentMeta.documentId || crypto.randomUUID();
    const adminDocRecord = {
      id: documentId,
      admin_id: adminId,
      user_id: authUserId,
      document_type: 'AUTHORIZATION_LETTER',
      document_name: documentMeta.documentName || 'Authorization_Letter.pdf',
      original_filename: documentMeta.originalFilename || 'Authorization_Letter.pdf',
      file_path: documentMeta.filePath || documentMeta.storagePath || `admin-letters/${documentId}.pdf`,
      storage_path: documentMeta.storagePath || documentMeta.filePath || `admin-letters/${documentId}.pdf`,
      file_size: documentMeta.fileSize || '1.0 MB',
      file_size_bytes: documentMeta.fileSizeBytes || 1024 * 1024,
      mime_type: documentMeta.mimeType || 'application/pdf',
      document_status: 'verified',
      uploaded_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (isConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('admin_documents').upsert([adminDocRecord], { onConflict: 'id' });
      } catch (docErr) {
        logger.warn('Supabase admin_documents upsert error:', docErr.message);
      }
    }

    // In-memory registration cache for dev/testing
    const passwordHash = await bcrypt.hash(password, 10);
    devAdminProfiles.set(username, {
      ...adminProfileRecord,
      passwordHash,
      plainPassword: password, // For tests only
      document: adminDocRecord,
    });

    // 5. Audit Trail
    await auditService.logEvent({
      action: 'ADMIN_REGISTRATION',
      entityType: 'ADMIN',
      entityId: adminId,
      actorRole: 'admin',
      summary: `Regulatory Administrator registered: ${legalName} (${username}) - ${regulatoryAuthority} / ${department}. Email status: ${emailVerificationStatus}.`,
      resultingStatus: 'active',
      metadata: {
        username,
        email,
        regulatoryAuthority,
        department,
        designation,
        employeeId,
        emailVerificationStatus,
      },
    }).catch(() => {});

    return {
      admin: {
        id: adminId,
        userId: authUserId,
        username,
        legalName,
        email,
        phone,
        regulatoryAuthority,
        department,
        designation,
        employeeId,
        role: 'admin',
        emailVerified,
        emailVerificationStatus,
      },
      message: 'Regulatory Administrator account authorized and activated successfully. You may now log in with your User ID and Password.',
    };
  }

  /**
   * Helper to lookup admin by email or username in dev memory store
   */
  getDevAdmin(identifier) {
    if (!identifier) return null;
    const clean = identifier.toLowerCase().trim();
    for (const [_, profile] of devAdminProfiles) {
      if (profile.username.toLowerCase() === clean || profile.email.toLowerCase() === clean) {
        return profile;
      }
    }
    return null;
  }
}

module.exports = new AdminRegistrationService();

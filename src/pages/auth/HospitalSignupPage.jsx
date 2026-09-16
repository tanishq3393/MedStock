import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  FileText,
  Lock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Pill,
  X,
  Clock,
  Eye,
  EyeOff,
  Info,
  Trash2,
  ExternalLink,
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import PdfViewerModal from '../../components/common/PdfViewerModal';
import RegistrationReviewModal from '../../components/common/RegistrationReviewModal';
import { hospitalService } from '../../services/hospitalService';
import { INDIAN_STATES, getDistrictsForState, isValidIndianPincode } from '../../utils/indiaGeoData';
import toast from 'react-hot-toast';

// Organization Types
const ORGANIZATION_TYPES = [
  'Multi-Specialty Hospital',
  'Single-Specialty Hospital',
  'Super-Specialty Hospital',
  'Government / Public Hospital',
  'Trust / Charitable Healthcare Institution',
  'Medical College & Research Hospital',
  'Private Healthcare Clinic / Nursing Home',
];

// Issuing Authorities
const ISSUING_AUTHORITIES = [
  'State Directorate of Health Services (DHS)',
  'Municipal Corporation / Local Health Authority',
  'Directorate General of Health Services (DGHS)',
  'State Clinical Establishments Registration Council',
  'National Accreditation Board for Hospitals (NABH)',
  'Ministry of Health and Family Welfare (MoHFW)',
  'District Medical & Health Officer (DMHO)',
  'Other Statutory Authority',
];

// Authorized Representative Designations
const REPRESENTATIVE_DESIGNATIONS = [
  'Medical Director',
  'Chief Medical Officer (CMO)',
  'Hospital Administrator / COO',
  'Head of Pharmacy / Chief Pharmacist',
  'Managing Director / CEO',
  'Authorized Statutory Legal Signatory',
];

// Predefined Document Types for Dynamic Selector
const DOCUMENT_TYPES = [
  {
    id: 'Hospital / Clinical Establishment Registration Certificate',
    label: 'Hospital / Clinical Establishment Registration Certificate',
    mandatory: true,
    numLabel: 'Registration Number / Certificate No.',
    numPlaceholder: 'e.g. CEA/MH/2023/9812',
  },
  {
    id: 'Drug License / Medicine Handling Authorization',
    label: 'Drug License / Medicine Handling Authorization',
    mandatory: true,
    numLabel: 'Drug License Number (Form 20B/21B)',
    numPlaceholder: 'e.g. DL-20B-MH-4455',
  },
  {
    id: 'Hospital Authorization / Authorized Representative Letter',
    label: 'Hospital Authorization / Authorized Representative Letter',
    mandatory: true,
    numLabel: 'Resolution / Reference Number',
    numPlaceholder: 'e.g. BR-AUTH-2024-01',
  },
  {
    id: 'Pharmacy License',
    label: 'Pharmacy License',
    mandatory: false,
    numLabel: 'Pharmacy License Number',
    numPlaceholder: 'e.g. PH-MH-2022-7711',
  },
  {
    id: 'GST Registration Certificate',
    label: 'GST Registration Certificate',
    mandatory: false,
    numLabel: 'GSTIN Number (15 digits)',
    numPlaceholder: 'e.g. 27AAAAA0000A1Z5',
  },
  {
    id: 'Other Document',
    label: 'Other Document',
    mandatory: false,
    numLabel: 'Document Reference Number (Optional)',
    numPlaceholder: 'e.g. DOC-REF-9921',
  },
];

export const HospitalSignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const correctionMode = searchParams.get('mode') === 'correction';
  const paramHospitalId = searchParams.get('hospitalId');

  // Multi-step progress state
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState({ 1: false, 2: false, 3: false });
  const [hospitalId, setHospitalId] = useState(paramHospitalId || null);
  const [applicationStatus, setApplicationStatus] = useState('draft');
  const [correctionReason, setCorrectionReason] = useState(null);

  // Step 1 Form Data (Clean, empty initial fields - no prefilled dummy data)
  const [identityData, setIdentityData] = useState({
    name: '',
    registrationNo: '',
    issuingAuthority: '',
    organizationType: '',
    authorizedPerson: '',
    designation: '',
    email: '',
    phone: '',
  });

  // Email OTP state
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(
    import.meta.env.VITE_EMAIL_VERIFICATION_REQUIRED === 'true'
  );
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimerRef = useRef(null);

  // Step 2 Form Data (Campus details)
  const [campusData, setCampusData] = useState({
    address: '',
    receivingGate: '',
    state: '',
    district: '',
    city: '',
    pincode: '',
  });

  // Step 3 Documents state
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [newDocMeta, setNewDocMeta] = useState({
    customName: '',
    docNumber: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
    noExpiry: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // Document Viewing State (Actual PDF View Modal)
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewingUrl, setViewingUrl] = useState(null);
  const [isViewingLoading, setIsViewingLoading] = useState(false);
  const [viewingError, setViewingError] = useState(null);

  // Dedicated Submitted Screen Full Review State
  const [submittedReviewOpen, setSubmittedReviewOpen] = useState(true);
  const [submittedFullDossier, setSubmittedFullDossier] = useState(null);

  // Step 4 Security state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Dedicated Submitted / Success Screen State
  const [submittedDetails, setSubmittedDetails] = useState(null);

  const handleViewDocument = async (doc) => {
    if (!doc) return;
    setViewingDoc(doc);
    setViewingUrl(null);
    setIsViewingLoading(true);
    setViewingError(null);

    try {
      const effectiveHospitalId =
        hospitalId ||
        doc.hospitalId ||
        doc.hospital_id ||
        searchParams.get('hospitalId') ||
        sessionStorage.getItem('medex_submitted_hospital_id') ||
        sessionStorage.getItem('medex_reg_hospital_id') ||
        localStorage.getItem('medex_submitted_hospital_id');

      if (!effectiveHospitalId) {
        throw new Error('Hospital identity not found for document viewing.');
      }

      const docId = doc.id || doc._id || doc.documentId;
      if (!docId) {
        throw new Error('Document identifier is missing.');
      }

      const res = await hospitalService.getRegistrationDocumentViewUrl(effectiveHospitalId, docId);
      const url = res?.signedUrl || res?.viewUrl || res?.url;
      if (url) {
        setViewingUrl(url);
      } else {
        throw new Error('No viewing URL returned by server.');
      }
    } catch (err) {
      console.error('Failed to get viewing URL:', err);
      setViewingError(err.message || 'Unable to open document. Please try again.');
    } finally {
      setIsViewingLoading(false);
    }
  };

  const handleCloseViewer = () => {
    setViewingDoc(null);
    setViewingUrl(null);
    setIsViewingLoading(false);
    setViewingError(null);
  };

  // Load existing draft/correction on mount if hospitalId or email present
  useEffect(() => {
    document.title = 'MedEx | Institutional Hospital Registration';

    // Fetch dynamic registration feature config (e.g. email verification requirement)
    hospitalService.getRegistrationConfig().then((cfg) => {
      if (cfg && typeof cfg.emailVerificationRequired === 'boolean') {
        setEmailVerificationRequired(cfg.emailVerificationRequired);
      }
    });

    const savedHospitalId =
      paramHospitalId ||
      sessionStorage.getItem('medex_reg_hospital_id') ||
      sessionStorage.getItem('medex_submitted_hospital_id') ||
      localStorage.getItem('medex_submitted_hospital_id');

    if (savedHospitalId) {
      setHospitalId(savedHospitalId);
      loadExistingRegistration(savedHospitalId);
    }
  }, [paramHospitalId]);

  // Cooldown timer handler
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(cooldownTimerRef.current);
  }, [resendCooldown]);

  const loadExistingRegistration = async (id) => {
    try {
      const statusRes = await hospitalService.getRegistrationStatus(id);
      if (statusRes?.hospital) {
        const h = statusRes.hospital;
        setIdentityData({
          name: h.name || '',
          registrationNo: h.registrationNo || h.registration_no || '',
          issuingAuthority: h.issuingAuthority || h.issuing_authority || '',
          organizationType: h.organizationType || h.organization_type || '',
          authorizedPerson: h.authorizedPerson || h.authorized_person || '',
          designation: h.designation || '',
          email: h.email || '',
          phone: h.phone || '',
        });

        if (h.email_verified || h.emailVerified) {
          setEmailVerified(true);
        }

        setCampusData({
          address: h.address || '',
          receivingGate: h.receiving_gate || h.receivingGate || '',
          state: h.state || '',
          district: h.district || '',
          city: h.city || '',
          pincode: h.pincode || '',
        });

        setApplicationStatus(h.status || 'draft');
        if (h.status === 'requires_correction') {
          setCorrectionReason(h.rejectionReason || h.rejection_reason || 'Administrative correction requested.');
        }

        if (h.name && (h.registration_no || h.registrationNo) && (!emailVerificationRequired || h.email_verified || h.emailVerified)) {
          setCompletedSteps((prev) => ({ ...prev, 1: true }));
        }
        if (h.address && h.state && h.city && h.pincode) {
          setCompletedSteps((prev) => ({ ...prev, 2: true }));
        }

        // Fetch documents
        const docs = await hospitalService.getRegistrationDocuments(id);
        setUploadedDocuments(docs || []);
        if (docs && docs.length >= 3) {
          setCompletedSteps((prev) => ({ ...prev, 3: true }));
        }

        // Store full dossier and submitted status if application is already submitted
        if (h.status === 'pending_approval' || h.status === 'APPROVED' || h.status === 'approved') {
          setApplicationStatus('pending_approval');
          setSubmittedDetails({
            hospitalName: h.name || 'Healthcare Institution',
            registrationId: h.registrationNo || h.registration_no || 'REG-PENDING',
            email: h.email || 'Official Hospital Email',
            campusAddress: h.address ? `${h.address}, ${h.city}, ${h.state} - ${h.pincode}` : `${h.city}, ${h.state}`,
            submittedAt: h.registeredDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          });
          setSubmittedFullDossier(statusRes);
        }
      }
    } catch (e) {
      console.warn('Could not load draft application:', e.message);
    }
  };

  // ==============================================================
  // STEP 1: Email OTP & Identity Handlers
  // ==============================================================
  const handleSendOtp = async () => {
    const email = identityData.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid official work email address.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await hospitalService.sendEmailOtp(email);
      setOtpSent(true);
      setResendCooldown(res?.cooldownSeconds || 60);
      toast.success(res?.message || 'Verification code sent to your official email.');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const email = identityData.email.trim();
    const otp = otpInput.trim();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await hospitalService.verifyEmailOtp(email, otp);
      if (res?.verified) {
        setEmailVerified(true);
        setVerificationToken(res.verificationToken);
        toast.success('Email verified successfully ✓');
      }
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleIdentitySubmit = async (e) => {
    e.preventDefault();

    // 1. Frontend validation
    if (!identityData.name.trim()) return toast.error('Hospital name is required.');
    if (!identityData.registrationNo.trim()) return toast.error('Hospital registration number is required.');
    if (!identityData.issuingAuthority.trim()) return toast.error('Please select the issuing authority.');
    if (!identityData.organizationType.trim()) return toast.error('Please select the organization type.');
    if (!identityData.authorizedPerson.trim()) return toast.error('Authorized representative name is required.');
    if (!identityData.designation.trim()) return toast.error('Please select representative designation.');
    if (!identityData.email.trim()) return toast.error('Official work email is required.');
    if (!identityData.phone.trim() || identityData.phone.trim().length < 10) {
      return toast.error('Please provide a valid 10-digit official contact number.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identityData.email.trim())) {
      return toast.error('Please enter a valid official work email address.');
    }

    if (emailVerificationRequired && !emailVerified) {
      return toast.error('Email verification required. Please verify your work email with OTP.');
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...identityData,
        hospitalId,
        verificationToken: emailVerificationRequired ? verificationToken : undefined,
      };

      const result = await hospitalService.saveStep1(payload);
      if (result?.hospitalId) {
        setHospitalId(result.hospitalId);
        sessionStorage.setItem('medex_reg_hospital_id', result.hospitalId);
      }

      setCompletedSteps((prev) => ({ ...prev, 1: true }));
      toast.success('Step 1 saved. Campus details unlocked.');
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'We could not save your registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================================
  // STEP 2: Campus Handlers
  // ==============================================================
  const availableDistricts = getDistrictsForState(campusData.state);

  const handleCampusSubmit = async (e) => {
    e.preventDefault();

    if (!campusData.address.trim()) return toast.error('Campus address is required.');
    if (!campusData.state) return toast.error('Please select a State.');
    if (!campusData.district) return toast.error('Please select a District.');
    if (!campusData.city.trim()) return toast.error('City is required.');
    if (!isValidIndianPincode(campusData.pincode)) {
      return toast.error('Please enter a valid 6-digit Indian pincode.');
    }

    setIsSubmitting(true);
    try {
      const payload = {
        hospitalId,
        ...campusData,
      };

      await hospitalService.saveStep2(payload);
      setCompletedSteps((prev) => ({ ...prev, 2: true }));
      toast.success('Campus details saved. Regulatory documents unlocked.');
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'We could not save your registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================================
  // STEP 3: Dynamic Document Handlers
  // ==============================================================
  const selectedDocConfig = DOCUMENT_TYPES.find((d) => d.id === selectedDocType);

  // Check mandatory doc compliance
  const mandatoryDocsList = DOCUMENT_TYPES.filter((d) => d.mandatory);
  const isMandatoryTypeAdded = (typeId) => {
    return uploadedDocuments.some((d) => {
      const t = (d.documentType || d.document_type || '').toLowerCase();
      if (typeId === 'Hospital / Clinical Establishment Registration Certificate') {
        return t.includes('registration') || t.includes('establishment');
      }
      if (typeId === 'Drug License / Medicine Handling Authorization') {
        return t.includes('drug') || t.includes('medicine');
      }
      if (typeId === 'Hospital Authorization / Authorized Representative Letter') {
        return t.includes('authorization') || t.includes('representative');
      }
      return t === typeId.toLowerCase();
    });
  };

  const allMandatoryDocsUploaded = mandatoryDocsList.every((d) => isMandatoryTypeAdded(d.id));

  const handleAddDocument = async (e) => {
    e.preventDefault();

    if (!selectedDocType) {
      return toast.error('Please select a document type.');
    }
    if (selectedDocType === 'Other Document' && !newDocMeta.customName.trim()) {
      return toast.error('Document Name is required for Other Document.');
    }
    if (!newDocMeta.docNumber.trim() && selectedDocConfig?.mandatory) {
      return toast.error('Document / Certificate Number is required.');
    }
    if (!newDocMeta.issuingAuthority.trim() && selectedDocConfig?.mandatory) {
      return toast.error('Issuing Authority is required.');
    }
    if (!newDocMeta.issueDate && selectedDocConfig?.mandatory) {
      return toast.error('Issue Date is required.');
    }
    if (!newDocMeta.noExpiry && !newDocMeta.expiryDate && selectedDocConfig?.mandatory) {
      return toast.error('Please specify an Expiry Date or select Not Applicable.');
    }
    if (!selectedFile) {
      return toast.error('Please choose a document file to upload (PDF, PNG, JPG).');
    }

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('hospitalId', hospitalId);
      formData.append('documentType', selectedDocType);
      formData.append('documentNumber', newDocMeta.docNumber.trim());
      formData.append('issuingAuthority', newDocMeta.issuingAuthority.trim());
      formData.append('issueDate', newDocMeta.issueDate);
      formData.append('expiryDate', newDocMeta.noExpiry ? 'N/A' : newDocMeta.expiryDate);
      if (selectedDocType === 'Other Document') {
        formData.append('customDocumentName', newDocMeta.customName.trim());
      }
      formData.append('file', selectedFile);

      const uploaded = await hospitalService.uploadRegistrationDocument(formData);
      toast.success(`${selectedDocType} uploaded successfully.`);

      // Refresh documents
      const docs = await hospitalService.getRegistrationDocuments(hospitalId);
      setUploadedDocuments(docs || [uploaded]);

      // Reset form
      setSelectedDocType('');
      setNewDocMeta({
        customName: '',
        docNumber: '',
        issuingAuthority: '',
        issueDate: '',
        expiryDate: '',
        noExpiry: false,
      });
      setSelectedFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleRemoveDocument = async (docId, docName) => {
    if (!confirm(`Are you sure you want to remove "${docName}"?`)) return;

    try {
      await hospitalService.deleteRegistrationDocument(hospitalId, docId);
      setUploadedDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Document removed.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove document.');
    }
  };

  const handleProceedToSecurity = () => {
    if (!allMandatoryDocsUploaded) {
      const missing = mandatoryDocsList.filter((d) => !isMandatoryTypeAdded(d.id)).map((d) => d.label);
      return toast.error(`Application cannot proceed without all mandatory documents: ${missing.join(', ')}`);
    }

    setCompletedSteps((prev) => ({ ...prev, 3: true }));
    setStep(4);
  };

  // ==============================================================
  // STEP 4: Password Validation & Final Submission
  // ==============================================================
  const validatePasswordRule = (pwd) => {
    return {
      hasLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
  };

  const pwdChecks = validatePasswordRule(password);
  const isPasswordValid = Object.values(pwdChecks).every(Boolean);

  const handleFinalSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const effectiveHospitalId =
      hospitalId ||
      searchParams.get('hospitalId') ||
      sessionStorage.getItem('medex_reg_hospital_id') ||
      sessionStorage.getItem('medex_submitted_hospital_id') ||
      localStorage.getItem('medex_submitted_hospital_id');

    if (!effectiveHospitalId) {
      toast.error('Hospital registration session expired or missing ID. Returning to Step 1.');
      setStep(1);
      return;
    }

    if (!isPasswordValid) {
      setShowPasswordRequirements(true);
      return toast.error('Please ensure your password meets all security criteria (8+ characters, uppercase, lowercase, digit, and special character).');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match. Please re-enter confirm password.');
    }

    if (!allMandatoryDocsUploaded) {
      return toast.error('Cannot submit registration: Missing mandatory statutory documents.');
    }

    setIsSubmitting(true);
    try {
      let res;
      if (correctionMode || applicationStatus === 'requires_correction') {
        res = await hospitalService.resubmitRegistration(effectiveHospitalId, {
          password,
          confirmPassword,
        });
        toast.success(res?.message || 'Hospital registration resubmitted for admin approval.');
      } else {
        res = await hospitalService.submitRegistration(effectiveHospitalId, {
          password,
          confirmPassword,
        });
        toast.success(res?.message || 'Hospital registration submitted successfully.');
      }

      setApplicationStatus('pending_approval');
      sessionStorage.setItem('medex_submitted_hospital_id', effectiveHospitalId);
      localStorage.setItem('medex_submitted_hospital_id', effectiveHospitalId);

      // Set submitted details for dedicated post-submit view
      const h = res?.hospital || {};
      setSubmittedDetails({
        hospitalName: h.name || identityData.name || 'Healthcare Institution',
        registrationId: h.registrationNo || h.registration_no || identityData.registrationNo || 'REG-PENDING',
        email: h.email || identityData.email || 'Official Hospital Email',
        campusAddress: h.address || (campusData.city ? `${campusData.address}, ${campusData.city}, ${campusData.state} - ${campusData.pincode}` : 'Hospital Campus'),
        submittedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      });

      // Load full persisted dossier from Supabase
      try {
        const freshDossier = await hospitalService.getRegistrationStatus(effectiveHospitalId);
        if (freshDossier) {
          setSubmittedFullDossier(freshDossier);
        }
      } catch (e) {
        console.warn('Could not load fresh dossier after submit:', e.message);
        if (res) {
          setSubmittedFullDossier(res);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Registration submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================================
  // DEDICATED POST-SUBMISSION CONFIRMATION VIEW
  // ==============================================================
  if (submittedDetails || applicationStatus === 'pending_approval') {
    const details = submittedDetails || {
      hospitalName: identityData.name || 'Healthcare Institution',
      registrationId: identityData.registrationNo || 'REG-PENDING',
      email: identityData.email || 'Official Hospital Email',
      campusAddress: campusData.city ? `${campusData.city}, ${campusData.state}` : 'Hospital Campus',
      submittedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    const reviewHosp = submittedFullDossier?.hospital || {};
    const reviewCampuses = submittedFullDossier?.campuses || [];
    const reviewCampus = reviewCampuses[0] || {};
    const reviewDocs = submittedFullDossier?.documents || uploadedDocuments || [];

    return (
      <div className="min-h-[calc(100vh-8rem)] py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-teal-50/20 to-white flex items-center justify-center animate-fadeIn">
        <div className="max-w-3xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-10 space-y-8">
          {/* Header Badge */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Current Status: Pending Admin Approval
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hospital Registration Submitted Successfully
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Your institutional application and statutory regulatory documents have been safely received by the MedEx network administration.
            </p>
          </div>

          {/* Hospital Application Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Hospital Name:</span>
              <span className="font-extrabold text-slate-900 text-right">{details.hospitalName}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Registration ID:</span>
              <span className="font-mono font-bold text-teal-700">{details.registrationId}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Official Email:</span>
              <span className="font-medium text-slate-700">{details.email}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Campus Location:</span>
              <span className="font-medium text-slate-700 text-right">{details.campusAddress}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Submitted Date:</span>
              <span className="font-medium text-slate-700">{details.submittedAt}</span>
            </div>
          </div>

          {/* Action: Review Registration */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-teal-50 hover:bg-teal-100/90 border border-teal-300 text-teal-900 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Review Registration</span>
            </button>
          </div>

          {/* Registration Timeline */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Registration Timeline & Next Steps
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Timeline Item 1 */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] ring-4 ring-white shadow">
                  ✓
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-teal-900">Registration Submitted</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your registration application and required regulatory documents have been received.
                  </p>
                </div>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] ring-4 ring-white shadow animate-pulse">
                  ●
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-900">Admin Review</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your hospital registration is waiting for administrator approval. Statutory documents are audited against state healthcare registries.
                  </p>
                </div>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] ring-4 ring-white">
                  ○
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-400">Hospital Portal Access</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Available immediately upon administrator verification and institutional approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Return to Login Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Login</span>
            </button>
          </div>
        </div>

        {/* Shared Registration Review Modal on Submitted Screen */}
        <RegistrationReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          hospitalData={reviewHosp.name ? reviewHosp : identityData}
          campusData={reviewCampus.address ? reviewCampus : campusData}
          documents={reviewDocs}
          emailVerified={Boolean(reviewHosp.email_verified || reviewHosp.emailVerified)}
          onViewDocument={handleViewDocument}
          title="Hospital Registration Form Review"
        />

        {/* Secure Document Viewer Modal on Submitted Screen */}
        <PdfViewerModal
          isOpen={Boolean(viewingDoc)}
          onClose={handleCloseViewer}
          doc={viewingDoc}
          viewUrl={viewingUrl}
          isLoading={isViewingLoading}
          error={viewingError}
          hospitalName={details.hospitalName}
        />
      </div>
    );
  }

  // ==============================================================
  // MAIN 4-STEP REGISTRATION FORM
  // ==============================================================
  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-teal-50/15 to-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Title & Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200/80 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Institutional Healthcare Partner Enrollment
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hospital Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Complete the 4-step institutional compliance verification to connect your healthcare campus to the MedEx network.
          </p>
        </div>

        {/* Correction Mode Notice Banner */}
        {correctionReason && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-sm animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-black text-amber-900 uppercase tracking-wider text-[11px]">
                Administrative Correction Requested
              </h4>
              <p className="text-amber-950/90 leading-relaxed font-medium">
                {correctionReason}
              </p>
              <p className="text-[11px] text-amber-800">
                Please update the required information or statutory documents below and click <strong>Submit Registration</strong> to resubmit.
              </p>
            </div>
          </div>
        )}

        {/* 4-Step Progress Indicator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
            {[
              { num: 1, title: 'Identity', desc: 'Institutional Profile' },
              { num: 2, title: 'Campus', desc: 'Location & Branch' },
              { num: 3, title: 'Statutory Docs', desc: 'Regulatory Licenses' },
              { num: 4, title: 'Security & Review', desc: 'Admin Credentials' },
            ].map((s) => {
              const isActive = step === s.num;
              const isDone = completedSteps[s.num] || step > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  disabled={!isDone && step !== s.num}
                  onClick={() => isDone && setStep(s.num)}
                  className={`text-left transition-all p-2 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2.5 ${
                    isActive
                      ? 'bg-teal-50 border border-teal-200/80 shadow-xs'
                      : isDone
                      ? 'hover:bg-slate-50 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? 'bg-teal-600 text-white shadow-sm'
                        : isActive
                        ? 'bg-teal-700 text-white ring-2 ring-teal-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate ${isActive ? 'text-teal-950' : 'text-slate-800'}`}>
                      {s.title}
                    </div>
                    <div className="hidden sm:block text-[10px] text-slate-400 truncate">
                      {s.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Container Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
          {/* ============================================================== */}
          {/* STEP 1: IDENTITY */}
          {/* ============================================================== */}
          {step === 1 && (
            <form onSubmit={handleIdentitySubmit} className="p-6 sm:p-10 space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900">Step 1 — Institutional Identity</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter official healthcare institution details and verify authorized official work email.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Hospital Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Hospital / Healthcare Institution Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={identityData.name}
                    onChange={(e) => setIdentityData({ ...identityData, name: e.target.value })}
                    placeholder="e.g. Apollo Hospital"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>

                {/* 2. Registration Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Hospital / Clinical Establishment Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={identityData.registrationNo}
                    onChange={(e) => setIdentityData({ ...identityData, registrationNo: e.target.value })}
                    placeholder="e.g. MH-123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>

                {/* 3. Issuing Authority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Issuing Authority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={identityData.issuingAuthority}
                    onChange={(e) => setIdentityData({ ...identityData, issuingAuthority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  >
                    <option value="">-- Select Issuing Authority --</option>
                    {ISSUING_AUTHORITIES.map((auth) => (
                      <option key={auth} value={auth}>{auth}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Organization Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Organization Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={identityData.organizationType}
                    onChange={(e) => setIdentityData({ ...identityData, organizationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  >
                    <option value="">-- Select Organization Type --</option>
                    {ORGANIZATION_TYPES.map((org) => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Authorized Representative Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Authorized Representative Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={identityData.authorizedPerson}
                    onChange={(e) => setIdentityData({ ...identityData, authorizedPerson: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>

                {/* 6. Designation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Designation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={identityData.designation}
                    onChange={(e) => setIdentityData({ ...identityData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  >
                    <option value="">-- Select Designation --</option>
                    {REPRESENTATIVE_DESIGNATIONS.map((desig) => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                </div>

                {/* 8. Official Contact Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Official Hospital Contact Number (+91) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={identityData.phone}
                    onChange={(e) => setIdentityData({ ...identityData, phone: e.target.value })}
                    placeholder="e.g. 98200 12345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                  <p className="text-[10px] text-slate-400">Direct phone number for operational logistics.</p>
                </div>

                {/* 7 & 9. Official Email & Email OTP Verification */}
                <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Official Work Email & Verification <span className="text-rose-500">*</span>
                    </label>
                    {emailVerificationRequired && emailVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-800 border border-teal-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        Email Verified ✓
                      </span>
                    )}
                    {!emailVerificationRequired && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        OTP Verification Paused
                      </span>
                    )}
                  </div>

                  {!emailVerificationRequired && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Email OTP Verification is temporarily disabled:</span> You may proceed directly with your official work email address. Institutional credentials and statutory documents will still be audited by Administration prior to activation.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="email"
                      required
                      disabled={emailVerificationRequired && emailVerified}
                      value={identityData.email}
                      onChange={(e) => {
                        setIdentityData({ ...identityData, email: e.target.value });
                        if (emailVerified) setEmailVerified(false);
                      }}
                      placeholder="e.g. pharmacy@apollohospitals.com"
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition ${
                        emailVerificationRequired && emailVerified ? 'bg-slate-50 border-slate-200' : 'border-slate-300'
                      }`}
                    />

                    {emailVerificationRequired && !emailVerified && (
                      <button
                        type="button"
                        disabled={otpLoading || resendCooldown > 0 || !identityData.email}
                        onClick={handleSendOtp}
                        className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {otpLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : resendCooldown > 0 ? (
                          <span>Resend in {resendCooldown}s</span>
                        ) : otpSent ? (
                          <span>Resend OTP</span>
                        ) : (
                          <span>Send Verification OTP</span>
                        )}
                      </button>
                    )}

                    {emailVerificationRequired && emailVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmailVerified(false);
                          setOtpSent(false);
                          setOtpInput('');
                          setVerificationToken(null);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                      >
                        Change Email
                      </button>
                    )}
                  </div>

                  {/* OTP Challenge Input Box (Only when verification is required) */}
                  {emailVerificationRequired && !emailVerified && otpSent && (
                    <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-teal-700" />
                          Enter 6-Digit Email OTP
                        </span>
                        <span className="text-[11px] text-teal-800">Code sent to {identityData.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="● ● ● ● ● ●"
                          className="w-40 tracking-widest text-center font-mono font-bold text-base px-3 py-2 rounded-xl border border-teal-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="button"
                          disabled={otpLoading || otpInput.length !== 6}
                          onClick={handleVerifyOtp}
                          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                        >
                          {otpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify Email'}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        The verification code expires in 10 minutes. Check your spam/junk folder if not received.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Navigation */}
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || (emailVerificationRequired && !emailVerified)}
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Identity...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Campus Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 2: CAMPUS */}
          {/* ============================================================== */}
          {step === 2 && (
            <form onSubmit={handleCampusSubmit} className="p-6 sm:p-10 space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900">Step 2 — Campus / Branch Location</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Specify the physical hospital campus and optional pharmacy receiving gate for medicine logistics.
                </p>
              </div>

              {/* Side-by-Side Address & Receiving Gate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Hospital / Campus Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Hospital / Campus Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={campusData.address}
                    onChange={(e) => setCampusData({ ...campusData, address: e.target.value })}
                    placeholder="e.g. Plot No. 15, Sector 4, Off Eastern Express Highway"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition resize-none"
                  />
                  <p className="text-[10px] text-slate-400">Full physical street address of the registered hospital campus.</p>
                </div>

                {/* Medicine Receiving Gate (OPTIONAL) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">
                      Medicine Receiving / Pharmacy Gate
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Optional</span>
                  </div>
                  <textarea
                    rows={3}
                    value={campusData.receivingGate}
                    onChange={(e) => setCampusData({ ...campusData, receivingGate: e.target.value })}
                    placeholder="e.g. Gate 3, Central Pharmacy Supply Receiving Bay, Basement 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition resize-none"
                  />
                  <p className="text-[10px] text-slate-400">Designated entry gate or dock for incoming medical deliveries.</p>
                </div>
              </div>

              {/* Shared Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {/* State (Dropdown) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={campusData.state}
                    onChange={(e) => setCampusData({ ...campusData, state: e.target.value, district: '' })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  >
                    <option value="">-- Select State --</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* District (Dependent Dropdown) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!campusData.state}
                    value={campusData.district}
                    onChange={(e) => setCampusData({ ...campusData, district: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  >
                    <option value="">-- Select District --</option>
                    {availableDistricts.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={campusData.city}
                    onChange={(e) => setCampusData({ ...campusData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>

                {/* Pincode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={campusData.pincode}
                    onChange={(e) => setCampusData({ ...campusData, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="6-digit PIN"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Campus...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Statutory Documents</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 3: STATUTORY DOCUMENTS */}
          {/* ============================================================== */}
          {step === 3 && (
            <div className="p-6 sm:p-10 space-y-8 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900">Step 3 — Statutory Regulatory Documents</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload government certifications, drug handling licenses, and institutional representative authorizations.
                </p>
              </div>

              {/* Mandatory Compliance Status Checklist */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Mandatory Compliance Checklist (All 3 Required)
                  </span>
                  <span className={`text-xs font-black ${allMandatoryDocsUploaded ? 'text-teal-700' : 'text-amber-700'}`}>
                    {uploadedDocuments.filter((d) => isMandatoryTypeAdded(d.documentType)).length} of 3 Mandatory Attached
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {mandatoryDocsList.map((doc) => {
                    const isAdded = isMandatoryTypeAdded(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 transition ${
                          isAdded
                            ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                            isAdded ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isAdded ? '✓' : '!'}
                        </div>
                        <span className="text-[11px] leading-snug">{doc.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Document Selector & Entry Form */}
              <div className="border border-teal-200/80 rounded-2xl p-5 bg-teal-50/30 space-y-4">
                <div className="flex items-center gap-2 text-teal-950">
                  <FileText className="w-5 h-5 text-teal-700" />
                  <h3 className="text-sm font-black">Add Regulatory Document</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Select Document Type ▼</label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => {
                      setSelectedDocType(e.target.value);
                      setSelectedFile(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition font-medium"
                  >
                    <option value="">-- Choose Document Type to Add --</option>
                    {DOCUMENT_TYPES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label} {d.mandatory ? '*(MANDATORY)' : '(Optional)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metadata Fields Form for Selected Document */}
                {selectedDocType && (
                  <form onSubmit={handleAddDocument} className="pt-3 border-t border-teal-200/50 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Custom Name if "Other Document" */}
                      {selectedDocType === 'Other Document' && (
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            Document Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newDocMeta.customName}
                            onChange={(e) => setNewDocMeta({ ...newDocMeta, customName: e.target.value })}
                            placeholder="e.g. Fire NOC / NABH Accreditation Certificate"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                          />
                        </div>
                      )}

                      {/* Document Number */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          {selectedDocConfig?.numLabel || 'Document / Certificate Number'}
                          {selectedDocConfig?.mandatory && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type="text"
                          required={selectedDocConfig?.mandatory}
                          value={newDocMeta.docNumber}
                          onChange={(e) => setNewDocMeta({ ...newDocMeta, docNumber: e.target.value })}
                          placeholder={selectedDocConfig?.numPlaceholder || 'Certificate / License Number'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-mono"
                        />
                      </div>

                      {/* Issuing Authority */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          Issuing Authority {selectedDocConfig?.mandatory && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type="text"
                          required={selectedDocConfig?.mandatory}
                          value={newDocMeta.issuingAuthority}
                          onChange={(e) => setNewDocMeta({ ...newDocMeta, issuingAuthority: e.target.value })}
                          placeholder="e.g. State Drug Control Administration"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                        />
                      </div>

                      {/* Issue Date */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          Issue Date {selectedDocConfig?.mandatory && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type="date"
                          required={selectedDocConfig?.mandatory}
                          value={newDocMeta.issueDate}
                          onChange={(e) => setNewDocMeta({ ...newDocMeta, issueDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                        />
                      </div>

                      {/* Expiry Date & Not Applicable Toggle */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-700">Expiry Date</label>
                          <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newDocMeta.noExpiry}
                              onChange={(e) => setNewDocMeta({ ...newDocMeta, noExpiry: e.target.checked })}
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            <span>Lifetime / Not Applicable</span>
                          </label>
                        </div>
                        <input
                          type="date"
                          disabled={newDocMeta.noExpiry}
                          required={!newDocMeta.noExpiry && selectedDocConfig?.mandatory}
                          value={newDocMeta.expiryDate}
                          onChange={(e) => setNewDocMeta({ ...newDocMeta, expiryDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      {/* File Upload (Choose File) */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          Upload Document (PDF, JPEG, PNG - Max 5MB) <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer px-4 py-2 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-white hover:bg-teal-50/50 text-teal-800 text-xs font-bold transition flex items-center gap-2">
                            <UploadCloud className="w-4 h-4 text-teal-600" />
                            <span>{selectedFile ? 'Change File' : 'Choose File'}</span>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setSelectedFile(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          {selectedFile ? (
                            <span className="text-xs text-slate-700 font-medium truncate">
                              📄 {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">No file selected yet</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isUploadingDoc}
                        className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow transition flex items-center gap-2"
                      >
                        {isUploadingDoc ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading Document...</span>
                          </>
                        ) : (
                          <span>+ Add Document</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Added Documents List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Added Documents ({uploadedDocuments.length})
                </h3>

                {uploadedDocuments.length === 0 ? (
                  <div className="text-center p-8 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-1">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
                    <p className="font-semibold text-slate-600">No regulatory documents added yet.</p>
                    <p>Select a document type above and upload required certificates.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {uploadedDocuments.map((doc) => {
                      const displayName = doc.customDocumentName || doc.documentType || doc.documentName;
                      return (
                        <div
                          key={doc.id}
                          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{displayName}</span>
                                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                  Added
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 font-medium">
                                {doc.documentNumber && <span>No: <strong className="text-slate-700">{doc.documentNumber}</strong></span>}
                                {doc.issuingAuthority && <span>Authority: <strong className="text-slate-700">{doc.issuingAuthority}</strong></span>}
                                {doc.expiryDate && <span>Expiry: <strong className="text-slate-700">{doc.expiryDate}</strong></span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleViewDocument(doc)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(doc.id, displayName)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={!allMandatoryDocsUploaded}
                  onClick={handleProceedToSecurity}
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-2"
                >
                  <span>Next: Security & Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: SECURITY & REVIEW */}
          {/* ============================================================== */}
          {step === 4 && (
            <form onSubmit={handleFinalSubmit} className="p-6 sm:p-10 space-y-8 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-900">Step 4 — Administrator Security & Review</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create primary administrator credentials for your Supabase Auth account and inspect complete submission dossier.
                </p>
              </div>

              {/* Primary Administrator Account Setup */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-black text-slate-900">Primary Administrator Account Password</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Create Password */}
                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span>Create Your MedEx Account Password</span>
                        <span className="text-rose-500">*</span>
                        <button
                          type="button"
                          onMouseEnter={() => setShowPasswordRequirements(true)}
                          onMouseLeave={() => setShowPasswordRequirements(false)}
                          onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
                          className="text-slate-400 hover:text-teal-600 focus:outline-none"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong account password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Requirements Popover Tooltip */}
                    {showPasswordRequirements && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-2 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 animate-fadeIn">
                        <div className="font-extrabold text-[11px] text-teal-300 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Password Requirements:
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          <li className={pwdChecks.hasLength ? 'text-emerald-400' : ''}>
                            {pwdChecks.hasLength ? '✓' : '•'} At least 8 characters
                          </li>
                          <li className={pwdChecks.hasUpper ? 'text-emerald-400' : ''}>
                            {pwdChecks.hasUpper ? '✓' : '•'} At least 1 uppercase letter (A-Z)
                          </li>
                          <li className={pwdChecks.hasLower ? 'text-emerald-400' : ''}>
                            {pwdChecks.hasLower ? '✓' : '•'} At least 1 lowercase letter (a-z)
                          </li>
                          <li className={pwdChecks.hasNumber ? 'text-emerald-400' : ''}>
                            {pwdChecks.hasNumber ? '✓' : '•'} At least 1 number (0-9)
                          </li>
                          <li className={pwdChecks.hasSpecial ? 'text-emerald-400' : ''}>
                            {pwdChecks.hasSpecial ? '✓' : '•'} At least 1 special character (! @ # $ % ...)
                          </li>
                          <li className="text-slate-400">• Avoid common or easily guessed passwords</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents & Review */}
              <div className="border border-slate-200 rounded-2xl bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Attached Regulatory Documents ({uploadedDocuments.length})</h3>
                      <p className="text-[11px] text-slate-500">Statutory regulatory documents uploaded in Step 3.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    Step 1–3 Complete
                  </span>
                </div>

                {uploadedDocuments.length === 0 ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    No statutory documents attached.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc, idx) => {
                      const docTitle = doc.documentType || doc.customDocumentName || doc.documentName || 'Statutory Compliance Document';
                      const docNum = doc.documentNumber || doc.document_number;
                      const authority = doc.issuingAuthority || doc.issuing_authority;
                      const issueDt = doc.issueDate || doc.issue_date;
                      const expiryDt = doc.expiryDate || doc.expiry_date;
                      const filename = doc.originalFilename || doc.original_filename || doc.documentName || doc.document_name || 'document.pdf';
                      const customName = doc.customDocumentName || doc.custom_document_name;

                      return (
                        <div
                          key={doc.id || idx}
                          className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{docTitle}</span>
                              {customName && customName !== docTitle && (
                                <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                  {customName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
                              {docNum && <span>No: <strong className="text-slate-800 font-mono">{docNum}</strong></span>}
                              {docNum && authority && <span className="text-slate-300">•</span>}
                              {authority && <span>Authority: <strong className="text-slate-800">{authority}</strong></span>}
                              {(docNum || authority) && (issueDt || expiryDt) && <span className="text-slate-300">•</span>}
                              {issueDt && <span>Issued: <strong className="text-slate-800">{issueDt}</strong></span>}
                              {expiryDt && <span>Expires: <strong className="text-slate-800">{expiryDt}</strong></span>}
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-slate-600">📄 {filename}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleViewDocument(doc)}
                            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0 self-end sm:self-center shadow-2xs cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                            <span>View</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs transition flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Review Registration</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-lg shadow-teal-600/25 transition flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Registration...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SHARED REGISTRATION REVIEW MODAL (STEP 4) */}
      {/* ============================================================== */}
      <RegistrationReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        hospitalData={{
          ...identityData,
          emailVerificationStatus: emailVerificationRequired ? (emailVerified ? 'VERIFIED' : 'PENDING') : 'TEMPORARILY_SKIPPED',
          email_verification_status: emailVerificationRequired ? (emailVerified ? 'VERIFIED' : 'PENDING') : 'TEMPORARILY_SKIPPED',
        }}
        campusData={campusData}
        documents={uploadedDocuments}
        emailVerified={emailVerificationRequired ? emailVerified : false}
        onViewDocument={handleViewDocument}
        title="Hospital Registration Form Review"
      />

      {/* ============================================================== */}
      {/* DOCUMENT VIEW MODAL */}
      {/* ============================================================== */}
      {/* SECURE PDF DOCUMENT VIEWER MODAL */}
      {/* ============================================================== */}
      <PdfViewerModal
        isOpen={Boolean(viewingDoc)}
        onClose={handleCloseViewer}
        doc={viewingDoc}
        viewUrl={viewingUrl}
        isLoading={isViewingLoading}
        error={viewingError}
        hospitalName={identityData.name || submittedDetails?.hospitalName}
      />
    </div>
  );
};

export default HospitalSignupPage;

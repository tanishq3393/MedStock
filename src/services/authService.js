import { getStoredItem, setStoredItem, KEYS } from './storage';

export const authService = {
  // Login method for Hospital or Admin
  async login({ email, password, role }) {
    await new Promise((r) => setTimeout(r, 450)); // Realistic API delay

    const hospitals = getStoredItem(KEYS.HOSPITALS, []);

    if (role === 'admin') {
      if (email === 'admin@smartmedishare.org' && password === 'Admin@123') {
        const user = {
          id: 'admin-01',
          name: 'Super Administrator',
          email: 'admin@smartmedishare.org',
          role: 'admin',
          department: 'National Healthcare Logistics Oversight',
          phone: '+91 11 2345 6789',
        };
        const token = 'mock_jwt_token_admin_' + Date.now();
        setStoredItem(KEYS.AUTH, { user, token });
        return { user, token };
      }
      // Demo fallback for any admin credentials if entered in testing
      if (email.includes('admin') || password.length >= 6) {
        const user = {
          id: 'admin-demo',
          name: 'Platform Ops Admin',
          email: email,
          role: 'admin',
          department: 'Compliance & Verification',
          phone: '+91 99887 76655',
        };
        const token = 'mock_jwt_token_admin_' + Date.now();
        setStoredItem(KEYS.AUTH, { user, token });
        return { user, token };
      }
      throw new Error('Invalid Admin credentials. Use admin@smartmedishare.org / Admin@123');
    } else {
      // Hospital role
      const matched = hospitals.find((h) => h.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        const user = {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          role: 'hospital',
          status: matched.status,
          registrationNo: matched.registrationNo,
          authorizedPerson: matched.authorizedPerson,
          city: matched.city,
          state: matched.state,
          phone: matched.phone,
        };
        const token = 'mock_jwt_token_hospital_' + Date.now();
        setStoredItem(KEYS.AUTH, { user, token });
        return { user, token };
      }

      // Default quick login fallback (e.g. apollo)
      if (email === 'apollo.mumbai@smartmedishare.org' || email.includes('hospital') || email.includes('apollo')) {
        const defaultHosp = hospitals[0] || {
          id: 'hosp-1',
          name: 'Apollo Hospital',
          email: 'apollo.mumbai@smartmedishare.org',
          city: 'Mumbai',
          status: 'verified',
        };
        const user = {
          id: defaultHosp.id,
          name: defaultHosp.name,
          email: defaultHosp.email,
          role: 'hospital',
          status: defaultHosp.status,
          registrationNo: defaultHosp.registrationNo,
          authorizedPerson: defaultHosp.authorizedPerson,
          city: defaultHosp.city,
          state: defaultHosp.state,
          phone: defaultHosp.phone,
        };
        const token = 'mock_jwt_token_hospital_' + Date.now();
        setStoredItem(KEYS.AUTH, { user, token });
        return { user, token };
      }

      // Generic login allowing test testing
      const newUser = {
        id: 'hosp-' + Date.now().toString().slice(-4),
        name: email.split('@')[0].toUpperCase() + ' Hospital',
        email,
        role: 'hospital',
        status: 'verified',
        registrationNo: 'REG-' + Math.floor(100000 + Math.random() * 900000),
        authorizedPerson: 'Dr. Authorized Signatory',
        city: 'Mumbai',
        state: 'Maharashtra',
        phone: '+91 98200 12345',
      };
      const token = 'mock_jwt_token_hospital_' + Date.now();
      setStoredItem(KEYS.AUTH, { user: newUser, token });
      return { user: newUser, token };
    }
  },

  async signupHospital(formData) {
    await new Promise((r) => setTimeout(r, 600));
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);

    const newHospital = {
      id: 'hosp-' + Date.now(),
      name: formData.name,
      registrationNo: formData.registrationNo,
      authorizedPerson: formData.authorizedPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      status: 'pending', // Requires admin verification
      registeredDate: new Date().toISOString().split('T')[0],
      verifiedDate: null,
      documents: formData.documents || [
        { name: 'Registration_Certificate.pdf', size: '2.4 MB', type: 'Registration Certificate', verified: false },
        { name: 'Drug_License.pdf', size: '1.8 MB', type: 'Drug License', verified: false },
        { name: 'GST_Certificate.pdf', size: '1.2 MB', type: 'GST Certificate', verified: false },
        { name: 'Authorization_Letter.pdf', size: '1.0 MB', type: 'Authorization Letter', verified: false },
      ],
    };

    hospitals.unshift(newHospital);
    setStoredItem(KEYS.HOSPITALS, hospitals);

    const user = {
      id: newHospital.id,
      name: newHospital.name,
      email: newHospital.email,
      role: 'hospital',
      status: 'pending',
      registrationNo: newHospital.registrationNo,
      authorizedPerson: newHospital.authorizedPerson,
      city: newHospital.city,
      state: newHospital.state,
      phone: newHospital.phone,
    };
    const token = 'mock_jwt_token_hosp_' + Date.now();
    setStoredItem(KEYS.AUTH, { user, token });
    return { user, token };
  },

  async signupAdmin(formData) {
    await new Promise((r) => setTimeout(r, 500));
    const user = {
      id: 'admin-' + Date.now(),
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      role: 'admin',
    };
    const token = 'mock_jwt_token_admin_' + Date.now();
    setStoredItem(KEYS.AUTH, { user, token });
    return { user, token };
  },

  async switchHospital(hospitalId) {
    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    const matched = hospitals.find((h) => h.id === hospitalId) || hospitals[0];
    if (!matched) throw new Error('Hospital not found');

    const user = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: 'hospital',
      status: matched.status || 'verified',
      registrationNo: matched.registrationNo,
      authorizedPerson: matched.authorizedPerson,
      city: matched.city,
      state: matched.state,
      phone: matched.phone,
    };
    const token = 'mock_jwt_token_hosp_' + matched.id;
    setStoredItem(KEYS.AUTH, { user, token });
    return { user, token };
  },

  async getCurrentSession() {
    return getStoredItem(KEYS.AUTH, null);
  },

  async logout() {
    localStorage.removeItem(KEYS.AUTH);
    return true;
  }
};

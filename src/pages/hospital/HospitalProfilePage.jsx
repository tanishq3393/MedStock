import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Edit3,
  FileText,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser, setUserSession } from '../../store/slices/authSlice';
import { getStoredItem, setStoredItem, KEYS } from '../../services/storage';

const profileFields = [
  ['name', 'Hospital name'],
  ['registrationNo', 'Registration number'],
  ['authorizedPerson', 'Contact person'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['address', 'Address'],
  ['city', 'City'],
  ['state', 'State'],
  ['pincode', 'Pincode'],
];

export const HospitalProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const storedHospital = getStoredItem(KEYS.HOSPITALS, []).find((hospital) => hospital.id === user?.id);
  const hospital = { ...user, ...storedHospital };
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() =>
    Object.fromEntries(profileFields.map(([field]) => [field, hospital[field] || '']))
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    const updatedUser = { ...user, ...formData };
    dispatch(setUserSession({ user: updatedUser, token: token || 'mock-jwt-token' }));

    const hospitals = getStoredItem(KEYS.HOSPITALS, []);
    setStoredItem(KEYS.HOSPITALS, hospitals.map((item) => (
      item.id === user?.id ? { ...item, ...formData } : item
    )));
    setIsEditing(false);
    toast.success('Hospital profile updated');
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/');
  };

  const documents = hospital.documents || [];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to workspace
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{hospital.name || 'Hospital Profile'}</h1>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-emerald-600 mt-1">Verified hospital account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-primary-200 bg-primary-50 text-xs font-bold text-primary-700 hover:bg-primary-100"
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileFields.map(([field, label]) => (
                <label key={field} className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
                  <input
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    required={field === 'name' || field === 'email'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-xs font-bold text-white hover:bg-primary-700">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {profileFields.map(([field, label]) => (
                <div key={field} className="min-h-20 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-extrabold text-slate-900 break-words">{hospital[field] || 'Not provided'}</p>
                </div>
              ))}
              <div className="min-h-20 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-extrabold capitalize text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  {hospital.status || 'Verified'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Uploaded Documents</h2>
          </div>
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((document) => (
                <div key={`${document.type}-${document.name}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 flex-shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{document.type}</p>
                      <p className="text-[10px] text-slate-500 truncate">{document.name}{document.size ? ` · ${document.size}` : ''}</p>
                    </div>
                  </div>
                  {document.verified && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No documents uploaded.</p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-200 bg-white text-xs font-bold text-primary-700 hover:bg-primary-50">
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
          <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalProfilePage;

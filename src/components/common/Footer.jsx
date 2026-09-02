import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, ShieldCheck, Mail, Phone, MapPin, Heart, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-secondary-800 text-slate-300 border-t border-secondary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-md">
                <Pill className="w-5 h-5 rotate-45" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Smart<span className="text-primary-400">MediShare</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              India's premier verified inter-hospital medicine exchange network. Empowering healthcare facilities to eliminate pharmaceutical wastage, ensure cold-chain logistics integrity, and reduce emergency drug procurement costs.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary-300 bg-secondary-900/60 p-3 rounded-xl border border-secondary-700/60 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Compliant with CDSCO & Pharmacy Practice Regulations 2024</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/hospital/marketplace" className="hover:text-white transition-colors">Medicine Marketplace</Link>
              </li>
              <li>
                <Link to="/hospital/track" className="hover:text-white transition-colors">Logistics Tracking</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Hospital Portal</Link>
              </li>
              <li>
                <Link to="/admin-signup" className="hover:text-white transition-colors">Admin Access</Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><span className="hover:text-white cursor-pointer transition-colors">Hospital Verification</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Inventory Concession Calculator</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Cold-Chain IoT Telemetry</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Bio-Hazard Disposal Tracking</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Razorpay B2B Escrow</span></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                <span>National Health Logistics Tower, Bandra-Kurla Complex, Mumbai 400051</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>+91 (022) 8000-MEDI</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>support@smartmedishare.org</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-secondary-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SmartMediShare Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">About</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Security Audit</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  Send,
  Inbox,
  History,
  Truck,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Building,
  Layers,
  Activity,
  FileCheck2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ role = 'hospital' }) => {
  const { incomingRequests } = useSelector((state) => state.requests);
  const { hospitals } = useSelector((state) => state.admin);

  const pendingIncomingCount = incomingRequests?.filter((r) => r.status === 'pending').length || 0;
  const pendingHospitalsCount = hospitals?.filter((h) => h.status === 'pending').length || 2;

  // Grouped Navigation Sections for Hospital Portal
  const hospitalNavSections = [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/hospital/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { to: '/hospital/inventory', icon: Boxes, label: 'My Inventory' },
        { to: '/hospital/marketplace', icon: ShoppingBag, label: 'Marketplace' },
      ]
    },
    {
      title: 'TRANSACTIONS',
      items: [
        { to: '/hospital/my-requests', icon: Send, label: 'My Requests' },
        { 
          to: '/hospital/incoming-requests', 
          icon: Inbox, 
          label: 'Incoming Requests', 
          badge: pendingIncomingCount > 0 ? pendingIncomingCount : null,
          badgeColor: 'bg-amber-500'
        },
        { to: '/hospital/history', icon: History, label: 'Trade History' },
        { to: '/hospital/payment-history', icon: CreditCard, label: 'Payment History' },
      ]
    },
    {
      title: 'LOGISTICS',
      items: [
        { to: '/hospital/track', icon: Truck, label: 'Live Tracking' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { to: '/hospital/feedback', icon: MessageSquare, label: 'Feedback' },
      ]
    }
  ];

  // Grouped Navigation Sections for Admin Portal
  const adminNavSections = [
    {
      title: 'SUPERVISORY',
      items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Overview' },
        { to: '/admin/medicine-data', icon: Layers, label: 'Medicine Directory' },
      ]
    },
    {
      title: 'REGISTRATION & AUDIT',
      items: [
        { to: '/admin/hospital-details', icon: Building, label: 'Hospital Registry' },
        { 
          to: '/admin/verification', 
          icon: FileCheck2, 
          label: 'Verification Queue',
          badge: pendingHospitalsCount > 0 ? pendingHospitalsCount : null,
          badgeColor: 'bg-rose-500'
        },
      ]
    },
    {
      title: 'LOGISTICS & BIO-HAZARD',
      items: [
        { to: '/admin/management', icon: Activity, label: 'Transfers & Bio-Waste' },
        { to: '/admin/feedback', icon: MessageSquare, label: 'Hospital Feedbacks' },
      ]
    }
  ];

  const navSections = role === 'admin' ? adminNavSections : hospitalNavSections;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200/90 min-h-[calc(100vh-4rem)] p-3.5 flex flex-col justify-between select-none">
      <div>
        
        {/* Navigation Rail Header */}
        <div className="px-2.5 py-1.5 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400">
              {role === 'admin' ? 'NATIONAL AUTHORITY RAIL' : 'HOSPITAL OPERATING RAIL'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Logical Groups */}
        <div className="space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-2.5 py-1">
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  {section.title}
                </span>
              </div>

              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                          isActive
                            ? 'bg-primary-50 text-primary-800 font-bold border border-primary-200/70 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Icon 
                              className={`w-4 h-4 transition-colors ${
                                isActive 
                                  ? 'text-primary-600' 
                                  : 'text-slate-400 group-hover:text-slate-600'
                              }`} 
                            />
                            <span>{item.label}</span>
                          </div>

                          {item.badge ? (
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold text-white rounded-full ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronRight 
                              className={`w-3.5 h-3.5 transition-all ${
                                isActive 
                                  ? 'opacity-100 text-primary-500 translate-x-0' 
                                  : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-slate-400'
                              }`} 
                            />
                          )}

                          {/* Left active marker pill */}
                          {isActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary-600 rounded-r-full" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Compliance Footer Badge */}
      <div className="mt-6 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-primary-50/50 border border-slate-200/80 space-y-1">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <span className="text-[11px] font-extrabold text-slate-800">CDSCO Verified Node</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
          2°C - 8°C Cold Chain & Rule 65 statutory drug compliance active.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

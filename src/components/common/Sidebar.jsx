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
  Trash2,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ role = 'hospital' }) => {
  const { incomingRequests } = useSelector((state) => state.requests);
  const { hospitals } = useSelector((state) => state.admin);

  const pendingIncomingCount = incomingRequests?.filter((r) => r.status === 'pending').length || 0;
  const pendingHospitalsCount = hospitals?.filter((h) => h.status === 'pending').length || 2;

  const hospitalNavItems = [
    { to: '/hospital/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hospital/inventory', icon: Boxes, label: 'My Inventory' },
    { to: '/hospital/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { to: '/hospital/my-requests', icon: Send, label: 'My Requests' },
    { 
      to: '/hospital/incoming-requests', 
      icon: Inbox, 
      label: 'Incoming Requests', 
      badge: pendingIncomingCount > 0 ? pendingIncomingCount : null,
      badgeColor: 'bg-amber-500'
    },
    { to: '/hospital/history', icon: History, label: 'Trade History' },
    { to: '/hospital/track', icon: Truck, label: 'Live Tracking' },
    { to: '/hospital/payment-history', icon: CreditCard, label: 'Payment History' },
    { to: '/hospital/feedback', icon: MessageSquare, label: 'Feedback' },
  ];

  const adminNavItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Overview' },
    { to: '/admin/medicine-data', icon: Layers, label: 'Medicine Data' },
    { to: '/admin/hospital-details', icon: Building, label: 'Hospital Registry' },
    { 
      to: '/admin/verification', 
      icon: FileCheck2, 
      label: 'Verification Queue',
      badge: pendingHospitalsCount > 0 ? pendingHospitalsCount : null,
      badgeColor: 'bg-rose-500'
    },
    { to: '/admin/management', icon: Activity, label: 'Transfers & Bio-Waste' },
    { to: '/admin/feedback', icon: MessageSquare, label: 'Hospital Feedbacks' },
  ];

  const navItems = role === 'admin' ? adminNavItems : hospitalNavItems;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div>
        <div className="px-3 py-2 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role === 'admin' ? 'ADMINISTRATION PORTAL' : 'HOSPITAL PORTAL'}
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-200/60 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span className={`px-2 py-0.5 text-[10px] font-bold text-white rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-primary-500' : 'text-slate-400'}`} />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Safety & Compliance Badge Box */}
      <div className="mt-6 p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-primary-50/40 border border-slate-200/80">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary-600" />
          <span className="text-xs font-bold text-slate-800">CDSCO Compliant</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Real-time cold chain monitoring & verified inter-hospital trade.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Boxes,
  RefreshCw,
  BellRing,
  Truck,
  CreditCard,
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
  Zap,
  Lock
} from 'lucide-react';

export const LandingPage = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Hospital Verification',
      desc: 'Rigorous 4-step compliance audit verifying CDSCO registration, drug permits, and medical director authorization.',
      color: 'from-teal-500 to-emerald-600',
      tag: 'Strict Audit',
    },
    {
      icon: Boxes,
      title: 'Inventory Management',
      desc: 'Real-time stock ledger with intelligent concession calculator adjusting discounts based on shelf-life months.',
      color: 'from-blue-500 to-cyan-600',
      tag: 'Dynamic Pricing',
    },
    {
      icon: RefreshCw,
      title: 'Medicine Exchange',
      desc: 'Direct inter-hospital marketplace enabling immediate transfer of near-expiry stocks to high-volume trauma units.',
      color: 'from-indigo-500 to-blue-600',
      tag: 'Zero Wastage',
    },
    {
      icon: BellRing,
      title: 'Expiry Alerts',
      desc: 'Automated 90/60/30-day early warnings flagging slow-moving batches for prioritized redistribution.',
      color: 'from-amber-500 to-orange-600',
      tag: 'Smart Triggers',
    },
    {
      icon: Truck,
      title: 'Logistics Tracking',
      desc: 'IoT GPS telemetry and cold-chain temperature monitoring (2°C - 8°C) ensure drug potency during transit.',
      color: 'from-sky-500 to-teal-600',
      tag: 'Cold Chain SLA',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      desc: 'Integrated Razorpay B2B Escrow locking settlement funds until physical pharmacy intake inspection.',
      color: 'from-emerald-500 to-teal-700',
      tag: 'Escrow Protected',
    },
  ];

  const stats = [
    { value: '100+', label: 'Verified Hospitals', desc: 'Across 18 State Health Networks' },
    { value: '5,000+', label: 'Medicines Available', desc: 'Critical Care & Oncology' },
    { value: '1,000+', label: 'Transfers Completed', desc: 'Zero Temperature Excursions' },
    { value: '98%', label: 'Success Rate', desc: 'Avg Delivery Time: 18.2 Hours' },
  ];

  return (
    <div className="space-y-20 pb-16 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-primary-50/50 via-white to-slate-50 border-b border-slate-200/60">
        {/* Glow backdrop circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-primary-200/30 via-teal-100/20 to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100/80 border border-primary-200 text-primary-800 text-xs font-bold tracking-wide shadow-sm animate-pulse-slow">
              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
              <span>Next-Gen Healthcare Supply Redistribution</span>
            </div>

            {/* Main Title & Tagline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-secondary-900 tracking-tight leading-tight">
              Smart<span className="text-primary-500">MediShare</span>
            </h1>

            <p className="text-lg sm:text-xl font-medium text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Collaborative Healthcare Logistics & Medicine Exchange Platform. Connecting hospital pharmacies to eradicate medicine expiration wastage and secure critical drug availability.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/hospital-signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-xl shadow-primary-500/25 transition-all hover:scale-105"
              >
                <span>Register Hospital</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition-all hover:border-slate-400"
              >
                <span>Sign In to Portal</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>CDSCO Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Razorpay Escrow Protected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>IoT Cold-Chain Telemetry</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS COUNTER BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-3 border-r last:border-r-0 border-slate-100">
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-600 tracking-tight">
                {stat.value}
              </p>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{stat.label}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 6 FEATURE CARDS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600">
            Enterprise Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-secondary-900 tracking-tight">
            Six Pillars of Smart Hospital Logistics
          </h2>
          <p className="text-sm text-slate-600">
            Built from ground up to solve hospital pharmacy inventory imbalances while upholding statutory drug safety regulations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white rounded-2xl border border-slate-200/80 p-6 shadow-md hover:shadow-xl hover:border-primary-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:translate-x-1 transition-transform">
                  <span>Learn workflow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. WORKFLOW STEPPER BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-secondary-900 via-secondary-800 to-[#0C2340] text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-300 bg-primary-900/60 px-3 py-1 rounded-full border border-primary-500/30">
              Zero Drug Wastage Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug">
              How SmartMediShare Powers Inter-Hospital Drug Redistribution
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-xs">
              <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-primary-400 font-extrabold text-sm">Step 01</div>
                <h4 className="font-bold text-white text-sm">List Near-Expiry Batch</h4>
                <p className="text-slate-300">Hospital lists surplus medicines. Concession calculator applies dynamic discounts based on shelf life.</p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-primary-400 font-extrabold text-sm">Step 02</div>
                <h4 className="font-bold text-white text-sm">Peer Request & Escrow</h4>
                <p className="text-slate-300">Partner hospital requests items. Funds are safely locked in Razorpay B2B Escrow upon acceptance.</p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-primary-400 font-extrabold text-sm">Step 03</div>
                <h4 className="font-bold text-white text-sm">Cold Chain Transit</h4>
                <p className="text-slate-300">Shipment dispatched in temperature-controlled boxes with live GPS tracking and delivery signoff.</p>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link
                to="/hospital-signup"
                className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-secondary-900 font-extrabold text-xs shadow-lg transition-all"
              >
                Onboard Your Hospital Now
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;

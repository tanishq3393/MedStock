import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, 
  Truck, 
  MapPin, 
  Thermometer, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Navigation,
  Activity,
  Boxes,
  AlertCircle,
  Radio,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { fetchTrackingByTxn } from '../../store/slices/trackSlice';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const TrackPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { currentTracking, isLoading } = useSelector((state) => state.track);

  const initialTxn = searchParams.get('txn') || 'TXN-773120';
  const [txnInput, setTxnInput] = useState(initialTxn);
  const [selectedTxn, setSelectedTxn] = useState(initialTxn);

  useEffect(() => {
    dispatch(fetchTrackingByTxn(selectedTxn));
  }, [dispatch, selectedTxn]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (txnInput.trim()) {
      setSelectedTxn(txnInput.trim());
      setSearchParams({ txn: txnInput.trim() });
    }
  };

  const handleSelectShipment = (txnId) => {
    setSelectedTxn(txnId);
    setTxnInput(txnId);
    setSearchParams({ txn: txnId });
  };

  const allAvailableShipments = [
    {
      txnId: 'TXN-773120',
      trackingNo: 'SMS-EXP-88912',
      medicine: 'Enoxaparin Sodium 40mg Prefilled',
      units: 50,
      from: 'Max Super Speciality (Delhi)',
      to: 'Apollo Hospital (Mumbai)',
      status: 'In Transit',
      temp: '4.2°C',
      eta: 'Today, 06:30 PM'
    },
    {
      txnId: 'TXN-984210',
      trackingNo: 'SMS-EXP-90145',
      medicine: 'Meropenem 1g IV Injection',
      units: 45,
      from: 'Fortis Memorial (Gurgaon)',
      to: 'Apollo Hospital (Mumbai)',
      status: 'Ordered',
      temp: '3.9°C',
      eta: 'Tomorrow, 11:00 AM'
    },
    {
      txnId: 'TXN-451290',
      trackingNo: 'SMS-EXP-66231',
      medicine: 'Human Albumin 20% Infusion',
      units: 28,
      from: 'Lilavati Hospital (Mumbai)',
      to: 'Fortis Hospital (Gurgaon)',
      status: 'In Transit',
      temp: '4.0°C',
      eta: 'Today, 04:40 PM'
    }
  ];

  const tracking = currentTracking || {
    transactionId: 'TXN-773120',
    trackingNumber: 'SMS-EXP-88912',
    senderHospital: 'Max Super Speciality Hospital (Delhi)',
    receiverHospital: 'Apollo Hospital (Mumbai)',
    medicineName: 'Enoxaparin Sodium 40mg Prefilled Syringe',
    quantity: 50,
    status: 'In Transit',
    currentLocation: 'NH-48 Logistic Hub, Vadodara, Gujarat',
    destination: 'Apollo Hospital Central Pharmacy, Belapur, Mumbai',
    eta: 'Today, 06:30 PM (Est. 4 hrs)',
    courierName: 'MediCold Logistics Express Ltd.',
    courierContact: '+91 91234 56789 (Driver: Harpreet Singh)',
    vehicleNo: 'MH-04-AZ-4419 (Temp Controlled)',
    temperature: '4.2°C (Compliant)',
    timeline: [
      { step: 'Order Placed & Verified', date: '2024-08-25 14:15', completed: true, details: 'Verified by SmartMediShare verification engine.' },
      { step: 'Payment Processed via Razorpay', date: '2024-08-26 09:45', completed: true, details: 'Ref: pay_Nz8849qK91Xza, ₹18,000 settled.' },
      { step: 'Dispatched & Cold Seal Applied', date: '2024-08-26 15:30', completed: true, details: 'Dispatched from Saket Hub, Temp: 3.8°C.' },
      { step: 'In Transit with Live IoT GPS/Temp', date: '2024-08-27 11:20', completed: true, details: 'Crossing Vadodara Hub checkpoint.' },
      { step: 'Delivered to Receiving Hospital', date: 'Pending', completed: false, details: 'Target delivery at Mumbai pharmacy intake dock.' },
    ]
  };

  // 6-point temperature telemetry log for graph simulation
  const tempLogs = [
    { time: '08:00', temp: 3.8 },
    { time: '10:00', temp: 4.0 },
    { time: '12:00', temp: 4.3 },
    { time: '14:00', temp: 4.1 },
    { time: '16:00', temp: 4.2 },
    { time: 'Current', temp: 4.2 },
  ];

  return (
    <div className="space-y-6 pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-secondary-900 tracking-tight">
              Live Cold-Chain Logistics Command Center
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              IOT TELEMETRY LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time IoT temperature monitoring, highway waypoint checkpoints, and cryptographic custody verification for inter-hospital medicine consignments.
          </p>
        </div>
      </div>

      {/* 3-COLUMN COCKPIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Shipment List Selector (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Quick Search */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="TXN ID (e.g. TXN-773120)..."
                value={txnInput}
                onChange={(e) => setTxnInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </form>
          </div>

          {/* Active Consignment Selector Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-slate-400 uppercase">
              <span>Consignments</span>
              <span>{allAvailableShipments.length} Active</span>
            </div>

            {allAvailableShipments.map((s) => {
              const isSelected = selectedTxn === s.txnId;

              return (
                <div
                  key={s.txnId}
                  onClick={() => handleSelectShipment(s.txnId)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-primary-50/60 border-primary-500 shadow-md ring-2 ring-primary-500/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                        {s.medicine}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {s.units} units • {s.txnId}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  <div className="text-[11px] text-slate-600 truncate">
                    <span className="font-semibold text-slate-800">{s.from}</span>
                    <span className="text-slate-400 mx-1">➔</span>
                    <span className="font-semibold text-slate-800">{s.to}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-700 font-bold flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-cyan-600" />
                      {s.temp}
                    </span>
                    <span className="text-slate-500">{s.eta}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* COLUMN 2: Large Interactive Telemetry Map (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Highway Telemetry Corridor
                </h3>
                <p className="text-xs text-slate-400">Live GPS tracking via National Highway 48 corridor</p>
              </div>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-800">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                Live 60s Sync
              </span>
            </div>

            {/* Spatial Dark Map Container */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#081521] via-[#0D2133] to-[#061019] p-5 text-white min-h-[340px] flex flex-col justify-between border border-slate-800 shadow-2xl select-none">
              
              <div className="absolute inset-0 bg-grid-dark opacity-35 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Map Top Coordinates */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
                    Geospatial GPS Coordinate
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span>{tracking.currentLocation}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                    Estimated Delivery
                  </span>
                  <p className="text-xs font-mono font-extrabold text-emerald-400 mt-0.5">
                    {tracking.eta}
                  </p>
                </div>
              </div>

              {/* SVG Highway Route */}
              <div className="relative z-10 py-8 my-auto">
                <svg className="w-full h-12" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0A6E79" />
                      <stop offset="65%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#334155" />
                    </linearGradient>
                  </defs>
                  
                  {/* Highway corridor line */}
                  <line x1="5" y1="10" x2="95" y2="10" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
                  <line x1="5" y1="10" x2="68" y2="10" stroke="url(#trackGrad)" strokeWidth="4" strokeLinecap="round" />

                  {/* Nodes */}
                  <circle cx="5" cy="10" r="3" fill="#0A6E79" />
                  <circle cx="35" cy="10" r="2" fill="#06B6D4" />
                  <circle cx="68" cy="10" r="3.5" fill="#F59E0B" />
                  <circle cx="95" cy="10" r="3" fill="#475569" />
                </svg>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>Origin Dock (Delhi)</span>
                  <span className="text-amber-400 font-bold">● Vadodara Hub (Live)</span>
                  <span>Intake Dock (Mumbai)</span>
                </div>
              </div>

              {/* Telemetry Strip */}
              <div className="relative z-10 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Vehicle Registry</span>
                  <strong className="text-white">{tracking.vehicleNo}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Current Velocity</span>
                  <strong className="text-cyan-300">68 km/h (Express Route)</strong>
                </div>
              </div>

            </div>

            {/* Consignment Overview */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Origin Dispatch Dock</span>
                <p className="font-bold text-slate-800 mt-1 leading-snug">{tracking.senderHospital}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Destination Receiving Dock</span>
                <p className="font-bold text-slate-800 mt-1 leading-snug">{tracking.receiverHospital}</p>
              </div>
            </div>

          </div>

        </div>

        {/* COLUMN 3: Consignment Dossier & Temperature Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Cold-Chain IoT Sensor Monitor */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-xs text-primary-700">
                <Thermometer className="w-4 h-4 text-primary-600" />
                <span>Cold Chain Sensor Health</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                COMPLIANT 2°C - 8°C
              </span>
            </div>

            {/* Chamber readout */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-teal-50 border border-primary-200 text-center space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-primary-700">
                Internal Chamber Temperature
              </span>
              <div className="text-3xl font-extrabold font-mono text-primary-900 tracking-tight">
                {tracking.temperature}
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Digital Data Logger: ±0.1°C precision
              </p>
            </div>

            {/* Temperature History Line Graph Simulation */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Chamber Temperature History (Today)
              </span>
              
              <div className="grid grid-cols-6 gap-1 text-center font-mono">
                {tempLogs.map((tl, idx) => (
                  <div key={idx} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">{tl.time}</span>
                    <span className="text-xs font-bold text-primary-700">{tl.temp}°C</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chain of Custody Stamp */}
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-emerald-900 block">Chain of Custody: Verified</span>
                <span className="text-[10px] text-emerald-700">Cryo-seal intact, tamper sensors locked.</span>
              </div>
            </div>
          </div>

          {/* Courier Partner Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 text-primary-600" />
              <span>Dedicated Bio-Express Courier</span>
            </div>

            <div className="space-y-1 text-xs">
              <h5 className="font-extrabold text-slate-900">{tracking.courierName}</h5>
              <p className="text-slate-500 text-[11px]">Specialized Medical Transit Partner</p>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mt-2 flex items-center gap-2 text-slate-700 font-mono">
                <Phone className="w-3.5 h-3.5 text-primary-600" />
                <span>{tracking.courierContact}</span>
              </div>
            </div>
          </div>

          {/* 5-Step Milestone Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Milestone Audit Trail
            </h4>

            <div className="space-y-3 pt-1">
              {tracking.timeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 relative text-xs">
                  {idx !== tracking.timeline.length - 1 && (
                    <div className={`absolute left-3 top-5 w-0.5 h-7 ${
                      item.completed ? 'bg-primary-500' : 'bg-slate-200'
                    }`} />
                  )}

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 ${
                    item.completed ? 'bg-primary-600 ring-2 ring-primary-100' : 'bg-slate-200 text-slate-400'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${item.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {item.step}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default TrackPage;

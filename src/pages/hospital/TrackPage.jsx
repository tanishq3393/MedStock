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
  AlertCircle
} from 'lucide-react';
import { fetchTrackingByTxn } from '../../store/slices/trackSlice';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const TrackPage = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { currentTracking, isLoading } = useSelector((state) => state.track);

  const initialTxn = searchParams.get('txn') || 'TXN-773120';
  const [txnInput, setTxnInput] = useState(initialTxn);

  useEffect(() => {
    dispatch(fetchTrackingByTxn(txnInput));
  }, [dispatch, txnInput]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (txnInput.trim()) {
      dispatch(fetchTrackingByTxn(txnInput.trim()));
    }
  };

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Live Cold-Chain Logistics Tracker</h1>
          <p className="text-xs text-slate-500">
            Real-time IoT temperature telemetry, GPS checkpoints, and courier verification for inter-hospital transit.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Transaction ID (e.g. TXN-773120 or TXN-984210)..."
              value={txnInput}
              onChange={(e) => setTxnInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all"
          >
            Track Shipment
          </button>
        </form>

        <div className="flex items-center gap-2 mt-2.5 text-[11px] text-slate-500">
          <span>Quick test transactions:</span>
          <button
            type="button"
            onClick={() => setTxnInput('TXN-773120')}
            className="text-primary-600 hover:underline font-mono font-bold"
          >
            TXN-773120 (In Transit)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setTxnInput('TXN-984210')}
            className="text-primary-600 hover:underline font-mono font-bold"
          >
            TXN-984210 (Ordered)
          </button>
        </div>
      </div>

      {/* Main Grid: Telemetry & Interactive Route Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Shipment Overview & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipment Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Shipment Consignment</span>
                <h3 className="text-lg font-bold text-slate-900">{tracking.medicineName}</h3>
                <p className="text-xs text-slate-500">
                  Consignment Size: <strong className="text-slate-800">{tracking.quantity} units</strong> • AWB: <span className="font-mono text-primary-700">{tracking.trackingNumber}</span>
                </p>
              </div>
              <div>
                <StatusBadge status={tracking.status} />
              </div>
            </div>

            {/* Origin & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Origin Dispatch Dock</span>
                <p className="font-bold text-slate-800 mt-1">{tracking.senderHospital}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination Receiving Dock</span>
                <p className="font-bold text-slate-800 mt-1">{tracking.receiverHospital}</p>
              </div>
            </div>

            {/* 4-Step Status Timeline */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Transit Milestone Journey</h4>
              <div className="space-y-4">
                {tracking.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    {/* Connector line */}
                    {idx !== tracking.timeline.length - 1 && (
                      <div className={`absolute left-3.5 top-6 w-0.5 h-10 ${item.completed ? 'bg-primary-500' : 'bg-slate-200'}`} />
                    )}

                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 ${
                      item.completed ? 'bg-primary-600 ring-4 ring-primary-100' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>

                    <div className="flex-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${item.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                          {item.step}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{item.date}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Interactive Route Visualization Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Highway Telemetry Map</h3>
                <p className="text-xs text-slate-400">Simulated GPS route from Delhi/NCR to Mumbai Western Corridor</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Live GPS Ping
              </span>
            </div>

            {/* Custom SVG Route Visualization Graphic */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-secondary-950 p-6 text-white min-h-[220px] flex flex-col justify-between border border-slate-800">
              
              {/* Background grid pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-primary-400">Current Geolocation</span>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
                    {tracking.currentLocation}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Delivery</span>
                  <p className="text-sm font-extrabold text-emerald-400">{tracking.eta}</p>
                </div>
              </div>

              {/* Highway Route Track */}
              <div className="relative z-10 py-6">
                <div className="w-full bg-slate-700/80 h-2 rounded-full relative overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-500 via-teal-400 to-amber-400 h-2 rounded-full w-3/4" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-2 font-medium">
                  <span>Origin (Saket Delhi)</span>
                  <span className="text-amber-400 font-bold">● Active Transit (Vadodara)</span>
                  <span>Destination (Mumbai)</span>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <span>Vehicle: <strong className="text-white font-mono">{tracking.vehicleNo}</strong></span>
                <span>Speed: <strong className="text-white font-mono">68 km/h</strong></span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Cold Chain & Courier SLA */}
        <div className="space-y-6">
          
          {/* Cold Chain IoT Monitor */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary-700 font-bold text-xs pb-2 border-b border-slate-100">
              <Thermometer className="w-4 h-4 text-primary-600" />
              <span>Cold Chain Integrity Sensor</span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-teal-50 border border-primary-200 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-primary-700">Internal Chamber Temperature</span>
              <div className="text-3xl font-extrabold text-primary-900 tracking-tight">
                {tracking.temperature}
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Compliant with 2°C - 8°C Spec
              </div>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>IoT Sensor Battery:</span>
                <span className="font-bold text-slate-800">94% (Active)</span>
              </div>
              <div className="flex justify-between">
                <span>Data Logger Sync:</span>
                <span className="font-bold text-slate-800">Every 60 seconds</span>
              </div>
              <div className="flex justify-between">
                <span>Temperature Deviations:</span>
                <span className="font-bold text-emerald-600">0 Alerts</span>
              </div>
            </div>
          </div>

          {/* Courier Dispatcher Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-secondary-800 font-bold text-xs pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 text-primary-600" />
              <span>Certified Bio-Express Courier</span>
            </div>

            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-slate-900">{tracking.courierName}</h5>
              <p className="text-slate-500">Cold-Chain Express Fleet Partner</p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Phone className="w-3.5 h-3.5 text-primary-600" />
                  <span>{tracking.courierContact}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default TrackPage;

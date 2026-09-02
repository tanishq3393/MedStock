import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Activity, 
  Truck, 
  Trash2, 
  Building2, 
  MapPin, 
  Thermometer, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Search,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  fetchAllTransfers, 
  updateTransferMilestone, 
  fetchDisposals, 
  updateDisposalMilestone 
} from '../../store/slices/trackSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminManagement = () => {
  const dispatch = useDispatch();
  const { allTransfers, disposals, isLoading } = useSelector((state) => state.track);

  const [activeTab, setActiveTab] = useState('transfers'); // 'transfers' | 'disposals'
  const [searchTerm, setSearchTerm] = useState('');

  // Transfer status modifier modal
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [newTransferStatus, setNewTransferStatus] = useState('In Transit');

  // Disposal status modifier modal
  const [editingDisposal, setEditingDisposal] = useState(null);
  const [newDisposalStatus, setNewDisposalStatus] = useState('In Transit to Bio-Centre');

  useEffect(() => {
    dispatch(fetchAllTransfers());
    dispatch(fetchDisposals());
  }, [dispatch]);

  const handleUpdateTransfer = async (e) => {
    e.preventDefault();
    if (!editingTransfer) return;
    try {
      await dispatch(updateTransferMilestone({
        txnId: editingTransfer.transactionId,
        status: newTransferStatus,
      }));
      toast.success(`Updated transfer milestone to "${newTransferStatus}"`);
      setEditingTransfer(null);
    } catch (err) {
      toast.error('Failed to update transfer status');
    }
  };

  const handleUpdateDisposal = async (e) => {
    e.preventDefault();
    if (!editingDisposal) return;
    try {
      await dispatch(updateDisposalMilestone({
        id: editingDisposal.id,
        status: newDisposalStatus,
      }));
      toast.success(`Updated disposal status to "${newDisposalStatus}"`);
      setEditingDisposal(null);
    } catch (err) {
      toast.error('Failed to update disposal milestone');
    }
  };

  const filteredTransfers = allTransfers.filter((t) =>
    t.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.senderHospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.receiverHospital.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDisposals = disposals.filter((d) =>
    d.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.bioCentreName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Logistics Telemetry & Bio-Waste Oversight</h1>
          <p className="text-xs text-slate-500">
            Real-time multi-state monitoring of live cold-chain medicine transfers and expired bio-hazard incineration.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transfers'
                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Transfer Tracking ({allTransfers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('disposals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'disposals'
                ? 'bg-rose-700 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bio-Waste Disposal ({disposals.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search consignments or facilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* TAB 1: Transfer Tracking */}
      {activeTab === 'transfers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Consignment & TXN</th>
                  <th className="px-4 py-3.5 text-left">Dispatch Source (Origin)</th>
                  <th className="px-4 py-3.5 text-left">Receiving Hospital (Destination)</th>
                  <th className="px-4 py-3.5 text-left">Live Location & Telemetry</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTransfers.length > 0 ? (
                  filteredTransfers.map((t) => (
                    <tr key={t.transactionId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{t.medicineName}</div>
                        <div className="text-[10px] font-mono text-slate-500">TXN: {t.transactionId}</div>
                        <span className="text-[10px] text-primary-700 font-semibold">Qty: {t.quantity} units</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-primary-600" />
                          <span>{t.senderHospital}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t.receiverHospital}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{t.currentLocation}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                          <span className="font-mono text-emerald-600 font-bold">Temp: {t.temperature}</span>
                          <span>•</span>
                          <span>ETA: {t.eta}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => {
                            setEditingTransfer(t);
                            setNewTransferStatus(t.status);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Modify Status
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      <Truck className="w-8 h-8 mx-auto mb-1 opacity-40" />
                      <p className="font-semibold">No transfers found matching your query</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Disposal Tracking */}
      {activeTab === 'disposals' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Expired Medicine Lot</th>
                  <th className="px-4 py-3.5 text-left">Origin Hospital</th>
                  <th className="px-4 py-3.5 text-left">Certified Bio-Centre Facility</th>
                  <th className="px-4 py-3.5 text-left">Transit Vehicle & Telemetry</th>
                  <th className="px-4 py-3.5 text-center">Disposal Status</th>
                  <th className="px-5 py-3.5 text-center">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredDisposals.length > 0 ? (
                  filteredDisposals.map((disp) => (
                    <tr key={disp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{disp.medicineName}</div>
                        <div className="text-[10px] font-mono text-slate-400">Batch: {disp.batchNo} • Exp: {disp.expiryDate}</div>
                        <span className="text-[10px] font-bold text-rose-700">{disp.quantity}</span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {disp.hospitalName}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-800">{disp.bioCentreName}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-slate-800">{disp.vehicleNo}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{disp.currentLocation}</div>
                        <div className="text-[10px] text-slate-400">{disp.eta}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={disp.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setEditingDisposal(disp);
                              setNewDisposalStatus(disp.status);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                          >
                            Update Milestone
                          </button>
                          {disp.certificateNo && (
                            <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                              Cert: {disp.certificateNo}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      <Trash2 className="w-8 h-8 mx-auto mb-1 opacity-40" />
                      <p className="font-semibold">No disposal records recorded</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Milestone Modal */}
      {editingTransfer && (
        <Modal
          isOpen={!!editingTransfer}
          onClose={() => setEditingTransfer(null)}
          title="Update Transfer Logistics Milestone"
          subtitle={`Consignment: ${editingTransfer.medicineName} (${editingTransfer.transactionId})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateTransfer} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Active Milestone</label>
              <select
                value={newTransferStatus}
                onChange={(e) => setNewTransferStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none bg-white font-medium"
              >
                <option value="Ordered">Ordered (Awaiting Pickup)</option>
                <option value="Dispatched">Dispatched from Dock</option>
                <option value="In Transit">In Transit on Highway</option>
                <option value="Delivered">Delivered & Inspected</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTransfer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
              >
                Save Milestone
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Disposal Milestone Modal */}
      {editingDisposal && (
        <Modal
          isOpen={!!editingDisposal}
          onClose={() => setEditingDisposal(null)}
          title="Update Bio-Hazard Incineration Status"
          subtitle={`Disposal Lot: ${editingDisposal.medicineName}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateDisposal} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Disposal Status</label>
              <select
                value={newDisposalStatus}
                onChange={(e) => setNewDisposalStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none bg-white font-medium"
              >
                <option value="Pending Pickup">Pending Bio-Centre Vehicle Pickup</option>
                <option value="In Transit to Bio-Centre">In Transit to Bio-Centre</option>
                <option value="Incinerated & Certified">Incinerated & Certified</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDisposal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm"
              >
                Update Status
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default AdminManagement;

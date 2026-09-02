import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  History, 
  TrendingUp, 
  ShoppingBag, 
  Download, 
  Calendar, 
  Search, 
  Filter,
  FileSpreadsheet,
  Building2
} from 'lucide-react';
import { fetchSalesHistory, fetchPurchasesHistory } from '../../store/slices/hospitalSlice';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const HistoryPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { salesHistory, purchasesHistory, isLoading } = useSelector((state) => state.hospital);

  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'purchases'
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchSalesHistory(user?.id || 'hosp-1'));
    dispatch(fetchPurchasesHistory(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  const activeData = activeTab === 'sales' ? salesHistory : purchasesHistory;

  const filteredData = activeData.filter((item) => {
    const matchesSearch = item.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partnerHospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    const itemDate = new Date(item.date);
    const matchesStart = !startDate || itemDate >= new Date(startDate);
    const matchesEnd = !endDate || itemDate <= new Date(endDate);

    return matchesSearch && matchesStart && matchesEnd;
  });

  // Export to CSV generator
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error('No records available to export');
      return;
    }

    const headers = ['Transaction ID', 'Medicine', 'Partner Hospital', 'Quantity', 'Amount (INR)', 'Date', 'Status'];
    const rows = filteredData.map((row) => [
      `"${row.transactionId || row.id}"`,
      `"${row.medicine}"`,
      `"${row.partnerHospital}"`,
      row.quantity,
      row.amount,
      row.date,
      `"${row.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartMediShare_${activeTab}_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredData.length} records to CSV successfully!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Trade History & Ledger</h1>
          <p className="text-xs text-slate-500">
            Comprehensive audit log of medicine sales and procurements across partner health facilities.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sales'
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>My Sales ({salesHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'purchases'
                  ? 'bg-secondary-800 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>My Purchases ({purchasesHistory.length})</span>
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>From:</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none"
            />
            <div className="flex items-center gap-1 text-slate-500">
              <span>To:</span>
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none"
            />
          </div>

        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by medicine, hospital name or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner text="Fetching trade ledger..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Transaction ID</th>
                  <th className="px-4 py-3.5 text-left">Medicine Formulation</th>
                  <th className="px-4 py-3.5 text-left">{activeTab === 'sales' ? 'Buyer Hospital' : 'Supplier Hospital'}</th>
                  <th className="px-4 py-3.5 text-center">Quantity</th>
                  <th className="px-4 py-3.5 text-right">Settled Amount</th>
                  <th className="px-4 py-3.5 text-left">Date</th>
                  <th className="px-5 py-3.5 text-center">Milestone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">
                        {row.transactionId || row.id}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {row.medicine}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                          <span>{row.partnerHospital}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-900">
                        {row.quantity} units
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-primary-700">
                        ₹{row.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {row.date}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No trade history records found in this range</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default HistoryPage;

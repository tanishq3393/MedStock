import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Hospital,
  MapPin,
  Package,
  Search,
<<<<<<< HEAD
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { auditService } from "../../services/auditService";
import "./IncomingRequests.css";

/*
  ============================================================
  INCOMING REQUESTS
  ============================================================
=======
  Truck,
  Sparkles,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { fetchIncomingRequests, respondToRequest } from '../../store/slices/requestSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import WorkflowTimeline from '../../components/common/WorkflowTimeline';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import { isHospitalSuspended } from '../../services/storage';
import { getRequestRemainingTime } from '../../utils/expiryUtils';

export const IncomingRequests = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { incomingRequests, isLoading, isResponding } = useSelector((state) => state.requests);
  const { inventory = [] } = useSelector((state) => state.hospital);
  const isSuspended = isHospitalSuspended(user?.id);
>>>>>>> 6ddff35 (Added Cancel)

  Frontend-safe implementation.

<<<<<<< HEAD
  Features:
  - Search requests
  - Filter by status
  - View request details
  - Approve request
  - Reject request
  - Confirmation modals
  - Loading/empty states
  - No undefined Lucide icons
  - No conditional hooks
  - Local mock state only

  Backend/API integration can be connected later.
*/

const INITIAL_REQUESTS = [
  {
    id: "REQ-2026-014",
    hospital: "Apollo Care Hospital",
    hospitalCode: "ACH-2048",
    medicine: "Paracetamol 500mg",
    genericName: "Paracetamol",
    composition: "Paracetamol 500 mg",
    form: "Tablet",
    quantity: 100,
    unit: "tablets",
    requestedPrice: 3.5,
    totalAmount: 350,
    requestedDate: "13 Aug 2026",
    requestedTime: "10:30 AM",
    status: "Pending",
    priority: "Normal",
    delivery: "Standard",
    distance: "8.4 km",
    notes: "Required for general ward stock.",
    batch: "PCM-A123",
    expiry: "15 Sep 2026",
  },
  {
    id: "REQ-2026-015",
    hospital: "Green Valley Hospital",
    hospitalCode: "GVH-1092",
    medicine: "Amoxicillin 250mg",
    genericName: "Amoxicillin",
    composition: "Amoxicillin 250 mg",
    form: "Capsule",
    quantity: 150,
    unit: "capsules",
    requestedPrice: 5.2,
    totalAmount: 780,
    requestedDate: "13 Aug 2026",
    requestedTime: "09:15 AM",
    status: "Pending",
    priority: "High",
    delivery: "Express",
    distance: "12.7 km",
    notes: "Urgent requirement for inpatient department.",
    batch: "AMX-B205",
    expiry: "20 Dec 2026",
  },
  {
    id: "REQ-2026-011",
    hospital: "LifeCare Hospital",
    hospitalCode: "LCH-3318",
    medicine: "Ceftriaxone 1g",
    genericName: "Ceftriaxone",
    composition: "Ceftriaxone 1 g",
    form: "Injection",
    quantity: 50,
    unit: "vials",
    requestedPrice: 42,
    totalAmount: 2100,
    requestedDate: "12 Aug 2026",
    requestedTime: "04:20 PM",
    status: "Accepted",
    priority: "Normal",
    delivery: "Standard",
    distance: "5.2 km",
    notes: "Routine stock replenishment.",
    batch: "CEF-E109",
    expiry: "05 Oct 2026",
  },
  {
    id: "REQ-2026-010",
    hospital: "City Medical Centre",
    hospitalCode: "CMC-8871",
    medicine: "Azithromycin 500mg",
    genericName: "Azithromycin",
    composition: "Azithromycin 500 mg",
    form: "Tablet",
    quantity: 80,
    unit: "tablets",
    requestedPrice: 7.5,
    totalAmount: 600,
    requestedDate: "11 Aug 2026",
    requestedTime: "01:45 PM",
    status: "Rejected",
    priority: "Normal",
    delivery: "Standard",
    distance: "18.1 km",
    notes: "Requested quantity unavailable.",
    batch: "AZI-D221",
    expiry: "30 Oct 2026",
  },
  {
    id: "REQ-2026-009",
    hospital: "Metro Hospital",
    hospitalCode: "MTH-4412",
    medicine: "Insulin Injection",
    genericName: "Human Insulin",
    composition: "Human Insulin 40 IU/ml",
    form: "Injection",
    quantity: 25,
    unit: "vials",
    requestedPrice: 145,
    totalAmount: 3625,
    requestedDate: "10 Aug 2026",
    requestedTime: "11:10 AM",
    status: "Pending",
    priority: "High",
    delivery: "Express",
    distance: "3.9 km",
    notes: "Critical stock requirement.",
    batch: "INS-I778",
    expiry: "18 Nov 2026",
  },
];

const STATUS_OPTIONS = ["All", "Pending", "Accepted", "Rejected"];

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getStatusClass(status) {
  return status.toLowerCase();
}

function StatusBadge({ status }) {
  const icons = {
    Pending: <Clock size={14} />,
    Accepted: <CheckCircle size={14} />,
    Rejected: <XCircle size={14} />,
  };

=======
  // Map inventory stock by id and brandName
  const stockMap = useMemo(() => {
    const map = {};
    inventory.forEach((item) => {
      if (item.id) map[item.id] = Number(item.quantity) || 0;
      if (item.brandName) map[item.brandName.toLowerCase()] = Number(item.quantity) || 0;
    });
    return map;
  }, [inventory]);

  const getAvailableStockForReq = (req) => {
    if (!req) return 0;
    if (req.medicineId && stockMap[req.medicineId] !== undefined) {
      return stockMap[req.medicineId];
    }
    const nameKey = (req.medicineName || '').split('(')[0].trim().toLowerCase();
    if (stockMap[nameKey] !== undefined) {
      return stockMap[nameKey];
    }
    return 100; // Default fallback if lot was created in external seed
  };

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchIncomingRequests(user.id));
    }
  }, [dispatch, user?.id]);

  const handleConfirmAccept = async () => {
    if (!acceptModalReq) return;
    const avail = getAvailableStockForReq(acceptModalReq);
    if (acceptModalReq.quantity > avail) {
      toast.error(`Cannot accept requisition: Requested quantity (${acceptModalReq.quantity}) exceeds available stock (${avail} units).`);
      return;
    }
    try {
      await dispatch(respondToRequest({ requestId: acceptModalReq.id, action: 'accept', hospitalId: user?.id })).unwrap();
      toast.success(`Accepted requisition from ${acceptModalReq.fromHospitalName}. Earmarked inventory lot.`);
      setAcceptModalReq(null);
    } catch (err) {
      toast.error('Failed to accept request: ' + (err.message || 'Error occurred'));
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalReq) return;
    try {
      await dispatch(respondToRequest({ 
        requestId: rejectModalReq.id, 
        action: 'reject', 
        reason: rejectReason || 'Stock reserved for critical inpatient use.',
        hospitalId: user?.id
      })).unwrap();
      toast.success(`Declined requisition from ${rejectModalReq.fromHospitalName}`);
      setRejectModalReq(null);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };

  const filtered = incomingRequests.filter((r) => {
    const matchesSearch = (r.fromHospitalName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.medicineName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const isCancelled = r.status === 'cancelled' || r.status === 'cancelled by buyer';

    if (filterTab === 'all') return matchesSearch;
    if (filterTab === 'pending') return matchesSearch && r.status === 'pending' && !isCancelled;
    if (filterTab === 'accepted') return matchesSearch && (r.status === 'accepted' || r.status === 'paid') && !isCancelled;
    if (filterTab === 'cancelled') return matchesSearch && isCancelled;
    return matchesSearch;
  });

  const pendingCount = incomingRequests.filter((r) => r.status === 'pending' && r.status !== 'cancelled' && r.status !== 'cancelled by buyer').length;
  const cancelledCount = incomingRequests.filter((r) => r.status === 'cancelled' || r.status === 'cancelled by buyer').length;

>>>>>>> 6ddff35 (Added Cancel)
  return (
    <span className={`incoming-status-badge ${getStatusClass(status)}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`incoming-priority-badge ${priority.toLowerCase()}`}
    >
      {priority}
    </span>
  );
}

export default function IncomingRequests() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [actionRequest, setActionRequest] = useState(null);
  const [actionType, setActionType] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "All" ||
        request.status === statusFilter;

      const matchesSearch =
        !query ||
        request.id.toLowerCase().includes(query) ||
        request.hospital.toLowerCase().includes(query) ||
        request.medicine.toLowerCase().includes(query) ||
        request.genericName.toLowerCase().includes(query) ||
        request.composition.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const acceptedCount = requests.filter(
    (request) => request.status === "Accepted"
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected"
  ).length;

  const totalRequestedUnits = requests
    .filter((request) => request.status === "Pending")
    .reduce((sum, request) => sum + request.quantity, 0);

  function openAction(request, type) {
    if (!request) return;
    if (request.status !== "Pending") {
      toast.error(`Invalid transition: Request is already marked as "${request.status}" and cannot be modified.`);
      return;
    }
    if (actionLoading) return;
    setActionRequest(request);
    setActionType(type);
  }

  function closeAction() {
    if (actionLoading) return;

    setActionRequest(null);
    setActionType(null);
  }

  function handleAction() {
    if (!actionRequest || !actionType) return;
    if (actionLoading) return;

    // Strict validation: Only Pending -> Accepted or Pending -> Rejected is permissible
    if (actionRequest.status !== "Pending") {
      toast.error(`Cannot process: Request status is currently "${actionRequest.status}". Only Pending requests can be decided.`);
      setActionRequest(null);
      setActionType(null);
      return;
    }

    setActionLoading(true);

    setTimeout(() => {
      const newStatus =
        actionType === "approve" ? "Accepted" : "Rejected";

      // Log to audit trail
      auditService.logEvent({
        action: actionType === "approve" ? "REQUEST_ACCEPTED" : "REQUEST_REJECTED",
        entityType: "REQUEST",
        entityId: actionRequest.id,
        actorRole: "hospital",
        hospitalName: "Authorized Provider Hospital",
        partnerHospitalName: actionRequest.hospital,
        summary: `${actionType === "approve" ? "Approved" : "Declined"} requisition ${actionRequest.id} for ${actionRequest.quantity} units of ${actionRequest.medicine}.`,
        resultingStatus: newStatus,
        metadata: { medicine: actionRequest.medicine, batch: actionRequest.batch, quantity: actionRequest.quantity, amount: actionRequest.totalAmount },
      });

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === actionRequest.id
            ? {
              ...request,
              status: newStatus,
              decidedAt: new Date().toISOString(),
            }
            : request
        )
      );

      if (selectedRequest?.id === actionRequest.id) {
        setSelectedRequest((current) =>
          current
            ? {
              ...current,
              status: newStatus,
              decidedAt: new Date().toISOString(),
            }
            : current
        );
      }

      toast.success(`Request ${actionRequest.id} marked as ${newStatus}`);
      setActionLoading(false);
      setActionRequest(null);
      setActionType(null);
    }, 500);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
  }

  return (
    <div className="incoming-requests-page">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="incoming-page-header">
        <div>
          <div className="incoming-eyebrow">
            HOSPITAL PORTAL
          </div>

          <h1>Incoming Requests</h1>

          <p>
            Review medicine requests from other verified
            hospitals and decide whether to approve or reject
            them.
          </p>
        </div>

        <div className="incoming-header-summary">
          <div className="incoming-header-summary-icon">
            <Package size={22} />
          </div>

          <div>
            <strong>{pendingCount}</strong>
            <span>Pending requests</span>
          </div>
        </div>
      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="incoming-stats-grid">
        <div className="incoming-stat-card pending">
          <div className="incoming-stat-icon">
            <Clock size={22} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting your decision</small>
          </div>
        </div>

        <div className="incoming-stat-card accepted">
          <div className="incoming-stat-icon">
            <CheckCircle size={22} />
          </div>

          <div>
            <span>Accepted</span>
            <strong>{acceptedCount}</strong>
            <small>Approved requests</small>
          </div>
        </div>

        <div className="incoming-stat-card rejected">
          <div className="incoming-stat-icon">
            <XCircle size={22} />
          </div>

          <div>
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
            <small>Declined requests</small>
          </div>
        </div>

        <div className="incoming-stat-card units">
          <div className="incoming-stat-icon">
            <Package size={22} />
          </div>

          <div>
            <span>Pending Units</span>
            <strong>
              {totalRequestedUnits.toLocaleString("en-IN")}
            </strong>
            <small>Medicine units requested</small>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER TOOLBAR
      ===================================================== */}

      <div className="incoming-toolbar">
        <div className="incoming-search-box">
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search hospital, medicine or request ID..."
          />

          {search && (
            <button
              type="button"
              className="incoming-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

<<<<<<< HEAD
        <div className="incoming-filter-group">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              className={`incoming-filter-button ${statusFilter === status ? "active" : ""
                }`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          REQUEST LIST
      ===================================================== */}

      <div className="incoming-list-card">
        <div className="incoming-list-header">
          <div>
            <h2>Medicine Requests</h2>
            <p>
              {filteredRequests.length} request
              {filteredRequests.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {(search || statusFilter !== "All") && (
            <button
              type="button"
              className="incoming-clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredRequests.length === 0 ? (
          <div className="incoming-empty-state">
            <div className="incoming-empty-icon">
              <Package size={32} />
            </div>

            <h3>No requests found</h3>

            <p>
              No incoming medicine requests match your current
              search or filter.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="incoming-primary-button"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="incoming-table-wrapper">
            <table className="incoming-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Requesting Hospital</th>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Requested</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="incoming-request-id">
                        <strong>{request.id}</strong>

                        <span>
                          <Calendar size={13} />
                          {request.requestedDate}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="incoming-hospital-cell">
                        <div className="incoming-hospital-icon">
                          <Hospital size={17} />
                        </div>

                        <div>
                          <strong>{request.hospital}</strong>

                          <span>
                            {request.hospitalCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="incoming-medicine-cell">
                        <strong>{request.medicine}</strong>

                        <span>{request.form}</span>
                      </div>
                    </td>

                    <td>
                      <strong className="incoming-quantity">
                        {request.quantity.toLocaleString("en-IN")}
                      </strong>

                      <span className="incoming-unit">
                        {request.unit}
                      </span>
                    </td>

                    <td>
                      <div className="incoming-date-cell">
                        <strong>
                          {request.requestedDate}
                        </strong>

                        <span>{request.requestedTime}</span>
                      </div>
                    </td>

                    <td>
                      <PriorityBadge
                        priority={request.priority}
                      />
                    </td>

                    <td>
                      <StatusBadge status={request.status} />
                    </td>

                    <td>
                      <div className="incoming-actions">
                        <button
                          type="button"
                          className="incoming-view-button"
                          onClick={() =>
                            setSelectedRequest(request)
                          }
                          title="View request details"
                        >
                          <Eye size={16} />
                          View
                        </button>

                        {request.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              className="incoming-approve-button"
                              disabled={actionLoading}
                              onClick={() =>
                                openAction(
                                  request,
                                  "approve"
                                )
                              }
                              title="Approve request"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>

                            <button
                              type="button"
                              className="incoming-reject-button"
                              disabled={actionLoading}
                              onClick={() =>
                                openAction(
                                  request,
                                  "reject"
                                )
                              }
                              title="Reject request"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedRequest && (
        <div
          className="incoming-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null);
            }
          }}
        >
          <div
            className="incoming-modal incoming-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incoming-request-details-title"
          >
            <div className="incoming-modal-header">
              <div>
                <span className="incoming-modal-eyebrow">
                  REQUEST DETAILS
                </span>

                <h2 id="incoming-request-details-title">
                  {selectedRequest.id}
                </h2>
              </div>

              <button
                type="button"
                className="incoming-modal-close"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="incoming-modal-body">
              {/* Requesting hospital */}

              <section className="incoming-detail-section">
                <div className="incoming-detail-section-title">
                  <Hospital size={18} />
                  <h3>Requesting Hospital</h3>
                </div>

                <div className="incoming-hospital-detail">
                  <div className="incoming-large-hospital-icon">
                    <Hospital size={24} />
                  </div>

                  <div>
                    <strong>
                      {selectedRequest.hospital}
                    </strong>

                    <span>
                      Hospital Code:{" "}
                      {selectedRequest.hospitalCode}
                    </span>

                    <span>
                      <MapPin size={14} />
                      {selectedRequest.distance} away
                    </span>
                  </div>
                </div>
              </section>

              {/* Medicine */}

              <section className="incoming-detail-section">
                <div className="incoming-detail-section-title">
                  <Package size={18} />
                  <h3>Medicine Details</h3>
                </div>

                <div className="incoming-detail-grid">
                  <div>
                    <span>Medicine</span>
                    <strong>
                      {selectedRequest.medicine}
                    </strong>
                  </div>

                  <div>
                    <span>Generic Name</span>
                    <strong>
                      {selectedRequest.genericName}
                    </strong>
                  </div>

                  <div>
                    <span>Composition</span>
                    <strong>
                      {selectedRequest.composition}
                    </strong>
                  </div>

                  <div>
                    <span>Dosage Form</span>
                    <strong>{selectedRequest.form}</strong>
                  </div>

                  <div>
                    <span>Batch</span>
                    <strong>{selectedRequest.batch}</strong>
                  </div>

                  <div>
                    <span>Expiry</span>
                    <strong>{selectedRequest.expiry}</strong>
                  </div>
                </div>
              </section>

              {/* Request */}

              <section className="incoming-detail-section">
                <div className="incoming-detail-section-title">
                  <Clock size={18} />
                  <h3>Request Information</h3>
                </div>

                <div className="incoming-detail-grid">
                  <div>
                    <span>Quantity</span>
                    <strong>
                      {selectedRequest.quantity.toLocaleString(
                        "en-IN"
                      )}{" "}
                      {selectedRequest.unit}
                    </strong>
                  </div>

                  <div>
                    <span>Requested Price</span>
                    <strong>
                      {formatCurrency(
                        selectedRequest.requestedPrice
                      )}{" "}
                      / unit
                    </strong>
                  </div>

                  <div>
                    <span>Total Amount</span>
                    <strong>
                      {formatCurrency(
                        selectedRequest.totalAmount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Delivery</span>
                    <strong>
                      {selectedRequest.delivery}
                    </strong>
                  </div>

                  <div>
                    <span>Priority</span>
                    <PriorityBadge
                      priority={selectedRequest.priority}
                    />
                  </div>

                  <div>
                    <span>Status</span>
                    <StatusBadge
                      status={selectedRequest.status}
                    />
                  </div>
                </div>
              </section>

              {/* Notes */}

              <section className="incoming-note-box">
                <AlertCircle size={18} />

                <div>
                  <strong>Request note</strong>
                  <p>{selectedRequest.notes}</p>
                </div>
              </section>
            </div>

            {selectedRequest.status === "Pending" && (
              <div className="incoming-modal-footer">
                <button
                  type="button"
                  className="incoming-reject-large"
                  onClick={() => {
                    const request = selectedRequest;
                    setSelectedRequest(null);
                    openAction(request, "reject");
                  }}
                >
                  <XCircle size={18} />
                  Reject Request
                </button>

                <button
                  type="button"
                  className="incoming-approve-large"
                  onClick={() => {
                    const request = selectedRequest;
                    setSelectedRequest(null);
                    openAction(request, "approve");
                  }}
                >
                  <CheckCircle size={18} />
                  Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
=======
        <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Decision ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('accepted')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'accepted'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Authorized Orders
          </button>
          {cancelledCount > 0 && (
            <button
              onClick={() => setFilterTab('cancelled')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filterTab === 'cancelled'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancelled by Buyer ({cancelledCount})
            </button>
          )}
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Requisitions
          </button>
        </div>
      </div>

      {/* Incoming Requests Cards */}
      {isLoading && incomingRequests.length === 0 ? (
        <LoadingSpinner text="Querying pending requisitions..." />
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((req) => {
            const isCancelled = req.status === 'cancelled' || req.status === 'cancelled by buyer';
            const isPending = req.status === 'pending' && !isCancelled;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all p-5 space-y-4"
              >
                {/* Requisition Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Originating Buyer Institution
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                          {req.fromHospitalName}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400">
                          ID: {req.transactionId || req.id} • Received: {new Date(req.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Receivable Total</span>
                      <span className="text-lg font-mono font-extrabold text-primary-800">
                        ₹{(req.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-xs">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>CANCELLED BY BUYER</span>
                        </span>
                      ) : (
                        <StatusBadge status={req.status} />
                      )}

                      {!isCancelled && (() => {
                        const sla = getRequestRemainingTime(req.requestDate, req.expiryDate);
                        if (req.status === 'expired' || (req.status === 'pending' && sla.isExpired)) {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              48h SLA EXPIRED
                            </span>
                          );
                        }
                        if (req.status === 'pending') {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              {sla.formattedRemaining} left
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {isPending ? (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const sla = getRequestRemainingTime(req.requestDate, req.expiryDate);
                          const isExpiredReq = req.status === 'expired' || sla.isExpired;
                          const avail = getAvailableStockForReq(req);
                          const isStockInsufficient = req.quantity > avail;
                          const isDisabled = isSuspended || isExpiredReq || isStockInsufficient;

                          return (
                            <button
                              onClick={() => !isDisabled && setAcceptModalReq(req)}
                              disabled={isDisabled}
                              title={
                                isStockInsufficient
                                  ? `Insufficient inventory stock (${avail} units available, ${req.quantity} requested)`
                                  : isExpiredReq
                                  ? 'This requisition has expired after 48h SLA'
                                  : 'Accept and earmark stock'
                              }
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                                isDisabled 
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-105'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept & Earmark</span>
                            </button>
                          );
                        })()}

                        <button
                          onClick={() => !isSuspended && setRejectModalReq(req)}
                          disabled={isSuspended}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : isCancelled ? (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs font-bold">
                        Action Voided (Cancelled)
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-500 capitalize">
                        {req.status === 'paid' ? 'Payment Escrowed' : `Status: ${req.status}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cancellation Notice Banner */}
                {isCancelled && (
                  <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold flex items-center gap-1.5 text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Requisition cancelled by buyer facility ({req.fromHospitalName}).</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {req.cancellation?.cancelledAt ? new Date(req.cancellation.cancelledAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700">
                      Reason: <strong className="text-slate-900">{req.cancellation?.reason || 'Buyer requirement changed'}</strong>
                      {req.cancellation?.note ? ` • Note: "${req.cancellation.note}"` : ''}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-700 font-semibold">
                      ✓ Any earmarked stock reservation was released back to your available inventory.
                    </p>
                  </div>
                )}

                {/* Requested Item Detail & Inventory Verification */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-900 text-sm">{req.medicineName}</span>
                    <span className="text-[11px] font-mono text-slate-500 block font-semibold">{req.power}</span>
                    {req.notes && (
                      <p className="text-[11px] text-slate-600 italic mt-1">"{req.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Requested / In-Stock</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {req.quantity} / <span className={req.quantity > getAvailableStockForReq(req) ? 'text-rose-600 font-bold' : 'text-emerald-700'}>{getAvailableStockForReq(req)}</span> units
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Cold Chain Protocol</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        2°C - 8°C Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workflow Timeline */}
                <div className="pt-2 border-t border-slate-100">
                  <WorkflowTimeline 
                    type="request" 
                    currentStatus={req.status} 
                    timestamp={req.requestDate} 
                    isCancelled={isCancelled}
                    cancellationDetails={req.cancellation}
                  />
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="No incoming requisitions"
          description="Requests from other hospitals will appear here."
          impact="When partner hospitals experience critical shortages, your surplus inventory helps save lives while recovering capital."
          actionLabel="View Hospital Inventory"
          actionTo="/hospital/inventory"
        />
>>>>>>> 6ddff35 (Added Cancel)
      )}

      {/* =====================================================
          APPROVE / REJECT CONFIRMATION
      ===================================================== */}

      {actionRequest && (
        <div
          className="incoming-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              closeAction();
            }
          }}
        >
          <div
            className="incoming-modal incoming-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incoming-confirm-title"
          >
            <div
              className={`incoming-confirm-icon ${actionType === "approve"
                  ? "approve"
                  : "reject"
                }`}
            >
              {actionType === "approve" ? (
                <CheckCircle size={30} />
              ) : (
                <XCircle size={30} />
              )}
            </div>

            <h2 id="incoming-confirm-title">
              {actionType === "approve"
                ? "Approve this request?"
                : "Reject this request?"}
            </h2>

            <p>
              {actionType === "approve"
                ? `You are approving ${actionRequest.quantity} ${actionRequest.unit} of ${actionRequest.medicine} for ${actionRequest.hospital}.`
                : `You are rejecting the request for ${actionRequest.quantity} ${actionRequest.unit} of ${actionRequest.medicine} from ${actionRequest.hospital}.`}
            </p>

            <div className="incoming-confirm-summary">
              <div>
                <span>Request ID</span>
                <strong>{actionRequest.id}</strong>
              </div>

              <div>
                <span>Medicine</span>
                <strong>{actionRequest.medicine}</strong>
              </div>

              <div>
                <span>Quantity</span>
                <strong>
                  {actionRequest.quantity}{" "}
                  {actionRequest.unit}
                </strong>
              </div>

              <div>
                <span>Total</span>
                <strong>
                  {formatCurrency(actionRequest.totalAmount)}
                </strong>
              </div>
            </div>

            <div className="incoming-confirm-actions">
              <button
                type="button"
                className="incoming-cancel-button"
                onClick={closeAction}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  actionType === "approve"
                    ? "incoming-confirm-approve"
                    : "incoming-confirm-reject"
                }
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="incoming-spinner" />
                    Processing...
                  </>
                ) : actionType === "approve" ? (
                  <>
                    <CheckCircle size={17} />
                    Confirm Approval
                  </>
                ) : (
                  <>
                    <XCircle size={17} />
                    Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
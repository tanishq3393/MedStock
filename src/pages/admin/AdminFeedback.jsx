import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MessageSquare, 
  Star, 
  CornerDownRight, 
  Filter, 
  Search, 
  Building2, 
  Send,
  CheckCircle2
} from 'lucide-react';
import { fetchAdminFeedbacks, replyAdminFeedback } from '../../store/slices/adminSlice';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminFeedback = () => {
  const dispatch = useDispatch();
  const { feedbacks, isLoading } = useSelector((state) => state.admin);

  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminFeedbacks(ratingFilter));
  }, [dispatch, ratingFilter]);

  const handleOpenReply = (fb) => {
    setReplyTarget(fb);
    setReplyText(fb.adminReply || '');
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyTarget || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await dispatch(replyAdminFeedback({ id: replyTarget.id, replyText }));
      setIsSubmitting(false);
      setReplyTarget(null);
      setReplyText('');
      toast.success(`Official response dispatched to ${replyTarget.hospitalName}`);
    } catch (err) {
      setIsSubmitting(false);
      toast.error('Failed to post reply');
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) =>
    fb.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.feedbackText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Hospital Feedback Moderation</h1>
          <p className="text-xs text-slate-500">
            Review hospital platform sentiment, resolve dispute tickets, and dispatch official executive replies.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search feedback by hospital or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter Rating:</span>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none"
          >
            <option value="all">All Ratings (1 - 5 Stars)</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star Critical)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && feedbacks.length === 0 ? (
          <LoadingSpinner text="Fetching hospital reviews..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Hospital Institution</th>
                  <th className="px-4 py-3.5 text-center">Star Rating</th>
                  <th className="px-4 py-3.5 text-left">Focus Category</th>
                  <th className="px-4 py-3.5 text-left">Hospital Review & Comments</th>
                  <th className="px-4 py-3.5 text-left">Date</th>
                  <th className="px-5 py-3.5 text-center">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFeedbacks.length > 0 ? (
                  filteredFeedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Building2 className="w-3.5 h-3.5 text-primary-600" />
                          <span>{fb.hospitalName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                fb.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {fb.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-sm">
                        <p className="text-slate-800 leading-relaxed font-normal">
                          "{fb.feedbackText}"
                        </p>
                        {fb.adminReply && (
                          <div className="mt-2 p-2 bg-secondary-50 rounded-lg border border-secondary-100 text-[11px] text-secondary-800">
                            <strong>Admin Reply:</strong> {fb.adminReply}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                        {fb.date}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleOpenReply(fb)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 font-bold text-xs transition-colors"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>{fb.adminReply ? 'Edit Reply' : 'Reply'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-1 opacity-40" />
                      <p className="font-semibold">No feedback records found matching filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyTarget && (
        <Modal
          isOpen={!!replyTarget}
          onClose={() => setReplyTarget(null)}
          title={`Reply to ${replyTarget.hospitalName}`}
          subtitle={`Focus Area: ${replyTarget.category} (Rated: ${replyTarget.rating}/5 Stars)`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSendReply} className="space-y-4 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 italic">
              "{replyTarget.feedbackText}"
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Platform Executive Response <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="4"
                required
                placeholder="Enter response addressing their feedback or detailing upcoming platform updates..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Response</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default AdminFeedback;

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
  CheckCircle2,
  Award,
  ShieldCheck
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
    (fb.category && fb.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-ocean-950 via-ocean-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(10,110,121,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Award className="w-3 h-3 text-teal-400" />
              Institutional CSAT Moderation
            </span>
            <span className="text-xs text-slate-400 font-mono">Executive Oversight</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Hospital Feedback & Dispute Moderation</h1>
          <p className="text-xs text-slate-300 max-w-xl font-normal">
            Review institutional participant sentiment, monitor transit temperature complaints, and dispatch official regulatory responses.
          </p>
        </div>

        <div className="relative z-10">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-right">
            <div className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Total Reviews</div>
            <div className="text-lg font-black text-white font-mono flex items-center justify-end gap-1.5">
              <span>{feedbacks.length} Submissions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search feedback by hospital, category, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter Rating:</span>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          <div className="py-16">
            <LoadingSpinner text="Fetching hospital reviews and sentiment logs..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 text-left">Hospital Institution</th>
                  <th className="px-4 py-3.5 text-center">Score</th>
                  <th className="px-4 py-3.5 text-left">Audit Category</th>
                  <th className="px-4 py-3.5 text-left">Institutional Commentary & Responses</th>
                  <th className="px-4 py-3.5 text-left">Date</th>
                  <th className="px-5 py-3.5 text-center">Executive Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFeedbacks.length > 0 ? (
                  filteredFeedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-teal-50/20 transition-colors group">
                      
                      {/* Hospital */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>{fb.hospitalName}</span>
                        </div>
                      </td>

                      {/* Stars */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-lg">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                fb.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] font-bold text-amber-700 ml-1 font-mono">{fb.rating}.0</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {fb.category || 'General SLA'}
                        </span>
                      </td>

                      {/* Commentary */}
                      <td className="px-4 py-4 max-w-md">
                        <p className="text-slate-800 leading-relaxed font-normal bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                          "{fb.feedbackText}"
                        </p>
                        {fb.adminReply && (
                          <div className="mt-2 p-2.5 bg-ocean-50 rounded-xl border border-teal-100 text-[11px] text-ocean-950 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-teal-800">
                              <CornerDownRight className="w-3 h-3 text-teal-600" />
                              <span>Dispatched Executive Response:</span>
                            </div>
                            <p className="pl-4 text-slate-600 leading-relaxed">{fb.adminReply}</p>
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {fb.date}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleOpenReply(fb)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 font-bold text-xs transition-all shadow-sm group/btn"
                        >
                          <CornerDownRight className="w-3.5 h-3.5 text-teal-600 group-hover/btn:text-white transition-colors" />
                          <span>{fb.adminReply ? 'Revise Reply' : 'Dispatch Reply'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-14 text-center text-slate-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-bold text-slate-700">No feedback entries found matching filters</p>
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
          title={`Executive Response to ${replyTarget.hospitalName}`}
          subtitle={`Audit Area: ${replyTarget.category} (Rating: ${replyTarget.rating}/5.0 Stars)`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSendReply} className="space-y-4 pt-1">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 italic">
              "{replyTarget.feedbackText}"
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Platform Executive Response <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="4"
                required
                placeholder="Detail resolution timeline, logistics SLA adjustments, or regulatory audit clarification..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
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

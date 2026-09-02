import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Star, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  CornerDownRight 
} from 'lucide-react';
import { submitHospitalFeedback, fetchHospitalFeedbacks } from '../../store/slices/hospitalSlice';
import toast from 'react-hot-toast';

export const HospitalFeedback = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { feedbacks, isLoading } = useSelector((state) => state.hospital);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('Logistics & Cold-Chain');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchHospitalFeedbacks(user?.id || 'hosp-1'));
  }, [dispatch, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error('Please enter your feedback comments');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(submitHospitalFeedback({
        hospitalId: user?.id || 'hosp-1',
        hospitalName: user?.name || 'Apollo Hospital',
        rating,
        category,
        feedbackText,
      }));
      setIsSubmitting(false);
      setFeedbackText('');
      toast.success('Thank you! Your feedback has been recorded for platform moderation.');
    } catch (err) {
      setIsSubmitting(false);
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">Hospital Feedback & Support</h1>
          <p className="text-xs text-slate-500">
            Share your institutional experience with peer hospital exchanges, logistics SLA, or cold-chain integrity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Feedback Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h3 className="text-sm font-bold text-slate-900">Submit New Review</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Star Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Service Experience Rating (1-5 Stars)
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-md text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Feedback Focus Area
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none bg-white font-medium"
              >
                <option value="Logistics & Cold-Chain">Logistics & Cold-Chain</option>
                <option value="Inventory Concession Calculator">Inventory Concession Calculator</option>
                <option value="Platform Verification & Security">Platform Verification & Security</option>
                <option value="Razorpay Settlement">Razorpay Settlement</option>
                <option value="General Service Quality">General Service Quality</option>
              </select>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Review Description & Suggestions <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="4"
                required
                placeholder="Share your thoughts on speed, packaging quality, partner hospital communication..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Hospital Review</span>
            </button>
          </form>
        </div>

        {/* Right Column: Historical Feedback Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Hospital Reviews & Admin Responses</h3>
            <span className="text-xs text-slate-400">Total {feedbacks.length} reviews</span>
          </div>

          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{fb.hospitalName}</span>
                      <span className="text-[10px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                        {fb.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{fb.date}</span>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          fb.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  "{fb.feedbackText}"
                </p>

                {/* Admin Reply */}
                {fb.adminReply && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-secondary-50 to-primary-50/40 border border-secondary-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-secondary-800 font-bold">
                      <CornerDownRight className="w-3.5 h-3.5 text-primary-600" />
                      <span>Admin Response ({fb.repliedDate}):</span>
                    </div>
                    <p className="text-slate-600 text-[11px] pl-5">
                      {fb.adminReply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default HospitalFeedback;

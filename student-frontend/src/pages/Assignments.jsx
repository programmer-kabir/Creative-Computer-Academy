import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiCheckSquare, FiCalendar, FiUploadCloud, FiLink,
  FiCheckCircle, FiClock, FiAlertCircle, FiX, FiExternalLink
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Assignments = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/student/assignments.php?user_id=${currentUser.id}`);
      if (res.data.status === 'success') {
        setAssignments(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentUser]);

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionLink) {
      toast.error('Please provide your project link (Google Drive, GitHub, Figma, etc.).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE}api/student/assignments.php`, {
        assignment_id: activeAssignment.id,
        user_id: currentUser.id,
        submission_link: submissionLink,
        notes: submissionNotes
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Assignment submitted successfully!');
        setActiveAssignment(null);
        setSubmissionLink('');
        setSubmissionNotes('');
        fetchAssignments();
      } else {
        toast.error(res.data.message || 'Failed to submit assignment.');
      }
    } catch (err) {
      toast.error('Error submitting assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/40 text-purple-600 rounded-2xl">
            <FiCheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Assignments & Projects</h1>
            <p className="text-sm text-slate-400">Complete and submit your practical coursework for instructor evaluation.</p>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold">Loading Assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center">
          <FiCheckSquare size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Assignments Posted Yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Your course instructor will post assignments and practical tasks here soon. Keep practicing!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((item) => {
            const isSubmitted = !!item.submission_id;

            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                      {item.course_name}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      isSubmitted
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {isSubmitted ? 'Submitted' : 'Pending Submission'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">{item.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <FiCalendar size={14} /> Due: {item.due_date?.slice(0, 10)}
                    </span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">Marks: {item.total_marks || 100}</span>
                  </div>

                  {isSubmitted ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                        <FiCheckCircle size={14} /> Submitted ({item.submitted_at?.slice(0, 10)})
                      </span>
                      {item.submission_link && (
                        <a href={item.submission_link} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline flex items-center gap-1">
                          <span>Link</span>
                          <FiExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveAssignment(item);
                        setSubmissionLink('');
                        setSubmissionNotes('');
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FiUploadCloud size={16} />
                      <span>Submit Assignment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Submit: {activeAssignment.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Paste your Google Drive, Figma, GitHub, or live URL</p>
              </div>
              <button onClick={() => setActiveAssignment(null)} className="p-1 text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Project / Deliverable URL *</label>
                <div className="relative">
                  <FiLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/... or https://github.com/..."
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Submission Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Any details or remarks for your instructor..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveAssignment(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;

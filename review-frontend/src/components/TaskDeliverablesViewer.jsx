import React, { useState } from 'react';
import { 
  FiDownload, FiExternalLink, FiPaperclip, FiImage, 
  FiEye, FiPlay, FiFileText, FiLink, FiPackage, FiMaximize2,
  FiClock, FiZap, FiAlertTriangle
} from 'react-icons/fi';
import { downloadFile } from '../utils/fileDownloader';

export default function TaskDeliverablesViewer({ 
  submissions = [], 
  submissionLink = '', 
  onImageClick,
  totalTimeSpent = null,
  submittedAt = null
}) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return '0s';
    const s = parseInt(totalSecs, 10);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getFileBadge = (ext = '') => {
    const extLower = ext.toLowerCase();
    if (extLower === 'psd') return { label: 'PSD', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    if (extLower === 'eps') return { label: 'EPS', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (extLower === 'ai') return { label: 'AI', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
    if (['zip', 'rar', '7z'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (['mp4', 'mov', 'webm'].includes(extLower)) return { label: 'VIDEO', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    if (extLower === 'pdf') return { label: 'PDF', bg: 'bg-red-500/20 text-red-300 border-red-500/40' };
    return { label: extLower.toUpperCase() || 'FILE', bg: 'bg-white/10 text-white/70 border-white/20' };
  };

  const previewFiles = (submissions || []).filter(s => 
    s.file_type === 'preview' || ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes((s.file_ext || '').toLowerCase())
  );

  const videoFiles = (submissions || []).filter(s => 
    s.file_type === 'video' || ['mp4', 'mov', 'webm'].includes((s.file_ext || '').toLowerCase())
  );

  const sourceFiles = (submissions || []).filter(s => 
    !previewFiles.includes(s) && !videoFiles.includes(s)
  );

  const hasDeliverables = (submissions && submissions.length > 0) || Boolean(submissionLink);

  const isInstantSubmit = totalTimeSpent !== null && totalTimeSpent !== undefined && Number(totalTimeSpent) > 0 && Number(totalTimeSpent) < 120;

  if (!hasDeliverables) {
    return (
      <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl">
        <FiPackage className="mx-auto text-white/20 mb-2" size={32} />
        <p className="text-sm font-semibold text-white/50">No deliverables uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Working Duration & Submission Timing Ribbon ── */}
      {totalTimeSpent !== null && totalTimeSpent !== undefined && Number(totalTimeSpent) > 0 && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${
          isInstantSubmit 
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-950/20' 
            : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${isInstantSubmit ? 'bg-amber-500/30 text-amber-300' : 'bg-blue-500/30 text-blue-300'}`}>
              {isInstantSubmit ? <FiZap size={20} className="animate-bounce" /> : <FiClock size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider">
                  {isInstantSubmit ? '⚡ Instant / Fast Submission' : '⏱️ Staff Working Duration'}
                </p>
                {isInstantSubmit && (
                  <span className="text-[10px] bg-amber-500/30 border border-amber-500/50 px-2 py-0.5 rounded font-black text-amber-200 uppercase animate-pulse">
                    Under 2 Minutes
                  </span>
                )}
              </div>
              <p className="text-xs font-mono font-semibold opacity-90 mt-0.5">
                Staff worked for: <span className="font-bold text-white text-sm">{formatDuration(totalTimeSpent)}</span> before submitting to review
              </p>
            </div>
          </div>

          {submittedAt && (
            <span className="text-[11px] text-white/50 font-mono">
              Submitted: {new Date(submittedAt.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* 1. Visual Previews (Images) */}
      {previewFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiImage size={15} /> Visual Previews & Output ({previewFiles.length})
            </p>
            <span className="text-[11px] text-white/40">Click preview to enlarge</span>
          </div>

          <div className={`grid gap-4 ${previewFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {previewFiles.map((file, idx) => (
              <div 
                key={idx}
                className="group relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-xl cursor-pointer transition-all hover:border-emerald-500/50"
                onClick={() => onImageClick ? onImageClick(file.file_url) : window.open(file.file_url, '_blank')}
              >
                <div className="w-full flex items-center justify-center bg-black/30 p-2 min-h-[260px] max-h-[460px] overflow-hidden">
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="w-full h-auto max-h-[440px] object-contain rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Overlay Header / Footer */}
                <div className="p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex items-center justify-between border-t border-white/10">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-semibold text-white truncate" title={file.file_name}>
                      {file.file_name}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      {formatFileSize(file.file_size)} • Preview Ready
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.file_url, '_blank');
                      }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Open Image in New Tab"
                    >
                      <FiExternalLink size={13} />
                      <span>New Tab</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onImageClick) onImageClick(file.file_url);
                        else window.open(file.file_url, '_blank');
                      }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Enlarge Image Modal"
                    >
                      <FiMaximize2 size={13} />
                      <span>Zoom</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file.file_url, file.file_name);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white transition-colors"
                      title="Download Image"
                    >
                      <FiDownload size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Video Previews */}
      {videoFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiPlay size={15} /> Video Output ({videoFiles.length})
          </p>
          <div className="space-y-3">
            {videoFiles.map((file, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-white/15 bg-black/60 p-3 shadow-xl">
                <video
                  src={file.file_url}
                  controls
                  className="w-full max-h-[420px] rounded-xl bg-black"
                  preload="metadata"
                />
                <div className="flex items-center justify-between mt-3 px-1 text-xs text-white/80">
                  <span className="font-semibold truncate">{file.file_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/50">{formatFileSize(file.file_size)}</span>
                    <button
                      type="button"
                      onClick={() => downloadFile(file.file_url, file.file_name)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <FiDownload size={12} /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Source / Vector Deliverables (PSD, EPS, AI, ZIP, etc.) */}
      {sourceFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiPackage size={15} /> Source & Vector Files ({sourceFiles.length})
            </p>
            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
              Cloudflare R2 Direct
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sourceFiles.map((file, idx) => {
              const badge = getFileBadge(file.file_ext);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/25 transition-all gap-3 shadow-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`px-2.5 py-1.5 text-xs font-black uppercase rounded-xl border shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        {formatFileSize(file.file_size)} • Source Asset
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadFile(file.file_url, file.file_name)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
                    title="Download File"
                  >
                    <FiDownload size={14} />
                    <span>Download</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. External Submission Link Fallback */}
      {submissionLink && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl flex items-center gap-3 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <FiLink className="text-emerald-400 shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">External Folder / Proof Link</p>
            <a
              href={submissionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-emerald-400 text-xs hover:underline truncate block mt-0.5 font-medium"
            >
              {submissionLink}
            </a>
          </div>
          <a
            href={submissionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-emerald-400 hover:text-white rounded-xl hover:bg-emerald-500/20 transition-colors shrink-0"
          >
            <FiExternalLink size={15} />
          </a>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { 
  FiDownload, FiExternalLink, FiPaperclip, FiImage, 
  FiEye, FiPlay, FiFileText, FiLink, FiPackage, FiMaximize2 
} from 'react-icons/fi';
import { downloadFile } from '../utils/fileDownloader';

export default function TaskDeliverablesViewer({ submissions = [], submissionLink = '', onImageClick }) {
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileBadge = (ext = '') => {
    const extLower = ext.toLowerCase();
    if (extLower === 'psd') return { label: 'PSD', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    if (extLower === 'eps') return { label: 'EPS', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    if (extLower === 'ai') return { label: 'AI', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    if (['zip', 'rar', '7z'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    if (['mp4', 'mov', 'webm'].includes(extLower)) return { label: 'VIDEO', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    if (extLower === 'pdf') return { label: 'PDF', bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    return { label: extLower.toUpperCase() || 'FILE', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
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

  if (!hasDeliverables) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl">
        <FiPackage className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No deliverables uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Visual Previews (Images) */}
      {previewFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiImage size={15} /> Visual Previews & Output ({previewFiles.length})
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Click to enlarge</span>
          </div>

          <div className={`grid gap-4 ${previewFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {previewFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 shadow-md cursor-pointer transition-all hover:border-emerald-500/50"
                onClick={() => onImageClick ? onImageClick(file.file_url) : window.open(file.file_url, '_blank')}
              >
                <div className="w-full flex items-center justify-center p-2 min-h-[240px] max-h-[440px] overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="w-full h-auto max-h-[420px] object-contain rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Info Bar */}
                <div className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.file_name}>
                      {file.file_name}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
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
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Open in New Tab"
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
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Enlarge Image"
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
                      className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 transition-colors"
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
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiPlay size={15} /> Video Output ({videoFiles.length})
          </p>
          <div className="space-y-3">
            {videoFiles.map((file, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black p-3 shadow-md">
                <video
                  src={file.file_url}
                  controls
                  className="w-full max-h-[400px] rounded-xl bg-black"
                  preload="metadata"
                />
                <div className="flex items-center justify-between mt-3 px-1 text-xs text-white">
                  <span className="font-semibold truncate">{file.file_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60">{formatFileSize(file.file_size)}</span>
                    <button
                      type="button"
                      onClick={() => downloadFile(file.file_url, file.file_name)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
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
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiPackage size={15} /> Source & Vector Files ({sourceFiles.length})
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Cloudflare R2 Direct
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sourceFiles.map((file, idx) => {
              const badge = getFileBadge(file.file_ext);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`px-2.5 py-1.5 text-xs font-black uppercase rounded-xl border shrink-0 ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatFileSize(file.file_size)} • Source Asset
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadFile(file.file_url, file.file_name)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
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
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-center gap-3">
          <FiLink className="text-emerald-600 dark:text-emerald-400 shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-emerald-800 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider">External Folder / Proof Link</p>
            <a
              href={submissionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate block mt-0.5 font-medium"
            >
              {submissionLink}
            </a>
          </div>
          <a
            href={submissionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors shrink-0"
          >
            <FiExternalLink size={15} />
          </a>
        </div>
      )}
    </div>
  );
}

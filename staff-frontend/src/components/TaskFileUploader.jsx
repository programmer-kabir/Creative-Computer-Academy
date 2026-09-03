import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  FiUploadCloud, FiFile, FiImage, FiVideo, FiX, FiCheck, 
  FiAlertCircle, FiLoader, FiExternalLink, FiPaperclip 
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost/CreateiveComputerAcademy/server/';

export default function TaskFileUploader({ files = [], setFiles, taskId = 0, userId = 0, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileBadge = (ext = '', fileType = '') => {
    const extLower = ext.toLowerCase();
    if (extLower === 'psd') return { label: 'PSD', bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    if (extLower === 'eps') return { label: 'EPS', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    if (extLower === 'ai') return { label: 'AI', bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
    if (['zip', 'rar', '7z'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extLower)) return { label: extLower.toUpperCase(), bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    if (['mp4', 'mov', 'webm'].includes(extLower)) return { label: 'VIDEO', bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
    if (extLower === 'pdf') return { label: 'PDF', bg: 'bg-red-500/10 text-red-600 border-red-500/20' };
    return { label: extLower.toUpperCase() || 'FILE', bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  };

  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('task_id', taskId);
    formData.append('user_id', userId);

    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files[]', selectedFiles[i]);
    }

    try {
      const uploadUrl = `${API_BASE}api/tasks/upload_task_files.php`;
      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 90) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });

      if (response.data?.status === 'success' && Array.isArray(response.data.files)) {
        setUploadProgress(100);
        const mergedFiles = response.data.files.map((f, idx) => {
          const matchingLocal = Array.from(selectedFiles).find(sf => sf.name === f.name) || selectedFiles[idx] || null;
          return { ...f, file: matchingLocal };
        });
        setFiles(prev => [...prev, ...mergedFiles]);
        toast.success(`${response.data.files.length} file(s) uploaded to Cloudflare R2!`);
      } else {
        toast.error(response.data?.message || 'File upload failed');
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error(err.response?.data?.message || 'Server error while uploading to Cloudflare R2');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    if (e.dataTransfer?.files?.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="w-full space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 scale-[0.99]' 
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/50'
        } ${disabled || uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".psd,.eps,.ai,.svg,.zip,.rar,.7z,.jpg,.jpeg,.png,.webp,.pdf,.mp4,.mov"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shadow-inner">
              <FiLoader className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FiUploadCloud className="w-6 h-6" />
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {uploading ? 'Uploading to Cloudflare R2...' : 'Click to upload or drag & drop files here'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports <span className="font-semibold text-blue-600 dark:text-blue-400">PSD, EPS, AI, ZIP, JPG, PNG, MP4, PDF</span>
            </p>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="w-full max-w-xs mt-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-blue-600 font-medium mt-1 inline-block">
                {uploadProgress}% Uploaded
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
            <span>Attached Submission Files ({files.length})</span>
            <span>Cloudflare R2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file, idx) => {
              const badge = getFileBadge(file.ext, file.file_type);
              const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes((file.ext || '').toLowerCase());

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isImage ? (
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                      />
                    ) : (
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg border shrink-0 ${badge.bg}`}>
                        {badge.label}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatFileSize(file.size)} • <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="View / Download"
                    >
                      <FiExternalLink size={13} />
                    </a>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Remove file"
                      >
                        <FiX size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import axios from 'axios';

import { FiClock, FiLink, FiPlus, FiX, FiEdit2, FiChevronDown, FiCalendar, FiTarget, FiImage, FiTrash, FiFlag, FiList, FiType, FiTag, FiUsers } from 'react-icons/fi';
import { CategorySelect } from './CategorySelect';
import { StaffSelect } from './StaffSelect';
import JoditEditor from 'jodit-react';

export const TaskFormFields = ({ formData, setFormData, editorRef, staff, workloads, joditConfig, apiBase, departments }) => (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">

        {/* ── Left column: all small fields ── */}
        <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-5">

            {/* Title */}
            <div className="group">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                    <FiType size={12} /> Task Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text" required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-semibold text-slate-800 dark:text-slate-100 text-sm placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="e.g. Design Homepage UI"
                />
            </div>

            {/* Category */}
            <div className="group">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                    <FiTag size={12} /> Category <span className="text-red-500">*</span>
                </label>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                    <CategorySelect
                        value={formData.category}
                        onChange={val => setFormData({ ...formData, category: val })}
                        departments={departments}
                    />
                </div>
            </div>

            {/* Priority */}
            <div className="group">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                    <FiFlag size={12} /> Priority
                </label>
                <div className="relative">
                    <select
                        value={formData.priority || 'Medium'}
                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-11 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-semibold text-slate-800 dark:text-slate-100 appearance-none text-sm cursor-pointer hover:border-blue-300"
                    >
                        <option value="Low">🟢 Low Priority</option>
                        <option value="Medium">⚡ Medium Priority</option>
                        <option value="High">🔥 High Priority</option>
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <FiFlag size={14} />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <FiChevronDown size={16} />
                    </div>
                </div>
            </div>

            {/* Assign To */}
            <div className="group">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                    <FiUsers size={12} /> Assign To <span className="text-red-500">*</span>
                </label>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                    <StaffSelect
                        value={formData.assigned_to}
                        onChange={val => setFormData({ ...formData, assigned_to: val })}
                        staff={staff}
                        apiBase={apiBase || ''}
                        workloads={workloads}
                    />
                </div>
            </div>

            {/* Google Drive Submission Link */}
            <div className="group">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                    <FiLink size={12} /> Google Drive Submission Folder Link (Optional)
                </label>
                <input
                    type="url"
                    value={formData.submission_link || ''}
                    onChange={e => setFormData({ ...formData, submission_link: e.target.value })}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-semibold text-slate-800 dark:text-slate-100 text-sm placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="https://drive.google.com/drive/folders/..."
                />
            </div>

            {/* Dates Section */}
            <div className="grid grid-cols-2 gap-4">
                {/* Assign Date */}
                <div className="group">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                        <FiCalendar size={12} /> Assign Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date" required
                        value={formData.assign_date || ''}
                        onChange={e => setFormData({ ...formData, assign_date: e.target.value })}
                        className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-semibold text-slate-800 dark:text-slate-100 text-sm"
                    />
                </div>

                {/* Deadline Date */}
                <div className="group">
                    <label className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-amber-600 transition-colors">
                        <span className="flex items-center gap-1.5"><FiClock size={12} /> Deadline</span>
                        {formData.deadline && (
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, deadline: '', deadline_time: '' })}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors"
                                title="Clear Deadline"
                            >
                                <FiX size={12} />
                            </button>
                        )}
                    </label>
                    <input
                        type="date"
                        value={formData.deadline || ''}
                        min={formData.assign_date || ''}
                        onChange={e => setFormData({ ...formData, deadline: e.target.value, deadline_time: e.target.value ? formData.deadline_time : '' })}
                        className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-semibold text-slate-800 dark:text-slate-100 text-sm"
                    />
                </div>

                {/* Deadline Time (Only shows if Deadline Date is set) */}
                {formData.deadline && (
                    <div className="group col-span-2 animate-in slide-in-from-top-2 fade-in duration-200">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-amber-600 transition-colors">
                            <FiClock size={12} /> Specific Time (Optional)
                        </label>
                        <input
                            type="time"
                            value={formData.deadline_time || ''}
                            onChange={e => setFormData({ ...formData, deadline_time: e.target.value })}
                            className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-semibold text-slate-800 dark:text-slate-100 text-sm"
                        />
                    </div>
                )}
            </div>

            {/* Reference Links */}
            <div className="flex-shrink-0 group">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                    <FiLink size={12} /> Reference Links
                </label>
                <div className="space-y-2">
                    {(Array.isArray(formData.ref_links) ? formData.ref_links : [formData.ref_links || '']).map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 group/link">
                            <input
                                type="url"
                                value={link}
                                onChange={e => {
                                    const updated = [...(Array.isArray(formData.ref_links) ? formData.ref_links : [formData.ref_links || ''])];
                                    updated[idx] = e.target.value;
                                    setFormData({ ...formData, ref_links: updated });
                                }}
                                className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-300"
                                placeholder={`https://... (link ${idx + 1})`}
                            />
                            {(Array.isArray(formData.ref_links) ? formData.ref_links : ['']).length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const updated = (Array.isArray(formData.ref_links) ? formData.ref_links : ['']).filter((_, i) => i !== idx);
                                        setFormData({ ...formData, ref_links: updated });
                                    }}
                                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => {
                        const current = Array.isArray(formData.ref_links) ? formData.ref_links : [formData.ref_links || ''];
                        setFormData({ ...formData, ref_links: [...current, ''] });
                    }}
                    className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                >
                    <FiPlus size={14} /> Add More Link
                </button>
            </div>

            {/* Sub-tasks / Checklists */}
            <div className="flex-shrink-0">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sub-Tasks / Checklist</label>
                <div className="space-y-2">
                    {(Array.isArray(formData.checklists) ? formData.checklists : []).map((cl, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={cl.title}
                                onChange={e => {
                                    const updated = [...(Array.isArray(formData.checklists) ? formData.checklists : [])];
                                    updated[idx] = { ...updated[idx], title: e.target.value };
                                    setFormData({ ...formData, checklists: updated });
                                }}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 dark:text-slate-100 text-sm"
                                placeholder={`Sub-task ${idx + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const updated = (Array.isArray(formData.checklists) ? formData.checklists : []).filter((_, i) => i !== idx);
                                    setFormData({ ...formData, checklists: updated });
                                }}
                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                            >
                                <FiX size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => {
                        const current = Array.isArray(formData.checklists) ? formData.checklists : [];
                        setFormData({ ...formData, checklists: [...current, { title: '', is_completed: false }] });
                    }}
                    className="mt-2 flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <FiList size={14} /> Add Sub-task
                </button>
            </div>

            {/* Reference Images */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Reference Images</label>

                {/* Preview grid */}
                {(() => {
                    let imgs = [];
                    if (formData.ref_image) {
                        try {
                            imgs = Array.isArray(formData.ref_image) ? formData.ref_image : JSON.parse(formData.ref_image);
                        } catch {
                            imgs = formData.ref_image ? [formData.ref_image] : [];
                        }
                    }
                    if (!Array.isArray(imgs)) imgs = [];
                    if (imgs.length === 0) return null;

                    return (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {imgs.map((imgUrl, idx) => (
                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-50 dark:bg-slate-800">
                                    <img src={`${apiBase}${imgUrl}`} alt="Ref" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = imgs.filter((_, i) => i !== idx);
                                            setFormData({ ...formData, ref_image: updated });
                                        }}
                                        className="absolute inset-0 bg-rose-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FiTrash size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                })()}

                {/* Upload Trigger Button */}
                <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 rounded-xl cursor-pointer transition-all">
                    <FiImage size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload Reference Image</span>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return;

                            // Call API to upload
                            const filesArray = Array.from(e.target.files);
                            const uploadFormData = new FormData();
                            filesArray.forEach(file => {
                                uploadFormData.append('files[]', file);
                            });

                            try {
                                const res = await axios.post(`${apiBase}api/admin/tasks/task_image_upload.php`, uploadFormData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                if (res.data && res.data.files) {
                                    // Get current ref images
                                    let currentImgs = [];
                                    if (formData.ref_image) {
                                        try {
                                            currentImgs = Array.isArray(formData.ref_image) ? formData.ref_image : JSON.parse(formData.ref_image);
                                        } catch {
                                            currentImgs = formData.ref_image ? [formData.ref_image] : [];
                                        }
                                    }
                                    if (!Array.isArray(currentImgs)) currentImgs = [];

                                    setFormData({
                                        ...formData,
                                        ref_image: [...currentImgs, ...res.data.files]
                                    });
                                } else if (res.data && res.data.error) {
                                    alert(res.data.error);
                                }
                            } catch (err) {
                                console.error(err);
                                alert("Failed to upload reference images.");
                            }
                        }}
                    />
                </label>
            </div>

            {/* Visual Image Section */}
            <div className="mt-4 bg-primary-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-primary-100 dark:border-emerald-800/30">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-primary-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                    <FiTarget size={12} /> Target Visual Image (Make Exact Copy)
                </label>

                {/* Preview grid for Visual Image */}
                {(() => {
                    let imgs = [];
                    if (formData.visual_image) {
                        try {
                            imgs = Array.isArray(formData.visual_image) ? formData.visual_image : JSON.parse(formData.visual_image);
                        } catch {
                            imgs = formData.visual_image ? [formData.visual_image] : [];
                        }
                    }
                    if (!Array.isArray(imgs)) imgs = [];
                    if (imgs.length > 0) {
                        return (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {imgs.map((imgUrl, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary-300 dark:border-emerald-700/50 group bg-white dark:bg-slate-900 shadow-sm">
                                        <img src={`${apiBase}${imgUrl}`} alt="Visual" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = imgs.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, visual_image: updated });
                                            }}
                                            className="absolute inset-0 bg-rose-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <FiTrash size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Upload Trigger Button */}
                <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-dashed border-primary-300 dark:border-emerald-700/50 hover:border-primary-500 dark:hover:border-emerald-500 hover:bg-primary-50 dark:hover:bg-emerald-900/20 rounded-xl cursor-pointer transition-all shadow-sm">
                    <FiImage size={16} className="text-primary-400 dark:text-emerald-500" />
                    <span className="text-xs font-bold text-primary-700 dark:text-emerald-400">Upload Target Visual</span>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return;
                            const filesArray = Array.from(e.target.files);
                            const uploadFormData = new FormData();
                            filesArray.forEach(file => uploadFormData.append('files[]', file));

                            try {
                                const res = await axios.post(`${apiBase}api/admin/tasks/task_image_upload.php`, uploadFormData, {
                                    headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                if (res.data && res.data.files) {
                                    let currentImgs = [];
                                    if (formData.visual_image) {
                                        try {
                                            currentImgs = Array.isArray(formData.visual_image) ? formData.visual_image : JSON.parse(formData.visual_image);
                                        } catch {
                                            currentImgs = formData.visual_image ? [formData.visual_image] : [];
                                        }
                                    }
                                    if (!Array.isArray(currentImgs)) currentImgs = [];
                                    setFormData({ ...formData, visual_image: [...currentImgs, ...res.data.files] });
                                } else if (res.data && res.data.error) {
                                    alert(res.data.error);
                                }
                            } catch (err) {
                                console.error(err);
                                alert("Failed to upload visual image.");
                            }
                        }}
                    />
                </label>
            </div>

        </div>

        {/* ── Right column: full-height editor ── */}
        <div className="flex-1 flex flex-col group">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                <FiEdit2 size={12} /> Task Description / Instructions
            </label>
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all flex flex-col [&_.jodit-react-container]:!flex-1 [&_.jodit-react-container]:!flex [&_.jodit-react-container]:!flex-col [&_.jodit-container]:!h-full [&_.jodit-container]:!flex-1 [&_.jodit-container]:!flex [&_.jodit-container]:!flex-col [&_.jodit-workplace]:!flex-1 [&_.jodit-workplace]:!overflow-y-auto [&_.jodit-container]:!border-0">
                <JoditEditor
                    ref={editorRef}
                    value={formData.description}
                    config={joditConfig}
                    tabIndex={1}
                    onBlur={newContent => setFormData({ ...formData, description: newContent })}
                />
            </div>
        </div>

    </div>
);
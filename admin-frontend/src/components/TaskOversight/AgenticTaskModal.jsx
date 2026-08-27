import React, { useState } from 'react';
import {
  FiX,
  FiUploadCloud,
  FiCpu,
  FiEdit3,
  FiCode,
  FiLink,
  FiLayers,
  FiCopy,
  FiCheck,
  FiFolder,
  FiType,
  FiImage,
  FiZap,
  FiFileText,
  FiBox,
  FiSliders,
  FiGrid,
  FiExternalLink,
  FiSmile,
  FiTarget,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';
import { toast } from 'sonner';
import axios from 'axios';
import { createPortal } from 'react-dom';

export const AgenticTaskModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  staff,
  workloads,
  departments,
  apiBase,
  onSubmit,
  actionLoading,
  onSwitchToManual
}) => {
  if (!isOpen) return null;

  // Active Tab: 'json_spec' | 'assets_links' | 'layer_tree'
  const [activeTab, setActiveTab] = useState('json_spec');
  const [previewImage, setPreviewImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [copiedColor, setCopiedColor] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Initial blueprint data: null by default unless already existing on formData
  const [blueprint, setBlueprint] = useState(formData.blueprint_data || null);
  const [visualPreview, setVisualPreview] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));

      // Convert to Base64 for Vision AI
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload file to server so it is stored as ref_image ONLY
      const uploadFormData = new FormData();
      uploadFormData.append('files[]', file);
      try {
        const res = await axios.post(`${apiBase}api/admin/tasks/task_image_upload.php`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.files && res.data.files.length > 0) {
          setFormData(prev => ({
            ...prev,
            ref_image: res.data.files
          }));
        }
      } catch (err) {
        console.error('Failed to upload reference image to server:', err);
      }
    }
  };

  const handleVisualImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setVisualPreview(URL.createObjectURL(file));
      const uploadFormData = new FormData();
      uploadFormData.append('files[]', file);
      try {
        const res = await axios.post(`${apiBase}api/admin/tasks/task_image_upload.php`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.files && res.data.files.length > 0) {
          setFormData(prev => ({
            ...prev,
            visual_image: res.data.files
          }));
        }
      } catch (err) {
        console.error('Failed to upload visual image to server:', err);
      }
    }
  };

  const handleRemoveVisualImage = () => {
    setVisualPreview(null);
    setFormData(prev => ({
      ...prev,
      visual_image: []
    }));
  };

  const handleCopyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`Copied ${hex} to clipboard!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleArchitectBlueprint = async (overrideInstructions = null) => {
    setIsArchitecting(true);
    try {
      const promptText = (typeof overrideInstructions === 'string' && overrideInstructions.trim()) 
        ? overrideInstructions 
        : (customInstructions || 'Extract full design specifications, color palette, typography and PSD layer tree for this flyer/design.');
      
      const res = await axios.post(`${apiBase}api/tasks/architect_blueprint.php`, {
        instructions: promptText,
        image_base64: imageBase64
      });

      if (res.data.status === 'success' && res.data.blueprint) {
        const generatedBlueprint = res.data.blueprint;
        setBlueprint(generatedBlueprint);
        toast.success('AI Blueprint Generated Successfully!');

        // Directly set the professional AI generated title in the title box
        const professionalTitle = generatedBlueprint.task_title || generatedBlueprint.title || `${generatedBlueprint.doc_format || 'Design'} PSD Template`;
        setFormData(prev => ({
          ...prev,
          blueprint_data: generatedBlueprint,
          title: professionalTitle,
          category: prev.category || 'Graphic Design'
        }));
      } else {
        toast.error(res.data.message || 'Failed to generate blueprint from AI');
      }
    } catch (err) {
      console.error('Architect AI Error:', err);
      toast.error('AI Blueprint জেনারেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsArchitecting(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const updatedFormData = {
      ...formData,
      blueprint_data: blueprint
    };
    onSubmit(e, updatedFormData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-[1540px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-transparent dark:border-slate-800">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center bg-slate-50 dark:bg-[#0e172a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <FiCpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide text-slate-900 dark:text-white">
                  AI Blueprint Architect <span className="text-blue-600 dark:text-blue-500 font-mono text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">AGENTIC MODE</span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Generate design specifications, color palettes, typography and PSD layer trees from visual references.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Switch to Manual button */}
            <button
              type="button"
              onClick={onSwitchToManual}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <FiEdit3 size={13} /> Switch to Manual Mode
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Task Meta Inputs */}
        <div className="px-6 py-3 bg-slate-100/60 dark:bg-[#0a0f1d] border-b border-slate-200 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-shrink-0">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Task Title *</label>
            <input
              type="text"
              placeholder="e.g. Modern Business Flyer Design"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-white dark:bg-[#131d31] border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 shadow-sm"
              required
            />
          </div>
        </div>

        {/* Studio Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ── LEFT PANEL: Visual Input & Generator (4 Cols) ── */}
          <div className="lg:col-span-4 p-5 border-r border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0d1527] overflow-y-auto space-y-5 flex flex-col">
            {/* Input Dropzone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiImage className="text-blue-500 dark:text-blue-400" /> Input Flyer / Design Preview
                </h4>
              </div>

              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-[#111c33] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[160px] relative overflow-hidden group shadow-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {previewImage ? (
                  <div className="w-full h-44 relative rounded-xl overflow-hidden">
                    <img src={previewImage} alt="Input" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                      Click to Change Image
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                      <FiUploadCloud size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload 2D Flyer / Brochure Preview</p>
                    <p className="text-[10px] text-slate-500 font-semibold">JPG, PNG, WebP up to 10MB</p>
                  </div>
                )}
              </label>
            </div>

            {/* Optional Target Visual Image (Exact Replica) */}
            <div className="p-3 bg-white dark:bg-[#111c33]/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiTarget className="text-emerald-500 dark:text-emerald-400" size={13} /> Target Visual Image (Optional)
                </span>
                {visualPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveVisualImage}
                    className="text-[10px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-bold flex items-center gap-1"
                  >
                    <FiTrash2 size={11} /> Remove
                  </button>
                )}
              </div>

              {visualPreview ? (
                <div className="relative h-28 rounded-xl overflow-hidden border border-emerald-500/30">
                  <img src={visualPreview} alt="Visual Target" className="w-full h-full object-contain bg-slate-100 dark:bg-black/40" />
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl cursor-pointer transition-all text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  <FiPlus size={13} className="text-emerald-500 dark:text-emerald-400" />
                  <span>Attach Visual Image (Optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVisualImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Blueprint Instructions Prompt */}
            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Design & Blueprint Instructions
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Extract CMYK colors, generate Plus Jakarta Sans typography, build 5-folder PSD layer tree for Freepik print standard..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full bg-white dark:bg-[#111c33] border border-slate-300 dark:border-slate-700/80 rounded-2xl p-3 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 resize-none flex-1 shadow-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleArchitectBlueprint()}
                disabled={isArchitecting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isArchitecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Architecting PSD Blueprint...</span>
                  </>
                ) : (
                  <>
                    <FiCpu size={16} />
                    <span>Architect PSD Blueprint</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const newInst = (customInstructions ? customInstructions + ' • ' : '') + 'Make a better creative, restructured and modern variant with distinct layout structure and catchy professional title.';
                  setCustomInstructions(newInst);
                  handleArchitectBlueprint(newInst);
                }}
                disabled={isArchitecting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiZap size={14} /> Make Better Variant (Restructure)
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL: Tabbed Studio (8 Cols) ── */}
          <div className="lg:col-span-8 p-6 bg-white dark:bg-[#0b1120] overflow-y-auto space-y-6 flex flex-col">
            {!blueprint ? (
              /* EMPTY STATE WHEN NO BLUEPRINT HAS BEEN GENERATED YET */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-[#0e172a]/40 min-h-[420px] space-y-5 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <FiGrid size={36} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-md">
                    <FiCpu size={12} />
                  </span>
                </div>

                <div className="max-w-md space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">No Design Blueprint Generated Yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Upload a 2D Flyer/Banner preview on the left or enter instructions, then click <strong className="text-blue-600 dark:text-blue-400">"Architect PSD Blueprint"</strong> to auto-extract structured specifications, typography, color palette, and PSD layer trees.
                  </p>
                </div>
              </div>
            ) : (
              /* ACTIVE BLUEPRINT TABS */
              <>
                {/* Tab Selector & Export Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#111c33] p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('json_spec')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'json_spec'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <FiCode size={14} /> JSON Spec
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('assets_links')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'assets_links'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <FiLink size={14} /> Assets & Links
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('layer_tree')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'layer_tree'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                      <FiLayers size={14} /> PSD Layer Tree
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
                        toast.success('Blueprint JSON copied to clipboard!');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <FiCopy size={12} /> Export JSON
                    </button>
                  </div>
                </div>

                {/* ── TAB 1: JSON SPEC ── */}
                {activeTab === 'json_spec' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Format & Dimensions Spec Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Document Format</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{blueprint.doc_format}</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Resolution & Mode</p>
                        <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">{blueprint.resolution_mode}</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Dimensions</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{blueprint.dimensions}</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Bleed Margin</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">{blueprint.bleed_margin}</p>
                      </div>
                    </div>

                    {/* Color Palette */}
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        🎨 Color Palette (Hex Codes)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {blueprint.color_palette.map((c, i) => (
                          <div
                            key={i}
                            onClick={() => handleCopyHex(c.hex)}
                            className="bg-white dark:bg-[#0b1120] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer transition-all group flex flex-col justify-between shadow-sm"
                          >
                            <div className="h-10 rounded-lg mb-2 shadow-inner border border-slate-200 dark:border-white/10" style={{ backgroundColor: c.hex }} />
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">{c.name}</p>
                                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.hex}</p>
                              </div>
                              <span className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {copiedColor === c.hex ? <FiCheck className="text-emerald-500 dark:text-emerald-400" /> : <FiCopy size={12} />}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Typography Specifications */}
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FiType className="text-blue-500 dark:text-blue-400" /> Typography Specifications
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {blueprint.typography.map((t, i) => (
                          <div key={i} className="bg-white dark:bg-[#0b1120] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{t.font}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Weights: {t.weights}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Usage: {t.usage}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Structural Layout Breakdown */}
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FiFileText className="text-blue-500 dark:text-blue-400" /> Structural Layout Breakdown
                      </h4>
                      <div className="space-y-2">
                        {blueprint.layout_breakdown.map((l, i) => (
                          <div key={i} className="bg-white dark:bg-[#0b1120] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-start gap-3 text-xs shadow-sm">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono font-bold shrink-0">
                              {l.section}
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{l.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Raw JSON Specification Toggle */}
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowRawJson(prev => !prev)}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#0b1120] dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm"
                        >
                          <FiCode size={14} />
                          <span>{showRawJson ? 'Hide Raw JSON Specification' : '</> Show Raw JSON Specification'}</span>
                        </button>

                        {showRawJson && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
                              toast.success('Raw JSON copied to clipboard!');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5"
                          >
                            <FiCopy size={12} /> Copy JSON
                          </button>
                        )}
                      </div>

                      {showRawJson && (
                        <div className="relative animate-in fade-in zoom-in-95 duration-200">
                          <pre className="p-4 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/90 text-[11px] font-mono text-slate-800 dark:text-emerald-400 overflow-x-auto max-h-80 custom-scrollbar leading-relaxed shadow-inner">
                            <code>{JSON.stringify(blueprint, null, 2)}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB 2: ASSETS & LINKS ── */}
                {activeTab === 'assets_links' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* 1. Verified Free Google Fonts */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FiType className="text-blue-500 dark:text-blue-400" /> Verified Free Google Fonts
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(blueprint.assets_links?.filter(a => a.type === 'font') || blueprint.typography || []).map((f, i) => {
                          const fontName = f.name || f.font || 'Font';
                          const fontUrl = f.url || `https://fonts.google.com/specimen/${encodeURIComponent(fontName.replace(/\s*\(.*\)/, ''))}`;
                          return (
                            <a
                              key={i}
                              href={fontUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-50 dark:bg-[#111c33] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all flex items-center justify-between group shadow-sm"
                            >
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{fontName.replace(/\s*\(Google Fonts\)/i, '')}</p>
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{f.license || 'Free Commercial License'}</p>
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#0b1120] text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:border-blue-500/50 transition-all shadow-sm">
                                <FiExternalLink size={14} />
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Icon Glyphs & Vector Links (Photoshop / Illustrator) */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FiSmile className="text-blue-500 dark:text-blue-400" /> Icon Glyphs & Vector Links (Photoshop / Illustrator)
                      </h4>

                      <div className="space-y-2">
                        {/* FontAwesome Official Download Item */}
                        <div className="bg-slate-50 dark:bg-[#111c33] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">FontAwesome Official Vector Font</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Required for Photoshop glyph text tools</p>
                          </div>
                          <a
                            href="https://fontawesome.com/download"
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                            <span>Download</span>
                            <FiExternalLink size={12} />
                          </a>
                        </div>

                        {/* Glyph Items */}
                        {(blueprint.assets_links?.filter(a => a.type === 'glyph' || a.type === 'icon') || [
                          { name: 'Feature / Chart Icon', query: 'Flaticon SVG query: chart', glyph: '\\f080' },
                          { name: 'Marketing / Bullhorn Icon', query: 'Flaticon SVG query: bullhorn', glyph: '\\f0a1' },
                          { name: 'Users / Team Icon', query: 'Flaticon SVG query: users', glyph: '\\f0c0' },
                          { name: 'Contact Phone & Globe Icons', query: 'Flaticon SVG query: phone', glyph: '\\f095' }
                        ]).map((g, i) => {
                          const glyphVal = g.glyph || (g.note?.match(/\\f[0-9a-f]+/i)?.[0]) || `\\f0${80 + i}`;
                          const queryText = g.query || g.note || `Flaticon SVG query: ${g.name?.toLowerCase()}`;
                          return (
                            <div key={i} className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
                              <div className="flex items-center gap-3">
                                <p className="text-xs font-black text-slate-900 dark:text-white">{g.name}</p>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">{queryText}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(glyphVal);
                                  toast.success(`Copied Glyph ${glyphVal} to clipboard!`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 dark:bg-[#0b1120] dark:hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm"
                              >
                                <span>Glyph: {glyphVal}</span>
                                <FiCopy size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Unsplash / Freepik Commercial-Use Placeholders */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FiImage className="text-blue-500 dark:text-blue-400" /> Unsplash Commercial-Use Placeholders
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(blueprint.assets_links?.filter(a => a.type === 'stock' || a.type === 'image' || a.type === 'placeholder') || [
                          { name: 'Topic Hero Photo Placeholder', url: 'https://unsplash.com/s/photos/traveler-beach' },
                          { name: 'Secondary Subject Placeholder', url: 'https://unsplash.com/s/photos/ocean-vacation' },
                          { name: 'Background Texture / Vectors', url: 'https://www.freepik.com/search?query=travel+background' }
                        ]).map((p, i) => {
                          const itemName = p.name || 'Stock Photo Placeholder';
                          const targetUrl = (p.url && p.url.startsWith('http'))
                            ? p.url
                            : `https://unsplash.com/s/photos/${encodeURIComponent(itemName.toLowerCase().replace(/[^a-z0-9 ]/g, ''))}`;

                          return (
                            <a
                              key={i}
                              href={targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={itemName}
                              className="bg-slate-50 dark:bg-[#111c33] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 hover:bg-slate-100/80 dark:hover:bg-[#13203c] transition-all flex items-center justify-between gap-2 group shadow-sm"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                  {itemName}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                  Direct Stock Search ↗
                                </p>
                              </div>
                              <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#0b1120] text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <FiExternalLink size={13} />
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: PSD LAYER TREE ── */}
                {activeTab === 'layer_tree' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FiLayers className="text-blue-500 dark:text-blue-400" /> Structured Photoshop Layer Tree
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            let textTree = `📁 [Template] - ${blueprint.doc_format || 'Design Flyer'}\n`;
                            blueprint.layer_tree.forEach((group, gi) => {
                              const isLastGroup = gi === blueprint.layer_tree.length - 1;
                              textTree += `${isLastGroup ? '└──' : '├──'} 📁 ${group.folder}\n`;
                              group.layers?.forEach((layer, li) => {
                                const isLastLayer = li === group.layers.length - 1;
                                const icon = layer.icon || (layer.type === 'smart_object' ? '🖼️' : layer.type === 'shape' || layer.type === 'solid_color' ? '🎨' : layer.type === 'guide' ? '🔲' : '📁');
                                textTree += `${isLastGroup ? '    ' : '│   '}${isLastLayer ? '└──' : '├──'} ${icon} ${layer.name}\n`;
                              });
                            });
                            navigator.clipboard.writeText(textTree);
                            toast.success('PSD Layer Tree copied to clipboard!');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FiCopy size={12} /> Copy Layer Tree
                        </button>
                      </div>

                      {/* Visual Tree Box */}
                      <div className="p-5 rounded-2xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed custom-scrollbar shadow-inner">
                        {/* Root Header */}
                        <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 mb-3">
                          <span>📁</span>
                          <span>[Template] - {blueprint.doc_format || 'Design Flyer Blueprint'}</span>
                        </div>

                        <div className="space-y-1">
                          {blueprint.layer_tree.map((group, gi) => {
                            const isLastGroup = gi === blueprint.layer_tree.length - 1;
                            return (
                              <div key={gi} className="space-y-0.5">
                                {/* Group Line */}
                                <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-slate-900/60 py-0.5 px-1 rounded transition-colors">
                                  <span className="text-slate-400 dark:text-blue-500 font-normal">{isLastGroup ? '└──' : '├──'}</span>
                                  <span>📁</span>
                                  <span>{group.folder}</span>
                                </div>

                                {/* Children Layers */}
                                {group.layers?.map((layer, li) => {
                                  const isLastLayer = li === group.layers.length - 1;
                                  const icon = layer.icon || (layer.type === 'smart_object' ? '🖼️' : layer.type === 'shape' || layer.type === 'solid_color' ? '🎨' : layer.type === 'guide' ? '🔲' : '📁');
                                  return (
                                    <div key={li} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/40 py-0.5 px-1 rounded transition-colors text-[11px]">
                                      <span className="text-slate-400 dark:text-blue-500 font-normal">{isLastGroup ? '\u00A0\u00A0\u00A0\u00A0' : '│\u00A0\u00A0\u00A0'}</span>
                                      <span className="text-slate-400 dark:text-blue-400 font-normal">{isLastLayer ? '└──' : '├──'}</span>
                                      <span>{icon}</span>
                                      <span className="text-slate-800 dark:text-slate-200 font-medium">{layer.name}</span>
                                      {layer.color && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                          <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-white/20 inline-block" style={{ backgroundColor: layer.color }}></span>
                                          ({layer.color})
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0e172a] flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {blueprint ? 'Ready to assign task with AI Blueprint specifications.' : 'Upload reference image or click Architect PSD Blueprint to generate.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors border border-slate-300 dark:border-slate-700 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={actionLoading || !formData.title.trim()}
              className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? 'Assigning...' : 'Assign Agentic Task'} <FiCheck />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AgenticTaskModal;

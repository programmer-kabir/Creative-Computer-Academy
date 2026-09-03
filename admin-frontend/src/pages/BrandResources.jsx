import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiSearch, FiRefreshCw, FiExternalLink, FiUploadCloud,
  FiDroplet, FiLayers, FiType, FiFolder, FiShield, FiX,
  FiAlertCircle, FiGrid, FiShuffle, FiCheck, FiClock, FiXCircle, FiUser
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';

const BrandResources = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'color' | 'palette' | 'logo' | 'font' | 'template' | 'guideline'
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: 'color',
    title: '',
    value: '#4338CA',
    subtitle: '',
    preview_url: '',
    format_tag: '',
    sort_order: 0,
    is_active: 1,
    created_by: 'Admin',
    created_by_role: 'admin',
    approval_status: 'approved'
  });

  // Multi-color Palette Builder State (Color Hunt Style)
  const [paletteColors, setPaletteColors] = useState(['#14532D', '#16A34A', '#86EFAC', '#FEF08A']);

  const harmonyTemplates = [
    { name: 'Eco Nature Green', colors: ['#14532D', '#16A34A', '#86EFAC', '#FEF08A'], tag: 'Nature / Organic' },
    { name: 'Sunset Warmth', colors: ['#7C2D12', '#EA580C', '#FB923C', '#FEF3C7'], tag: 'Marketing / Warm' },
    { name: 'Midnight Cyber Neon', colors: ['#09090B', '#3B0764', '#7C3AED', '#22D3EE'], tag: 'Social Media / Dark' },
    { name: 'Corporate Trust Navy', colors: ['#0F172A', '#1E40AF', '#38BDF8', '#F1F5F9'], tag: 'Corporate / UI' },
    { name: 'Pastel Dream', colors: ['#F472B6', '#FBBF24', '#A7F3D0', '#EFF6FF'], tag: 'Soft / Creative' },
    { name: 'Vintage Earth & Clay', colors: ['#44403C', '#78716C', '#D97706', '#FEF3C7'], tag: 'Vintage / Minimal' }
  ];

  // Bulk Palette Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkGroupName, setBulkGroupName] = useState('Primary Brand');
  const [bulkColorText, setBulkColorText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Format BD Date & Time (Asia/Dhaka)
  const formatBDDateTime = (dateStr) => {
    if (!dateStr) return null;
    try {
      const [dPart, tPart] = dateStr.split(' ');
      if (!dPart) return dateStr;
      const [year, month, day] = dPart.split('-');
      const dateObj = new Date(year, month - 1, day);
      const dateFormatted = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      if (tPart) {
        const [hh, mm] = tPart.split(':');
        let hour = parseInt(hh, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${dateFormatted}, ${hour}:${mm} ${ampm}`;
      }
      return dateFormatted;
    } catch {
      return dateStr;
    }
  };

  // Determine light/dark color contrast
  const isLightColor = (hex) => {
    if (!hex || !hex.startsWith('#')) return false;
    const c = hex.replace('#', '');
    if (c.length < 6) return false;
    const r = parseInt(c.substr(0, 2), 16) || 0;
    const g = parseInt(c.substr(2, 2), 16) || 0;
    const b = parseInt(c.substr(4, 2), 16) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  };

  // Helper: HSL to HEX converter
  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };

  // Helper: Name hue angle for aesthetic titles
  const getHueName = (h) => {
    if (h >= 345 || h < 15) return 'Crimson Rose';
    if (h >= 15 && h < 45) return 'Sunset Orange';
    if (h >= 45 && h < 70) return 'Amber Gold';
    if (h >= 70 && h < 150) return 'Emerald Forest';
    if (h >= 150 && h < 195) return 'Teal Ocean';
    if (h >= 195 && h < 255) return 'Royal Navy';
    if (h >= 255 && h < 290) return 'Cyber Violet';
    if (h >= 290 && h < 345) return 'Neon Magenta';
    return 'Chromatic';
  };

  // Dynamically inject Google Font into <head> at runtime (Zero index.html edits needed!)
  const dynamicallyLoadFont = (fontFamily) => {
    if (!fontFamily || fontFamily === 'inherit') return;
    const cleanId = `gfont-${fontFamily.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (document.getElementById(cleanId)) return;

    const link = document.createElement('link');
    link.id = cleanId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:ital,wght@0,400;0,600;0,700;1,400&display=swap`;
    document.head.appendChild(link);
  };

  // Helper: Resolve font-family CSS from title & auto-inject link
  const getFontFamily = (title = '', value = '') => {
    const t = (title || '').toLowerCase();
    let cleanName = '';

    if (value && value.includes('fonts.google.com/specimen/')) {
      const match = value.match(/specimen\/([^/?#]+)/);
      if (match && match[1]) {
        cleanName = decodeURIComponent(match[1]).replace(/\+/g, ' ');
      }
    }
    if (!cleanName) {
      cleanName = (title || '').replace(/\s*\(.*?\)\s*/g, '').trim();
    }

    if (cleanName) {
      dynamicallyLoadFont(cleanName);
    }

    if (t.includes('hind siliguri')) return "'Hind Siliguri', sans-serif";
    if (t.includes('tiro bangla')) return "'Tiro Bangla', serif";
    if (t.includes('kalpurush')) return "'Kalpurush', 'Hind Siliguri', sans-serif";
    if (t.includes('inter')) return "'Inter', sans-serif";
    if (t.includes('montserrat')) return "'Montserrat', sans-serif";
    if (t.includes('poppins')) return "'Poppins', sans-serif";
    if (t.includes('roboto')) return "'Roboto', sans-serif";
    return cleanName ? `'${cleanName}', sans-serif` : 'inherit';
  };

  // Algorithmic Harmony Generator (Coolors & Color Hunt Style)
  const generateRandomHarmony = () => {
    const styles = ['analogous', 'complementary', 'triadic', 'monochromatic', 'warm_sunset', 'cyber_neon'];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
    const baseHue = Math.floor(Math.random() * 360);
    let newColors = [];
    let themeName = '';
    let tag = 'Harmony';

    if (chosenStyle === 'analogous') {
      newColors = [
        hslToHex(baseHue, 75, 18),
        hslToHex((baseHue + 25) % 360, 70, 42),
        hslToHex((baseHue + 50) % 360, 85, 62),
        hslToHex((baseHue + 15) % 360, 30, 96)
      ];
      themeName = `${getHueName(baseHue)} Analogous`;
      tag = 'Analogous';
    } else if (chosenStyle === 'complementary') {
      const compHue = (baseHue + 180) % 360;
      newColors = [
        hslToHex(baseHue, 75, 18),
        hslToHex(baseHue, 60, 45),
        hslToHex(compHue, 85, 55),
        hslToHex(compHue, 35, 96)
      ];
      themeName = `${getHueName(baseHue)} & ${getHueName(compHue)}`;
      tag = 'Complementary';
    } else if (chosenStyle === 'triadic') {
      newColors = [
        hslToHex(baseHue, 70, 20),
        hslToHex((baseHue + 120) % 360, 65, 48),
        hslToHex((baseHue + 240) % 360, 80, 62),
        hslToHex(baseHue, 25, 96)
      ];
      themeName = `${getHueName(baseHue)} Triadic`;
      tag = 'Triadic';
    } else if (chosenStyle === 'monochromatic') {
      newColors = [
        hslToHex(baseHue, 80, 16),
        hslToHex(baseHue, 70, 38),
        hslToHex(baseHue, 75, 64),
        hslToHex(baseHue, 40, 94)
      ];
      themeName = `${getHueName(baseHue)} Monochrome`;
      tag = 'Monochrome';
    } else if (chosenStyle === 'cyber_neon') {
      newColors = [
        '#0F172A',
        hslToHex(baseHue, 90, 48),
        hslToHex((baseHue + 60) % 360, 95, 60),
        '#F8FAFC'
      ];
      themeName = `${getHueName(baseHue)} Cyber Neon`;
      tag = 'Cyber / UI';
    } else {
      // Warm Sunset
      newColors = [
        hslToHex(baseHue, 65, 24),
        hslToHex((baseHue + 30) % 360, 75, 52),
        hslToHex((baseHue + 60) % 360, 85, 70),
        hslToHex(baseHue, 45, 96)
      ];
      themeName = `${getHueName(baseHue)} Sunset Glow`;
      tag = 'Warm / Sunset';
    }

    setPaletteColors(newColors);
    setFormData(prev => ({
      ...prev,
      title: themeName,
      format_tag: tag,
      subtitle: `${tag} 4-color palette generated for creative graphics`
    }));
    toast.success(`Generated: ${themeName}`);
  };

  // Fetch Resources
  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/brand/get_brand_resources.php?all=1`);
      if (res.data.status === 'success') {
        const normalized = (res.data.data || []).map(item => {
          if ((!item.category || item.category === '') && item.value?.includes(',')) {
            return { ...item, category: 'palette' };
          }
          return item;
        });
        setResources(normalized);
      }
    } catch (err) {
      console.error('Error fetching brand resources:', err);
      toast.error('Failed to load brand resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Fast 1-click Approval Status Handler
  const handleUpdateApproval = async (item, status) => {
    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, {
        action: 'update_approval',
        id: item.id,
        approval_status: status
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || `Resource status set to ${status}`);
        fetchResources();
      } else {
        toast.error(res.data.message || 'Failed to update approval status');
      }
    } catch (err) {
      console.error('Error updating approval:', err);
      toast.error('Failed to update approval status');
    }
  };

  // Parse multi-line / comma-separated HEX colors
  const parseBulkColors = (text, groupName) => {
    if (!text) return [];
    const lines = text.split('\n');
    const results = [];
    const hexRegex = /#([0-9A-Fa-f]{3,8})\b/;

    lines.forEach((line) => {
      const parts = line.includes(',') ? line.split(',') : [line];
      parts.forEach((part) => {
        const match = part.match(hexRegex);
        if (match) {
          const hex = '#' + match[1].toUpperCase();
          let name = part.replace(match[0], '').split('-').join('').split(':').join('').split('|').join('').trim();
          if (!name) {
            name = `${groupName || 'Color'} ${results.length + 1}`;
          }
          results.push({
            category: 'color',
            title: name,
            value: hex,
            format_tag: groupName || 'Palette',
            subtitle: groupName ? `${groupName} Official Color` : 'Brand Swatch',
            sort_order: resources.length + results.length + 1,
            is_active: 1
          });
        }
      });
    });
    return results;
  };

  const parsedBulkList = parseBulkColors(bulkColorText, bulkGroupName);

  const colorPresets = [
    {
      name: 'CCA Official Navy & Blue',
      tag: 'Primary Brand',
      text: `#0F172A - Deep Slate Navy\n#1E3A8A - Royal Brand Navy\n#2563EB - CCA Vibrant Blue\n#60A5FA - Sky Blue Accent\n#F8FAFC - Snow White Background`
    },
    {
      name: 'Sunset Glow (Marketing)',
      tag: 'Marketing & Promo',
      text: `#7C2D12 - Deep Earth Brown\n#C2410C - Rust Orange\n#EA580C - Sunset Primary\n#F97316 - Warm Glow Accent\n#FEF3C7 - Pale Warm Amber`
    },
    {
      name: 'Emerald Tech (Certificates)',
      tag: 'Course & Cert',
      text: `#064E3B - Deep Forest Green\n#047857 - Pine Academy Green\n#10B981 - Emerald Accent\n#34D399 - Mint Green\n#ECFDF5 - Light Mint Background`
    },
    {
      name: 'Cyber Purple (Social Media)',
      tag: 'Social Media',
      text: `#2E1065 - Midnight Dark\n#581C87 - Royal Violet\n#7C3AED - Electric Purple\n#A855F7 - Neon Lavender\n#FAF5FF - Soft Lilac Background`
    }
  ];

  const handleSaveBulk = async () => {
    if (parsedBulkList.length === 0) {
      toast.error('Please enter at least one valid HEX color code (e.g. #1E40AF)');
      return;
    }

    setBulkSaving(true);
    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, {
        action: 'bulk_create',
        items: parsedBulkList
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || `Successfully imported ${parsedBulkList.length} colors!`);
        setBulkModalOpen(false);
        setBulkColorText('');
        fetchResources();
      } else {
        toast.error(res.data.message || 'Bulk creation failed');
      }
    } catch (err) {
      console.error('Bulk save error:', err);
      toast.error('Error saving colors');
    } finally {
      setBulkSaving(false);
    }
  };

  // Screen EyeDropper
  const handlePickColorFromScreen = async () => {
    if (!window.EyeDropper) {
      toast.info('EyeDropper is not supported on this browser. Please use the color picker.');
      return;
    }
    try {
      const dropper = new window.EyeDropper();
      const res = await dropper.open();
      if (res?.sRGBHex) {
        setFormData(prev => ({ ...prev, value: res.sRGBHex.toUpperCase() }));
        toast.success(`Color: ${res.sRGBHex.toUpperCase()}`);
      }
    } catch {
      // User cancelled picker
    }
  };

  // Open Create Modal
  const handleOpenCreate = (defaultCategory = 'color') => {
    const cat = defaultCategory === 'all' ? 'color' : defaultCategory;
    setEditingItem(null);
    if (cat === 'palette') {
      setPaletteColors(['#14532D', '#16A34A', '#86EFAC', '#FEF08A']);
    }
    setFormData({
      category: cat,
      title: '',
      value: cat === 'color' ? '#3B82F6' : cat === 'palette' ? '#14532D,#16A34A,#86EFAC,#FEF08A' : '',
      subtitle: '',
      preview_url: '',
      format_tag: cat === 'color' ? 'Primary' : cat === 'palette' ? 'Poster / Social Media' : cat === 'logo' ? 'PNG' : '',
      sort_order: resources.length + 1,
      is_active: 1,
      created_by: 'Admin',
      created_by_role: 'admin',
      approval_status: 'approved'
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    if (item.category === 'palette' && item.value) {
      const parts = item.value.split(',').map(s => s.trim()).filter(Boolean);
      setPaletteColors(parts.length >= 2 ? parts : ['#14532D', '#16A34A', '#86EFAC', '#FEF08A']);
    }
    setFormData({
      category: item.category,
      title: item.title,
      value: item.value,
      subtitle: item.subtitle || '',
      preview_url: item.preview_url || '',
      format_tag: item.format_tag || '',
      sort_order: item.sort_order || 0,
      is_active: Number(item.is_active),
      created_by: item.created_by || 'Admin',
      created_by_role: item.created_by_role || 'admin',
      approval_status: item.approval_status || 'approved'
    });
    setModalOpen(true);
  };

  // Handle File Upload for Logos / Assets
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    data.append('action', 'upload_asset');

    setUploading(true);
    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status === 'success' && res.data.url) {
        setFormData(prev => ({
          ...prev,
          value: res.data.url,
          preview_url: res.data.url,
          format_tag: res.data.format || prev.format_tag
        }));
        toast.success('Asset uploaded successfully!');
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Submit Save
  const handleSave = async (e) => {
    e.preventDefault();
    const finalValue = formData.category === 'palette' ? paletteColors.join(',') : formData.value;
    if (!formData.title.trim() || !finalValue.trim()) {
      toast.error('Title and Value are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        action: editingItem ? 'update' : 'create',
        ...(editingItem && { id: editingItem.id }),
        ...formData,
        value: finalValue
      };

      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, payload);
      if (res.data.status === 'success') {
        toast.success(editingItem ? 'Resource updated successfully' : 'New resource created successfully');
        setModalOpen(false);
        fetchResources();
      } else {
        toast.error(res.data.message || 'Saving failed');
      }
    } catch (err) {
      console.error('Error saving resource:', err);
      toast.error('Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (item) => {
    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, {
        action: 'toggle_status',
        id: item.id
      });
      if (res.data.status === 'success') {
        setResources(prev => prev.map(r => r.id === item.id ? { ...r, is_active: r.is_active ? 0 : 1 } : r));
        toast.success(`${item.title} status updated`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete Resource
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, {
        action: 'delete',
        id
      });
      if (res.data.status === 'success') {
        toast.success('Resource deleted successfully');
        setResources(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(res.data.message || 'Delete failed');
      }
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  // Counts for approval status
  const pendingCount = resources.filter(r => r.approval_status === 'pending').length;
  const approvedCount = resources.filter(r => (r.approval_status || 'approved') === 'approved').length;
  const rejectedCount = resources.filter(r => r.approval_status === 'rejected').length;

  // Filtered list
  const filteredList = resources.filter(item => {
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    if (!matchesCategory) return false;

    const itemApproval = item.approval_status || 'approved';
    const matchesApproval = approvalFilter === 'all' || itemApproval === approvalFilter;
    if (!matchesApproval) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.value?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.format_tag?.toLowerCase().includes(q) ||
      item.created_by?.toLowerCase().includes(q)
    );
  });

  const tabDefs = [
    { key: 'all', label: 'All Resources', count: resources.length },
    { key: 'color', label: 'Single Colors', icon: <FiDroplet size={14} />, count: resources.filter(r => r.category === 'color').length },
    { key: 'palette', label: 'Color Palettes', icon: <FiGrid size={14} />, count: resources.filter(r => r.category === 'palette').length },
    { key: 'logo', label: 'Logos & Stamps', icon: <FiLayers size={14} />, count: resources.filter(r => r.category === 'logo').length },
    { key: 'font', label: 'Typography & Fonts', icon: <FiType size={14} />, count: resources.filter(r => r.category === 'font').length },
    { key: 'template', label: 'Master Templates', icon: <FiFolder size={14} />, count: resources.filter(r => r.category === 'template').length },
    { key: 'guideline', label: 'Design Guidelines', icon: <FiShield size={14} />, count: resources.filter(r => r.category === 'guideline').length },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20">
              <HiSparkles size={18} className="animate-pulse" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-blue-200">
              Academy Asset Architecture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            CCA Brand Kit & Resources Manager
          </h1>
          <p className="text-sm text-blue-100/80 font-medium max-w-xl leading-relaxed">
            Manage official brand colors, color palettes, vector logos, font downloads, drive templates, and design rules for creative staff and designers.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchResources}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Refresh data"
          >
            <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-extrabold text-sm rounded-2xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
            title="Import multiple color codes at once"
          >
            <FiDroplet size={16} />
            <span>Bulk Palettes</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate(activeTab)}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-blue-950/30 flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <FiPlus size={18} />
            <span>Add New Resource</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Row */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {tabDefs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search resources or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Approval Workflow Sub-filter Pills */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Review Status:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setApprovalFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                approvalFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              All Status ({resources.length})
            </button>
            <button
              type="button"
              onClick={() => setApprovalFilter('approved')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                approvalFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <FiCheck size={12} />
              <span>Approved ({approvedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setApprovalFilter('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                approvalFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              } ${pendingCount > 0 ? 'ring-2 ring-amber-400/40' : ''}`}
            >
              <FiClock size={12} className={pendingCount > 0 ? 'animate-spin-slow' : ''} />
              <span>Pending Review ({pendingCount})</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setApprovalFilter('rejected')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                approvalFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <FiXCircle size={12} />
              <span>Rejected ({rejectedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resource Table / Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading resources...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <FiAlertCircle className="mx-auto text-slate-400" size={36} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No resources found</p>
            <button
              onClick={() => handleOpenCreate(activeTab)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FiPlus size={14} /> Add New Resource
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/90 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Title, Author & Preview</th>
                  <th className="py-3.5 px-5">Value / Link</th>
                  <th className="py-3.5 px-5">Tag & Description</th>
                  <th className="py-3.5 px-5 text-center">Approval</th>
                  <th className="py-3.5 px-5 text-center">Active</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {filteredList.map((item) => {
                  const isColor = item.category === 'color';
                  const isPalette = item.category === 'palette';
                  const isLogo = item.category === 'logo';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                      {/* Category */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                          item.category === 'color' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' :
                          item.category === 'palette' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30' :
                          item.category === 'logo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30' :
                          item.category === 'font' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
                          item.category === 'template' ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30' :
                          'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                        }`}>
                          {item.category === 'palette' ? 'Palette' : item.category}
                        </span>
                      </td>

                      {/* Title, Author & Visual Preview */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {isColor && (
                            <div
                              className="w-8 h-8 rounded-lg shadow-inner border border-slate-300 dark:border-slate-600 shrink-0"
                              style={{ backgroundColor: item.value }}
                            />
                          )}
                          {isPalette && (
                            <div className="w-12 h-8 rounded-lg overflow-hidden flex flex-col shadow-inner border border-slate-300 dark:border-slate-600 shrink-0">
                              {item.value?.split(',').map((c, i) => (
                                <div key={i} className="w-full flex-1" style={{ backgroundColor: c.trim() }} title={c.trim()} />
                              ))}
                            </div>
                          )}
                          {isLogo && (
                            <div className="w-10 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                              <img
                                src={item.value?.startsWith('http') || item.value?.startsWith('/') ? item.value : `${API_BASE}${item.value}`}
                                alt="logo"
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => { e.target.src = '/logo.png'; }}
                              />
                            </div>
                          )}
                          {item.category === 'font' && (
                            <div
                              className="w-10 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center font-bold text-xs text-amber-700 dark:text-amber-400 shrink-0 shadow-2xs"
                              style={{ fontFamily: getFontFamily(item.title) }}
                            >
                              Aa
                            </div>
                          )}
                          <div className="min-w-0">
                            <p
                              className="font-black text-slate-800 dark:text-slate-100 truncate"
                              style={item.category === 'font' ? { fontFamily: getFontFamily(item.title) } : {}}
                            >
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                                <FiUser size={10} />
                                {item.created_by || 'Admin'}
                                {item.created_by_role === 'reviewer' && (
                                  <span className="text-[9px] px-1 py-0.2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded border border-purple-200 dark:border-purple-800 font-bold">
                                    Reviewer
                                  </span>
                                )}
                              </span>
                              <span>•</span>
                              <span>Order: #{item.sort_order}</span>
                              {item.updated_at && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400 dark:text-slate-500 font-mono" title={`Created: ${formatBDDateTime(item.created_at) || '-'}`}>
                                    {formatBDDateTime(item.updated_at)}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Value / Link */}
                      <td className="py-3.5 px-5 max-w-xs">
                        {isPalette ? (
                          <div className="flex items-center gap-1 flex-wrap max-w-[240px]">
                            {item.value?.split(',').map((c, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-2xs border border-slate-200 dark:border-slate-700"
                                style={{ backgroundColor: `${c.trim()}22`, color: c.trim() }}
                              >
                                {c.trim()}
                              </span>
                            ))}
                          </div>
                        ) : isColor ? (
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                            {item.value}
                          </span>
                        ) : item.value?.startsWith('http') ? (
                          <a
                            href={item.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-mono truncate max-w-[200px]"
                          >
                            <span>{item.value}</span>
                            <FiExternalLink size={11} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="font-mono text-slate-600 dark:text-slate-300 truncate block max-w-[220px]">
                            {item.value}
                          </span>
                        )}
                      </td>

                      {/* Subtitle & Format Tag */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          {item.format_tag && (
                            <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/60">
                              {item.format_tag}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {item.subtitle || '—'}
                          </p>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-5 text-center">
                        {(item.approval_status === 'approved' || !item.approval_status) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <FiCheck size={11} /> Approved
                          </span>
                        ) : item.approval_status === 'pending' ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
                              <FiClock size={11} /> Pending Review
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateApproval(item, 'approved')}
                                className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
                                title="Approve resource"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateApproval(item, 'rejected')}
                                className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
                                title="Reject resource"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              <FiXCircle size={11} /> Rejected
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateApproval(item, 'approved')}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                              title="Re-approve"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Active Status Switch */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                            Number(item.is_active)
                              ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={Number(item.is_active) ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                        >
                          {Number(item.is_active) ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-700/80 dark:hover:bg-blue-600 dark:hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/60 transition-all cursor-pointer shadow-2xs"
                            title="Edit"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-700/80 dark:hover:bg-rose-600 dark:hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600/60 transition-all cursor-pointer shadow-2xs"
                            title="Delete"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──────── Create / Edit Modal ──────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
            formData.category === 'palette' ? 'max-w-4xl' : 'max-w-xl'
          }`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  formData.category === 'palette' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}>
                  {formData.category === 'palette' ? <FiGrid size={16} /> : <FiPlus size={16} />}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    {editingItem ? 'Edit Resource' : formData.category === 'palette' ? 'Create Color Palette (Color Hunt Harmony)' : 'Add New Brand Resource'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {formData.category === 'palette' ? 'Create harmonious 4-5 color palettes for banners and digital graphics' : 'Store official academy branding resources'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Form with Scrollable Body & Sticky Footer */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Category selector & Title row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Resource Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          category: cat,
                          value: cat === 'color' && !prev.value.startsWith('#') ? '#3B82F6' : cat === 'palette' ? paletteColors.join(',') : prev.value
                        }));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="color">🎨 Single Color</option>
                      <option value="palette">🌈 4-Color Palette (Color Hunt Harmony)</option>
                      <option value="logo">🖼️ Official Logo / Stamp</option>
                      <option value="font">🔤 Typography & Fonts</option>
                      <option value="template">📁 Master Templates & Drive</option>
                      <option value="guideline">📜 Design Guidelines & Rules</option>
                    </select>
                  </div>

                  <div className="sm:col-span-7">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {formData.category === 'palette' ? 'Palette Name / Theme *' : 'Title / Asset Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={formData.category === 'palette' ? "e.g. Vintage Earth & Clay, Cyber Neon, CCA Navy Trust" : "e.g. CCA Primary Indigo, Main Vector Logo"}
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Main Body */}
                {formData.category === 'palette' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                    {/* Left: Presets + Color Inputs */}
                    <div className="lg:col-span-7 space-y-3.5">
                      {/* Random Harmony Generator Action Banner */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200/80 dark:border-purple-800/60">
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <FiShuffle className="text-purple-600 dark:text-purple-400" />
                            <span>Algorithmic Harmony Generator</span>
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Auto-mix complementary, analogous & trending shades with 1-click
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={generateRandomHarmony}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                        >
                          <FiShuffle size={13} />
                          <span>Roll Random</span>
                        </button>
                      </div>

                      {/* Presets */}
                      <div>
                        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                          Select Preset Color Harmony:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {harmonyTemplates.map((t, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPaletteColors([...t.colors]);
                                if (!formData.title || harmonyTemplates.some(ht => ht.name === formData.title)) {
                                  setFormData(p => ({ ...p, title: t.name }));
                                }
                                setFormData(p => ({ ...p, format_tag: t.tag }));
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-700 dark:text-slate-300 hover:text-purple-600 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span className="flex items-center -space-x-1">
                                {t.colors.map((c, ci) => (
                                  <span key={ci} className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900" style={{ backgroundColor: c }} />
                                ))}
                              </span>
                              <span>{t.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color list slots */}
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Select Palette Color Shades:
                        </span>
                        <div className="space-y-2">
                          {paletteColors.map((col, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                              <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="color"
                                value={col.startsWith('#') ? col : '#3B82F6'}
                                onChange={(e) => {
                                  const newCols = [...paletteColors];
                                  newCols[idx] = e.target.value.toUpperCase();
                                  setPaletteColors(newCols);
                                }}
                                className="w-9 h-8 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent shrink-0"
                              />
                              <input
                                type="text"
                                required
                                value={col}
                                onChange={(e) => {
                                  const newCols = [...paletteColors];
                                  newCols[idx] = e.target.value.toUpperCase();
                                  setPaletteColors(newCols);
                                }}
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none"
                              />
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hidden sm:inline px-1">
                                {idx === 0 ? 'Dominant (60%)' : idx === 1 ? 'Secondary (30%)' : idx === 2 ? 'Accent (10%)' : 'Base/Bg'}
                              </span>
                              {paletteColors.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setPaletteColors(paletteColors.filter((_, i) => i !== idx))}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                                  title="Remove"
                                >
                                  <FiX size={15} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {paletteColors.length < 5 && (
                          <button
                            type="button"
                            onClick={() => setPaletteColors([...paletteColors, '#94A3B8'])}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                          >
                            <FiPlus size={13} /> + Add 5th Color
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Real Color Hunt Live Preview Card */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <HiSparkles className="text-amber-500" /> Color Hunt Preview
                          </span>
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                            Live Preview
                          </span>
                        </div>

                        {/* Color Hunt Card */}
                        <div className="w-full h-56 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                          {paletteColors.map((hex, i) => {
                            const isLight = isLightColor(hex);
                            return (
                              <div
                                key={i}
                                className="w-full flex-1 flex items-center justify-between px-3 text-[11px] font-mono font-bold transition-all"
                                style={{ backgroundColor: hex }}
                              >
                                <span className={`px-2 py-0.5 rounded-md backdrop-blur-md shadow-2xs ${
                                  isLight ? 'bg-black/20 text-slate-900' : 'bg-white/30 text-white'
                                }`}>
                                  {hex}
                                </span>
                                <span className={`text-[10px] font-bold opacity-80 ${
                                  isLight ? 'text-slate-900' : 'text-white'
                                }`}>
                                  {i === 0 ? '60%' : i === 1 ? '30%' : i === 2 ? '10%' : 'Base'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick Roll Button */}
                        <button
                          type="button"
                          onClick={generateRandomHarmony}
                          className="w-full mt-3 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl border border-purple-200 dark:border-purple-800/80 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-2xs"
                        >
                          <FiShuffle size={13} className="text-purple-500" />
                          <span>Generate Another Random Harmony</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        💡 This combination will appear as an interactive Color Hunt card in the Staff Portal.
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single color / Guideline / File link */
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {formData.category === 'color' ? 'HEX Color Code *' :
                       formData.category === 'guideline' ? 'Guideline Description *' : 'Value / Asset URL / Drive Link *'}
                    </label>

                    {formData.category === 'color' ? (
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={formData.value.startsWith('#') ? formData.value : '#3B82F6'}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value.toUpperCase() }))}
                          className="w-11 h-10 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          required
                          placeholder="#1E3A8A"
                          value={formData.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value.toUpperCase() }))}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button
                          type="button"
                          onClick={handlePickColorFromScreen}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Pick color from screen (EyeDropper)"
                        >
                          <FiDroplet size={14} className="text-blue-500" />
                          <span>Pick</span>
                        </button>
                      </div>
                    ) : formData.category === 'guideline' ? (
                      <textarea
                        rows={3}
                        required
                        placeholder="Enter guidelines or design rules in detail..."
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="https://drive.google.com/... or paste asset link"
                          value={formData.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                        />

                        {/* Quick File Uploader Button for Logos/Assets */}
                        {(formData.category === 'logo' || formData.category === 'template') && (
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                              <FiUploadCloud size={14} className="text-blue-500" />
                              <span>{uploading ? 'Uploading...' : 'Upload File from Computer'}</span>
                              <input
                                type="file"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Subtitle & Format Tag Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subtitle / Usage Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Posters, Social Media, Certificates, Web Banners"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Format / Category Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Social Media, Poster, Marketing, UI"
                      value={formData.format_tag}
                      onChange={(e) => setFormData(prev => ({ ...prev, format_tag: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Sort Order, Approval Status & Active Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Approval Status
                    </label>
                    <select
                      value={formData.approval_status || 'approved'}
                      onChange={(e) => setFormData(prev => ({ ...prev, approval_status: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending Review</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Active Status
                    </label>
                    <select
                      value={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: parseInt(e.target.value) }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Actions (Sticky at bottom, ALWAYS VISIBLE!) */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/95 flex items-center justify-between shrink-0">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {formData.category === 'palette' ? (
                    <span>Total <strong className="text-purple-600 dark:text-purple-400">{paletteColors.length}</strong> color shades</span>
                  ) : (
                    <span>Category: <strong className="text-blue-600 dark:text-blue-400 capitalize">{formData.category}</strong></span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Resource'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────── Bulk Palette Import Modal ──────── */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-transparent flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <FiDroplet size={18} />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Bulk Color Palette Import
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Enter or paste multiple HEX color codes at once
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Group / Tag Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Palette Group / Tag Name *
                </label>
                <input
                  type="text"
                  value={bulkGroupName}
                  onChange={(e) => setBulkGroupName(e.target.value)}
                  placeholder="e.g. Primary Brand, Social Media Theme, Certificate Palette"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Fast Presets */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Select Quick Preset Palettes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setBulkGroupName(preset.tag);
                        setBulkColorText(preset.text);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    HEX Color Codes (comma or new-line separated) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    e.g. #1E40AF - Navy Blue
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={bulkColorText}
                  onChange={(e) => setBulkColorText(e.target.value)}
                  placeholder={`#0F172A - Deep Slate Navy\n#1E3A8A - Royal Navy\n#2563EB - Primary Blue\n#60A5FA - Sky Blue Accent\n#F8FAFC - Snow White`}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                />
              </div>

              {/* Live Preview Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <HiSparkles className="text-amber-500" />
                    <span>Live Preview ({parsedBulkList.length} Colors Detected)</span>
                  </span>
                  {parsedBulkList.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Ready
                    </span>
                  )}
                </div>

                {parsedBulkList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    Enter or paste HEX codes above to see live preview swatches here
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {parsedBulkList.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs"
                      >
                        <div
                          className="w-7 h-7 rounded-lg shrink-0 shadow-inner border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: c.value }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">
                            {c.title}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                            {c.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Total <strong className="text-blue-600 dark:text-blue-400">{parsedBulkList.length}</strong> colors ready to import
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulk}
                  disabled={bulkSaving || parsedBulkList.length === 0}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-amber-950/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {bulkSaving ? 'Saving...' : `Save ${parsedBulkList.length} Colors`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandResources;

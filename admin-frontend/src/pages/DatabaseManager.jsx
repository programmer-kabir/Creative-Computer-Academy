import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiDatabase,
  FiTable,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiPlay,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiArrowUp,
  FiArrowDown,
  FiKey,
  FiCode,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
  FiClock,
  FiCopy,
  FiCheck,
  FiColumns,
  FiActivity,
  FiHardDrive,
  FiHash,
  FiLayers,
  FiZap,
  FiCornerDownRight
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function DatabaseManager() {
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'sql'
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [loadingTables, setLoadingTables] = useState(true);

  // Table Data State
  const [tableData, setTableData] = useState({
    columns: [],
    primary_keys: [],
    rows: [],
    pagination: {
      page: 1,
      limit: 25,
      total_records: 0,
      total_pages: 0,
      sort_col: '',
      sort_dir: 'DESC',
      search: ''
    }
  });
  const [loadingData, setLoadingData] = useState(false);
  const [rowSearchInput, setRowSearchInput] = useState('');

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [showColDropdown, setShowColDropdown] = useState(false);

  // Modals & Drawers
  const [editModal, setEditModal] = useState({ isOpen: false, row: null, table: '' });
  const [insertModal, setInsertModal] = useState({ isOpen: false, data: {}, table: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, row: null, table: '', fromSql: false });
  const [jsonViewModal, setJsonViewModal] = useState({ isOpen: false, title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  // SQL Runner State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 25;');
  const [sqlResult, setSqlResult] = useState(null);
  const [executingSql, setExecutingSql] = useState(false);
  const [queryHistory, setQueryHistory] = useState([
    'SELECT * FROM users LIMIT 25;',
    'SELECT * FROM attendance ORDER BY id DESC LIMIT 20;',
    'SELECT * FROM tasks WHERE status = "pending";',
    'SHOW TABLES;'
  ]);

  // Copied cell tooltip
  const [copiedKey, setCopiedKey] = useState(null);

  // Detect target table name from SQL Query
  const sqlDetectedTable = useMemo(() => {
    if (!sqlQuery) return selectedTable || '';
    const match = sqlQuery.match(/from\s+[`]?([a-zA-Z0-9_]+)[`]?/i);
    return match ? match[1] : (selectedTable || '');
  }, [sqlQuery, selectedTable]);

  // Stats calculation
  const totalDbRows = useMemo(() => tables.reduce((sum, t) => sum + (t.rows || 0), 0), [tables]);
  const totalDbSize = useMemo(() => {
    const totalBytes = tables.reduce((sum, t) => sum + (t.data_size || 0) + (t.index_size || 0), 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  }, [tables]);

  // Fetch Tables
  const fetchTables = async (selectDefault = false) => {
    setLoadingTables(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/database/get_tables.php`);
      if (res.data.status === 'success') {
        const fetchedTables = res.data.tables || [];
        setTables(fetchedTables);
        if ((selectDefault || !selectedTable) && fetchedTables.length > 0) {
          const defaultTable = fetchedTables.find(t => t.name === 'users')?.name || fetchedTables[0].name;
          setSelectedTable(defaultTable);
        }
      } else {
        toast.error(res.data.message || 'Failed to load tables');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to database API');
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchTables(true);
  }, []);

  // Fetch Table Data
  const fetchTableData = async (table, page = 1, limit = 25, search = '', sortCol = '', sortDir = 'DESC') => {
    if (!table) return;
    setLoadingData(true);
    try {
      const params = {
        table,
        page,
        limit,
        search,
        sort_col: sortCol,
        sort_dir: sortDir
      };
      const res = await axios.get(`${API_BASE}api/admin/database/get_table_data.php`, { params });
      if (res.data.status === 'success') {
        setTableData(res.data);
        if (res.data.columns) {
          setVisibleColumns(res.data.columns.map(c => c.name));
        }
      } else {
        toast.error(res.data.message || 'Failed to load table records');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching table records');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      setRowSearchInput('');
      fetchTableData(selectedTable, 1, tableData.pagination.limit, '', '', 'DESC');
    }
  }, [selectedTable]);

  // Search Filtered Tables list
  const filteredTables = useMemo(() => {
    if (!tableSearch) return tables;
    return tables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()));
  }, [tables, tableSearch]);

  // Handle Sort
  const handleSort = (colName) => {
    let nextDir = 'ASC';
    if (tableData.pagination.sort_col === colName && tableData.pagination.sort_dir === 'ASC') {
      nextDir = 'DESC';
    }
    fetchTableData(
      selectedTable,
      tableData.pagination.page,
      tableData.pagination.limit,
      tableData.pagination.search,
      colName,
      nextDir
    );
  };

  // Handle Row Search Submit
  const handleRowSearch = (e) => {
    e.preventDefault();
    fetchTableData(
      selectedTable,
      1,
      tableData.pagination.limit,
      rowSearchInput,
      tableData.pagination.sort_col,
      tableData.pagination.sort_dir
    );
  };

  // Handle Page Change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > tableData.pagination.total_pages) return;
    fetchTableData(
      selectedTable,
      newPage,
      tableData.pagination.limit,
      tableData.pagination.search,
      tableData.pagination.sort_col,
      tableData.pagination.sort_dir
    );
  };

  // Handle Limit Change
  const handleLimitChange = (newLimit) => {
    fetchTableData(
      selectedTable,
      1,
      parseInt(newLimit),
      tableData.pagination.search,
      tableData.pagination.sort_col,
      tableData.pagination.sort_dir
    );
  };

  // Copy cell value
  const handleCopyCell = (text, key) => {
    if (text === null || text === undefined) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    toast.success('Copied to clipboard', { duration: 1500 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Column toggle
  const toggleColumn = (colName) => {
    setVisibleColumns(prev =>
      prev.includes(colName) ? prev.filter(c => c !== colName) : [...prev, colName]
    );
  };

  // Open Insert Modal
  const openInsertModal = () => {
    const initialData = {};
    tableData.columns.forEach(col => {
      initialData[col.name] = col.default_value !== null ? col.default_value : '';
    });
    setInsertModal({ isOpen: true, data: initialData, table: selectedTable });
  };

  // Submit Insert Row
  const handleInsertRow = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const target = insertModal.table || selectedTable;
    try {
      const res = await axios.post(`${API_BASE}api/admin/database/insert_row.php`, {
        table: target,
        data: insertModal.data
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Row inserted successfully');
        setInsertModal({ isOpen: false, data: {}, table: '' });
        fetchTableData(selectedTable, 1, tableData.pagination.limit, tableData.pagination.search);
        fetchTables();
      } else {
        toast.error(res.data.message || 'Failed to insert row');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error inserting row');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (row, table = selectedTable) => {
    setEditModal({ isOpen: true, row: { ...row }, table });
  };

  // Submit Edit Row
  const handleUpdateRow = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const target = editModal.table || selectedTable;

    const primaryKeys = {};
    if (tableData.primary_keys.length > 0) {
      tableData.primary_keys.forEach(pk => {
        if (editModal.row[pk] !== undefined) primaryKeys[pk] = editModal.row[pk];
      });
    } else if (editModal.row.id !== undefined) {
      primaryKeys['id'] = editModal.row.id;
    }

    try {
      const res = await axios.post(`${API_BASE}api/admin/database/update_row.php`, {
        table: target,
        primary_keys: primaryKeys,
        data: editModal.row
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Row updated successfully');
        setEditModal({ isOpen: false, row: null, table: '' });
        if (activeTab === 'explorer') {
          fetchTableData(
            selectedTable,
            tableData.pagination.page,
            tableData.pagination.limit,
            tableData.pagination.search,
            tableData.pagination.sort_col,
            tableData.pagination.sort_dir
          );
        } else {
          handleExecuteSql();
        }
      } else {
        toast.error(res.data.message || 'Failed to update row');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating row');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (row, table = selectedTable, fromSql = false) => {
    setDeleteModal({ isOpen: true, row, table, fromSql });
  };

  // Submit Delete Row
  const handleDeleteRow = async () => {
    if (!deleteModal.row) return;
    setSubmitting(true);
    const target = deleteModal.table || selectedTable;

    const primaryKeys = {};
    if (tableData.primary_keys.length > 0 && tableData.table === target) {
      tableData.primary_keys.forEach(pk => {
        if (deleteModal.row[pk] !== undefined) primaryKeys[pk] = deleteModal.row[pk];
      });
    } else if (deleteModal.row.id !== undefined) {
      primaryKeys['id'] = deleteModal.row.id;
    } else {
      // Use first available column as primary identifier
      const firstCol = Object.keys(deleteModal.row)[0];
      primaryKeys[firstCol] = deleteModal.row[firstCol];
    }

    try {
      const res = await axios.post(`${API_BASE}api/admin/database/delete_row.php`, {
        table: target,
        primary_keys: primaryKeys
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Row deleted successfully');
        setDeleteModal({ isOpen: false, row: null, table: '', fromSql: false });
        if (deleteModal.fromSql || activeTab === 'sql') {
          handleExecuteSql();
        } else {
          fetchTableData(
            selectedTable,
            tableData.pagination.page,
            tableData.pagination.limit,
            tableData.pagination.search
          );
        }
        fetchTables();
      } else {
        toast.error(res.data.message || 'Failed to delete row');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting row');
    } finally {
      setSubmitting(false);
    }
  };

  // Convert SELECT query to DELETE query
  const handleConvertTo当年Delete = () => {
    if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
      toast.info('Query is not a SELECT statement');
      return;
    }
    const converted = sqlQuery.replace(/^select\s+.*?\s+from\s+/i, 'DELETE FROM ');
    setSqlQuery(converted);
    toast.info('Query converted to DELETE statement. Review before executing!');
  };

  // Export Table Data
  const exportData = (format, customRows = null, customCols = null, customName = null) => {
    const rowsToExport = customRows || tableData.rows;
    const nameToExport = customName || selectedTable;
    if (!rowsToExport || rowsToExport.length === 0) {
      toast.warning('No data to export');
      return;
    }

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rowsToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${nameToExport}_export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Exported to JSON');
    } else if (format === 'csv') {
      const headers = customCols || (tableData.columns ? tableData.columns.map(c => c.name) : Object.keys(rowsToExport[0]));
      const csvRows = [
        headers.join(','),
        ...rowsToExport.map(row =>
          headers.map(field => {
            const val = row[field] === null ? '' : String(row[field]);
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${nameToExport}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Exported to CSV');
    }
  };

  // Run Custom SQL Query
  const handleExecuteSql = async (customQ = null) => {
    const queryToRun = customQ || sqlQuery;
    if (!queryToRun.trim()) {
      toast.warning('Please enter a SQL query');
      return;
    }
    setExecutingSql(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/database/run_query.php`, {
        query: queryToRun
      });
      setSqlResult(res.data);
      if (res.data.status === 'success') {
        toast.success(res.data.message || `Query executed in ${res.data.execution_time_ms}ms`);
        if (!queryHistory.includes(queryToRun)) {
          setQueryHistory(prev => [queryToRun, ...prev.slice(0, 9)]);
        }
        fetchTables();
      } else {
        toast.error(res.data.message || 'Query execution error');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to execute SQL query');
    } finally {
      setExecutingSql(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter for SQL runner
  const handleKeyDownSql = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSql();
    }
  };

  // Formatter for cells
  const renderCellContent = (val, colName, rowIdx) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-400 dark:text-slate-500 italic text-[11px] font-mono select-none">&lt;null&gt;</span>;
    }

    const strVal = String(val);

    // Boolean or 0/1 status
    if (strVal === '1' && (colName.includes('is_') || colName.includes('has_') || colName.includes('status'))) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          TRUE
        </span>
      );
    }
    if (strVal === '0' && (colName.includes('is_') || colName.includes('has_') || colName.includes('status'))) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          FALSE
        </span>
      );
    }

    // Status strings
    const lower = strVal.toLowerCase();
    if (['active', 'completed', 'approved', 'success', 'present'].includes(lower)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {strVal}
        </span>
      );
    }
    if (['pending', 'in_progress', 'reviewing'].includes(lower)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {strVal}
        </span>
      );
    }
    if (['rejected', 'inactive', 'failed', 'absent', 'late'].includes(lower)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          {strVal}
        </span>
      );
    }

    // JSON detection
    if ((strVal.startsWith('{') && strVal.endsWith('}')) || (strVal.startsWith('[') && strVal.endsWith(']'))) {
      return (
        <button
          onClick={() => setJsonViewModal({ isOpen: true, title: `${colName} (Row #${rowIdx + 1})`, content: strVal })}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
        >
          <FiCode size={11} />
          <span>View JSON</span>
        </button>
      );
    }

    // Image/Upload Path
    if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(strVal) || strVal.startsWith('uploads/')) {
      const imgUrl = strVal.startsWith('http') ? strVal : `${API_BASE}${strVal}`;
      return (
        <div className="flex items-center gap-2">
          <img
            src={imgUrl}
            alt="thumbnail"
            className="w-6 h-6 rounded-md object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="font-mono text-[11px] truncate max-w-[120px]" title={strVal}>{strVal}</span>
        </div>
      );
    }

    // Regular String / Number
    return (
      <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate max-w-xs block" title={strVal}>
        {strVal}
      </span>
    );
  };

  const selectedTableInfo = tables.find(t => t.name === selectedTable);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Metric Cards */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 rounded-3xl border border-slate-700/60 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-4 ring-white/10 shrink-0">
              <FiDatabase size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Database Explorer
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Connected
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
                <span className="font-mono font-semibold text-blue-400">u647959341_cca_manage_db</span>
                <span>•</span>
                <span>Direct Visual Data Studio & SQL Query Console</span>
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeTab === 'explorer'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FiTable size={16} />
              <span>Table Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeTab === 'sql'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FiCode size={16} />
              <span>SQL Runner</span>
            </button>
          </div>
        </div>

        {/* Quick Database Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <FiLayers size={14} className="text-blue-400" />
              <span>Total Tables</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">{tables.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <FiHash size={14} className="text-emerald-400" />
              <span>Total Rows in DB</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">{totalDbRows.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <FiHardDrive size={14} className="text-purple-400" />
              <span>Estimated Size</span>
            </div>
            <p className="text-lg font-bold text-white mt-1">{totalDbSize} MB</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <FiActivity size={14} className="text-amber-400" />
              <span>Active Table</span>
            </div>
            <p className="text-lg font-bold text-amber-300 mt-1 font-mono truncate">{selectedTable || 'None'}</p>
          </div>
        </div>
      </div>

      {activeTab === 'explorer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar: Tables List */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden flex flex-col h-[820px] transition-all">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 space-y-3 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FiTable size={14} className="text-blue-500" />
                  <span>Schema Tables ({filteredTables.length})</span>
                </span>
                <button
                  onClick={() => fetchTables(false)}
                  title="Refresh tables"
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <FiRefreshCw size={14} className={loadingTables ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Table Search Input */}
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Tables List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {loadingTables ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <FiRefreshCw className="animate-spin text-blue-500 mx-auto" size={20} />
                  <p>Loading schema...</p>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <FiAlertTriangle className="mx-auto text-amber-500 mb-1" size={20} />
                  No matching tables
                </div>
              ) : (
                filteredTables.map((tbl) => {
                  const isSelected = selectedTable === tbl.name;
                  return (
                    <button
                      key={tbl.name}
                      onClick={() => setSelectedTable(tbl.name)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left transition-all group ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          }`}
                        >
                          <FiTable size={13} />
                        </div>
                        <span className="text-xs font-mono truncate">{tbl.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0 font-semibold ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {tbl.rows.toLocaleString()}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Data Grid & Actions */}
          <div className="lg:col-span-9 space-y-4">
            {/* Table Detail Bar */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">{selectedTable}</span>
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                    {tableData.pagination.total_records.toLocaleString()} rows
                  </span>
                  {selectedTableInfo?.engine && (
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-mono">
                      {selectedTableInfo.engine}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <span>Primary Key:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {tableData.primary_keys.length > 0 ? tableData.primary_keys.join(', ') : 'None'}
                  </span>
                  <span>•</span>
                  <span>{tableData.columns.length} columns detected</span>
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Insert Row */}
                <button
                  onClick={openInsertModal}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-102"
                >
                  <FiPlus size={15} />
                  <span>Insert Row</span>
                </button>

                {/* Column Toggle Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowColDropdown(!showColDropdown)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <FiColumns size={14} />
                    <span>Columns ({visibleColumns.length})</span>
                  </button>

                  {showColDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-3 z-30 space-y-2 max-h-72 overflow-y-auto">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        Toggle Column Visibility
                      </div>
                      <div className="space-y-1">
                        {tableData.columns.map(col => (
                          <label
                            key={col.name}
                            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-xs font-mono text-slate-700 dark:text-slate-300"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns.includes(col.name)}
                              onChange={() => toggleColumn(col.name)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate">{col.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Dropdown / Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                  <button
                    onClick={() => exportData('csv')}
                    title="Export CSV"
                    className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 shadow-xs"
                  >
                    <FiDownload size={13} />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    title="Export JSON"
                    className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 shadow-xs"
                  >
                    <FiDownload size={13} />
                    <span>JSON</span>
                  </button>
                </div>

                {/* Refresh */}
                <button
                  onClick={() =>
                    fetchTableData(
                      selectedTable,
                      tableData.pagination.page,
                      tableData.pagination.limit,
                      tableData.pagination.search,
                      tableData.pagination.sort_col,
                      tableData.pagination.sort_dir
                    )
                  }
                  title="Refresh Table Data"
                  className="p-2.5 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <FiRefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Filter Search & Pagination Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <form onSubmit={handleRowSearch} className="flex items-center gap-2 max-w-md w-full">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder={`Filter records in ${selectedTable}...`}
                    value={rowSearchInput}
                    onChange={(e) => setRowSearchInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  {rowSearchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setRowSearchInput('');
                        fetchTableData(selectedTable, 1, tableData.pagination.limit, '');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <FiX size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all"
                >
                  Search
                </button>
              </form>

              {/* Rows Per Page & Page Selector */}
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Rows:</span>
                <select
                  value={tableData.pagination.limit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => handlePageChange(tableData.pagination.page - 1)}
                    disabled={tableData.pagination.page <= 1}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FiChevronLeft size={14} />
                  </button>
                  <span className="font-bold text-slate-900 dark:text-white px-2">
                    Page {tableData.pagination.page} of {tableData.pagination.total_pages || 1}
                  </span>
                  <button
                    onClick={() => handlePageChange(tableData.pagination.page + 1)}
                    disabled={tableData.pagination.page >= tableData.pagination.total_pages}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Data Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-24">
                        Action
                      </th>
                      <th className="p-3.5 font-extrabold text-slate-400 uppercase tracking-wider text-center w-12">
                        #
                      </th>
                      {tableData.columns
                        .filter(col => visibleColumns.includes(col.name))
                        .map((col) => {
                          const isSorted = tableData.pagination.sort_col === col.name;
                          const isPK = col.column_key === 'PRI';
                          return (
                            <th
                              key={col.name}
                              onClick={() => handleSort(col.name)}
                              className="p-3.5 font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors whitespace-nowrap group select-none"
                            >
                              <div className="flex items-center gap-1.5">
                                {isPK && (
                                  <span className="p-1 bg-amber-500/10 text-amber-500 rounded-md">
                                    <FiKey size={11} title="Primary Key" />
                                  </span>
                                )}
                                <span className="font-mono text-slate-900 dark:text-white font-bold">{col.name}</span>
                                <span className="text-[10px] font-mono font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {col.data_type}
                                </span>
                                {isSorted && (
                                  <span className="text-blue-600 dark:text-blue-400 ml-1">
                                    {tableData.pagination.sort_dir === 'ASC' ? <FiArrowUp size={13} /> : <FiArrowDown size={13} />}
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {loadingData ? (
                      <tr>
                        <td colSpan={visibleColumns.length + 2} className="p-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <FiRefreshCw className="animate-spin text-blue-500" size={28} />
                            <span className="text-sm font-semibold">Streaming records from {selectedTable}...</span>
                          </div>
                        </td>
                      </tr>
                    ) : tableData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={visibleColumns.length + 2} className="p-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FiDatabase className="text-slate-300 dark:text-slate-600" size={32} />
                            <p className="text-sm font-semibold">No records found matching criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tableData.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group"
                        >
                          {/* Row Actions */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditModal(row, selectedTable)}
                                title="Edit Row"
                                className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/30 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
                              >
                                <FiEdit2 size={13} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(row, selectedTable, false)}
                                title="Delete Row"
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-900/30 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 rounded-lg transition-all"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </td>

                          {/* Row Index */}
                          <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                            {(tableData.pagination.page - 1) * tableData.pagination.limit + rIdx + 1}
                          </td>

                          {/* Columns Values */}
                          {tableData.columns
                            .filter(col => visibleColumns.includes(col.name))
                            .map((col) => {
                              const val = row[col.name];
                              const cellKey = `${rIdx}-${col.name}`;
                              return (
                                <td
                                  key={col.name}
                                  onClick={() => handleCopyCell(val, cellKey)}
                                  className="p-3 cursor-pointer relative group/cell hover:bg-blue-100/50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    {renderCellContent(val, col.name, rIdx)}
                                    <span className="opacity-0 group-hover/cell:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity">
                                      {copiedKey === cellKey ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={11} />}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SQL Runner Console */
        <div className="space-y-6">
          {/* Query Terminal Box */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-4 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <FiCode size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Interactive SQL Console</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                      Ctrl + Enter to Execute
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Run custom queries against the live database engine</p>
                </div>
              </div>

              {/* Template Shortcut Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSqlQuery('SHOW TABLES;')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                >
                  SHOW TABLES;
                </button>
                <button
                  onClick={() => setSqlQuery(`SELECT * FROM ${selectedTable || 'users'} LIMIT 25;`)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                >
                  SELECT * FROM {selectedTable || 'users'}
                </button>
                <button
                  onClick={() => setSqlQuery(`SELECT * FROM tasks WHERE assigned_to = 1;`)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                >
                  tasks (assigned=1)
                </button>
              </div>
            </div>

            {/* SQL Textarea Editor */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <textarea
                rows={6}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                onKeyDown={handleKeyDownSql}
                placeholder="Write your custom SQL query here (e.g. SELECT * FROM tasks WHERE assigned_to = 1;)..."
                className="w-full p-4 font-mono text-sm text-emerald-400 bg-transparent focus:outline-none resize-y selection:bg-blue-500 selection:text-white"
              />
            </div>

            {/* Footer Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-amber-400 flex items-center gap-1.5">
                  <FiAlertTriangle size={14} className="shrink-0" />
                  <span>`UPDATE`, `DELETE`, `DROP` statements apply directly to live database.</span>
                </span>
                {sqlQuery.trim().toLowerCase().startsWith('select') && (
                  <button
                    onClick={handleConvertTo当年Delete}
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 underline flex items-center gap-1"
                    title="Change SELECT to DELETE"
                  >
                    <FiCornerDownRight size={12} />
                    <span>Convert to DELETE query</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSqlQuery('')}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleExecuteSql()}
                  disabled={executingSql}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all hover:scale-102"
                >
                  <FiPlay size={14} className={executingSql ? 'animate-spin' : ''} />
                  <span>{executingSql ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            {/* Query History Chips */}
            {queryHistory.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Recent Query History:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {queryHistory.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSqlQuery(q);
                        handleExecuteSql(q);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 text-[11px] font-mono transition-colors truncate max-w-xs"
                      title={q}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SQL Execution Result Card (Styled in Unified Dark/Sleek Theme) */}
          {sqlResult && (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-200 text-white">
              <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
                <div className="flex items-center gap-3">
                  {sqlResult.status === 'success' ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                      <FiCheckCircle size={14} />
                      <span>Query Succeeded</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-3.5 py-1 rounded-full border border-rose-500/20">
                      <FiAlertTriangle size={14} />
                      <span>Execution Error</span>
                    </span>
                  )}

                  {sqlResult.execution_time_ms && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <FiClock size={13} className="text-blue-400" />
                      <span>{sqlResult.execution_time_ms} ms</span>
                    </span>
                  )}

                  {sqlDetectedTable && (
                    <span className="text-xs text-slate-400 font-mono bg-slate-800/70 px-2.5 py-0.5 rounded-lg border border-slate-700">
                      Table: <span className="text-blue-400 font-bold">{sqlDetectedTable}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {sqlResult.type === 'select' && (
                    <span className="text-xs font-bold text-slate-300">
                      {sqlResult.row_count} rows returned
                    </span>
                  )}

                  {sqlResult.rows && sqlResult.rows.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => exportData('csv', sqlResult.rows, sqlResult.columns, sqlDetectedTable || 'query_result')}
                        title="Export CSV"
                        className="px-2.5 py-1 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-all flex items-center gap-1"
                      >
                        <FiDownload size={12} />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => exportData('json', sqlResult.rows, sqlResult.columns, sqlDetectedTable || 'query_result')}
                        title="Export JSON"
                        className="px-2.5 py-1 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-all flex items-center gap-1"
                      >
                        <FiDownload size={12} />
                        <span>JSON</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {sqlResult.status === 'error' ? (
                <div className="p-6 text-sm font-mono text-rose-400 bg-rose-950/20 border-t border-rose-900/30">
                  {sqlResult.message}
                </div>
              ) : sqlResult.type === 'mutation' ? (
                <div className="p-8 text-center space-y-2">
                  <FiCheckCircle className="text-emerald-400 mx-auto" size={36} />
                  <p className="text-base font-bold text-white">{sqlResult.message}</p>
                  <p className="text-xs text-slate-400 font-mono">Affected records count: {sqlResult.affected_rows}</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[550px] scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800">
                      <tr>
                        {/* Interactive Delete/Action column in SQL results */}
                        <th className="p-3.5 font-extrabold text-slate-400 uppercase tracking-wider text-center w-20">
                          Action
                        </th>
                        <th className="p-3.5 font-extrabold text-slate-500 uppercase tracking-wider text-center w-10">
                          #
                        </th>
                        {sqlResult.columns?.map((col) => (
                          <th key={col} className="p-3.5 font-bold text-slate-300 whitespace-nowrap font-mono">
                            <span className="text-slate-100">{col}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {sqlResult.rows?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/60 transition-colors group">
                          {/* Row Actions inside SQL Query Results */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {sqlDetectedTable && (
                                <button
                                  onClick={() => openEditModal(row, sqlDetectedTable)}
                                  title="Edit this record"
                                  className="p-1.5 bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all"
                                >
                                  <FiEdit2 size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => openDeleteModal(row, sqlDetectedTable || selectedTable, true)}
                                title="Delete this record"
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          </td>

                          {/* Index # */}
                          <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Data Values */}
                          {sqlResult.columns?.map((col) => {
                            const val = row[col];
                            const cellKey = `sql-${idx}-${col}`;
                            return (
                              <td
                                key={col}
                                onClick={() => handleCopyCell(val, cellKey)}
                                className="p-3 cursor-pointer group/cell hover:bg-slate-800 transition-colors relative"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  {renderCellContent(val, col, idx)}
                                  <span className="opacity-0 group-hover/cell:opacity-100 text-slate-500 hover:text-blue-400 transition-opacity">
                                    {copiedKey === cellKey ? <FiCheck className="text-emerald-400" size={12} /> : <FiCopy size={11} />}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* JSON Viewer Modal */}
      {jsonViewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-purple-400 flex items-center gap-2">
                <FiCode />
                <span>{jsonViewModal.title}</span>
              </h3>
              <button
                onClick={() => setJsonViewModal({ isOpen: false, title: '', content: '' })}
                className="p-1 text-slate-400 hover:text-white"
              >
                <FiX size={18} />
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl overflow-auto max-h-96 text-xs font-mono text-emerald-400 whitespace-pre-wrap">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(jsonViewModal.content), null, 2);
                } catch {
                  return jsonViewModal.content;
                }
              })()}
            </pre>
          </div>
        </div>
      )}

      {/* Insert Row Modal */}
      {insertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiPlus className="text-blue-500" />
                  <span>Insert Row into `{insertModal.table || selectedTable}`</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fill in fields according to table schema</p>
              </div>
              <button
                onClick={() => setInsertModal({ isOpen: false, data: {}, table: '' })}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleInsertRow} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tableData.columns.map((col) => {
                  const isAutoInc = col.extra && col.extra.toLowerCase().includes('auto_increment');
                  const isPK = col.column_key === 'PRI';
                  return (
                    <div key={col.name} className={col.data_type === 'text' || col.data_type === 'longtext' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          {isPK && <FiKey className="text-amber-500" size={11} />}
                          <span>{col.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          {col.full_type} {col.is_nullable === 'YES' ? '(Nullable)' : '(Required)'}
                        </span>
                      </label>

                      {col.data_type === 'text' || col.data_type === 'longtext' ? (
                        <textarea
                          rows={3}
                          value={insertModal.data[col.name] ?? ''}
                          onChange={(e) =>
                            setInsertModal(prev => ({
                              ...prev,
                              data: { ...prev.data, [col.name]: e.target.value }
                            }))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={isAutoInc ? 'Auto Increment (Leave empty)' : ''}
                          value={insertModal.data[col.name] ?? ''}
                          onChange={(e) =>
                            setInsertModal(prev => ({
                              ...prev,
                              data: { ...prev.data, [col.name]: e.target.value }
                            }))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInsertModal({ isOpen: false, data: {}, table: '' })}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {submitting ? 'Inserting...' : 'Insert Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Row Modal */}
      {editModal.isOpen && editModal.row && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiEdit2 className="text-blue-500" />
                  <span>Edit Row in `{editModal.table || selectedTable}`</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update column values for selected record
                </p>
              </div>
              <button
                onClick={() => setEditModal({ isOpen: false, row: null, table: '' })}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateRow} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(editModal.row).map((colName) => {
                  const isPK = colName === 'id' || tableData.primary_keys.includes(colName);
                  const val = editModal.row[colName];
                  const isLongText = String(val || '').length > 80;
                  return (
                    <div key={colName} className={isLongText ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          {isPK && <FiKey className="text-amber-500" size={11} />}
                          <span>{colName}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          {isPK ? '(Primary Key)' : ''}
                        </span>
                      </label>

                      {isLongText ? (
                        <textarea
                          rows={3}
                          value={val !== null ? val : ''}
                          onChange={(e) =>
                            setEditModal(prev => ({
                              ...prev,
                              row: { ...prev.row, [colName]: e.target.value }
                            }))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      ) : (
                        <input
                          type="text"
                          disabled={isPK}
                          value={val !== null ? val : ''}
                          onChange={(e) =>
                            setEditModal(prev => ({
                              ...prev,
                              row: { ...prev.row, [colName]: e.target.value }
                            }))
                          }
                          className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                            isPK ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, row: null, table: '' })}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.row && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl">
                <FiTrash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Record Deletion</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Target Table: `{deleteModal.table || selectedTable}`</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete this record? This operation executes immediately on the live database and cannot be undone.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1.5">
              {Object.keys(deleteModal.row).slice(0, 4).map(key => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-400">{key}:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                    {String(deleteModal.row[key])}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, row: null, table: '', fromSql: false })}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRow}
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Deleting...' : 'Delete Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

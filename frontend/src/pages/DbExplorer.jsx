import React, { useState, useEffect } from 'react';
import { 
  Database, FileText, ShieldAlert, Trash2, ArrowUpDown, 
  Search, RefreshCw, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { apiService } from '../api/apiService';

export default function DbExplorer() {
  const [activeTab, setActiveTab] = useState('thoughts'); // thoughts, dumps, safety
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data lists
  const [items, setItems] = useState([]);
  const [dumps, setDumps] = useState([]);
  const [safetyFlags, setSafetyFlags] = useState([]); // Inferred safety flags list
  
  // Pagination / Search states
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const itemsPerPage = 8;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [itemsData, dumpsData] = await Promise.all([
        apiService.getItems(),
        apiService.getDumps()
      ]);
      
      setItems(itemsData);
      setDumps(dumpsData);

      // Infer safety matches: we can extract them from items that have is_safety_flagged,
      // or fetch them. Let's build a neat safety flags list by grouping flagged thoughts.
      const flagsList = [];
      itemsData.forEach(item => {
        if (item.is_safety_flagged === 1) {
          flagsList.push({
            id: `SF-${item.id}`,
            dump_id: item.dump_id,
            thought_id: item.id,
            thought_text: item.original_text,
            flag_type: 'distress',
            created_at: item.created_at
          });
        }
      });
      setSafetyFlags(flagsList);
    } catch (err) {
      console.error(err);
      setError("Failed to sync database contents with API server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleDeleteThought = async (id) => {
    if (!confirm("Delete thought from SQLite? This cannot be undone.")) return;
    try {
      await apiService.deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete item.");
    }
  };

  const handleDeleteDump = async (id) => {
    if (!confirm("Delete this raw dump? WARNING: This will cascade delete all associated thoughts and follow-up data.")) return;
    try {
      await apiService.deleteDump(id);
      setDumps(prev => prev.filter(dump => dump.id !== id));
      // Refresh items to capture cascaded deletions
      const itemsData = await apiService.getItems();
      setItems(itemsData);
    } catch (err) {
      console.error(err);
      alert("Failed to delete raw dump.");
    }
  };

  // Get active list for filtering and sorting
  const getActiveList = () => {
    switch(activeTab) {
      case 'thoughts': return items;
      case 'dumps': return dumps;
      case 'safety': return safetyFlags;
      default: return [];
    }
  };

  const currentList = getActiveList();

  // Filter list
  const filteredList = currentList.filter(row => {
    if (!search) return true;
    const term = search.toLowerCase();
    if (activeTab === 'thoughts') {
      return String(row.id).includes(term) || 
             row.original_text.toLowerCase().includes(term) || 
             row.category.toLowerCase().includes(term);
    } else if (activeTab === 'dumps') {
      return String(row.id).includes(term) || 
             row.raw_content.toLowerCase().includes(term);
    } else {
      return String(row.id).includes(term) || 
             row.thought_text.toLowerCase().includes(term);
    }
  });

  // Sort list
  const sortedList = [...filteredList].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'id') {
      // Extract numeric ID if string (e.g. SF-12)
      const parseId = (val) => typeof val === 'string' ? parseInt(val.split('-')[1], 10) : val;
      valA = parseId(valA);
      valB = parseId(valB);
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination bounds
  const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedList = sortedList.slice(indexOfFirstItem, indexOfLastItem);

  const SortHeader = ({ field, label }) => (
    <th 
      onClick={() => handleSort(field)}
      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/5 select-none transition-colors"
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === field ? 'text-indigo-400' : 'text-gray-600'}`} />
      </div>
    </th>
  );

  return (
    <div className="py-8 px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold tracking-wider text-white">Database Explorer</h1>
          <p className="text-xs text-gray-500 mt-1">Directly inspect and manage raw SQLite tables and cascades.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 w-[200px]"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <button
            onClick={fetchData}
            title="Refresh database connection"
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-3">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => { setActiveTab('thoughts'); setCurrentPage(1); setSearch(''); setSortField('id'); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'thoughts' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Thoughts Table (`thoughts`)</span>
        </button>

        <button
          onClick={() => { setActiveTab('dumps'); setCurrentPage(1); setSearch(''); setSortField('id'); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'dumps' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Brain Dumps (`brain_dumps`)</span>
        </button>

        <button
          onClick={() => { setActiveTab('safety'); setCurrentPage(1); setSearch(''); setSortField('id'); }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'safety' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Safety Intercepts (`safety_flags`)</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border-white/5 shadow-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600/30 border-t-indigo-400 animate-spin" />
              <span className="text-xs text-gray-500 font-medium">Syncing SQLite schema...</span>
            </div>
          ) : paginatedList.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              No database records found matching active query criteria.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] border-b border-white/5">
                {activeTab === 'thoughts' && (
                  <tr>
                    <SortHeader field="id" label="ID" />
                    <SortHeader field="dump_id" label="Dump ID" />
                    <SortHeader field="original_text" label="Thought Text" />
                    <SortHeader field="category" label="Category" />
                    <SortHeader field="priority_score" label="Score" />
                    <SortHeader field="is_resolved" label="Resolved" />
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                )}
                {activeTab === 'dumps' && (
                  <tr>
                    <SortHeader field="id" label="Dump ID" />
                    <SortHeader field="raw_content" label="Raw Brain Dump Content" />
                    <SortHeader field="created_at" label="Ingestion Date" />
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                )}
                {activeTab === 'safety' && (
                  <tr>
                    <SortHeader field="id" label="Flag ID" />
                    <SortHeader field="dump_id" label="Dump ID" />
                    <SortHeader field="thought_text" label="Flagged Phrase" />
                    <SortHeader field="flag_type" label="Flag Type" />
                    <SortHeader field="created_at" label="Flagged At" />
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeTab === 'thoughts' && paginatedList.map(row => (
                  <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-400 font-mono">#{row.id}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono">#{row.dump_id}</td>
                    <td className="px-6 py-4 text-gray-200 max-w-[280px] truncate" title={row.original_text}>
                      {row.original_text}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        row.category === 'decide_now' ? 'bg-rose-500/10 text-rose-400' :
                        row.category === 'needs_info' ? 'bg-amber-500/10 text-amber-400' :
                        row.category === 'task' ? 'bg-teal-500/10 text-teal-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-300 font-mono">{row.priority_score}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.is_resolved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {row.is_resolved ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteThought(row.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Delete thought row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'dumps' && paginatedList.map(row => (
                  <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-400 font-mono">#{row.id}</td>
                    <td className="px-6 py-4 text-gray-200 max-w-[380px] truncate" title={row.raw_content}>
                      {row.raw_content}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteDump(row.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Cascade delete raw dump"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'safety' && paginatedList.map(row => (
                  <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-400 font-mono">{row.id}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono">#{row.dump_id}</td>
                    <td className="px-6 py-4 text-gray-200 max-w-[280px] truncate" title={row.thought_text}>
                      {row.thought_text}
                    </td>
                    <td className="px-6 py-4 text-rose-400 font-semibold text-xs tracking-wider uppercase">
                      {row.flag_type}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {!loading && sortedList.length > 0 && (
          <div className="bg-white/[0.01] px-6 py-4 flex items-center justify-between border-t border-white/5 text-xs text-gray-500">
            <div>
              Showing <span className="font-semibold text-gray-300">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-300">{Math.min(indexOfLastItem, sortedList.length)}</span> of <span className="font-semibold text-gray-300">{sortedList.length}</span> rows
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-gray-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

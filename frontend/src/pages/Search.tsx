import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, FileText, Clock, X, Filter, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';

const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  
  const words = highlight.trim().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return <span>{text}</span>;
  
  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? 
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/40 text-black dark:text-white rounded px-0.5">{part}</mark> 
        : part
      )}
    </span>
  );
};

const FILE_TYPES = [
  { id: '', label: 'All Files' },
  { id: 'pdf', label: 'PDF' },
  { id: 'txt', label: 'Text' },
  { id: 'docx', label: 'Word' },
  { id: 'csv', label: 'CSV' },
  { id: 'pptx', label: 'PowerPoint' }
];

const Search = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('rag_search_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        saveToHistory(query);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/documents/search?query=${encodeURIComponent(debouncedQuery)}&types=${selectedType}`);
        setResults(res.data);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [debouncedQuery, selectedType]);

  const saveToHistory = (q: string) => {
    setHistory(prev => {
      const newHistory = [q.trim(), ...prev.filter(item => item.toLowerCase() !== q.trim().toLowerCase())].slice(0, 8);
      localStorage.setItem('rag_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem('rag_search_history');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (score >= 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 dark:from-purple-400 dark:to-indigo-400">Search Knowledge Base</h1>
        <p className="text-gray-500">Instantly search through the contents of all your uploaded documents using semantic similarity.</p>
      </div>

      {/* Search Input Area */}
      <div className="max-w-3xl mx-auto w-full mb-6 relative z-20">
        <div className={`relative flex items-center bg-white dark:bg-[#1a1a1a] rounded-2xl border-2 transition-colors shadow-sm ${isFocused ? 'border-primary' : 'border-gray-200 dark:border-white/10'}`}>
          <SearchIcon className="absolute left-4 text-gray-400" size={24} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search for concepts, facts, or keywords..."
            className="w-full bg-transparent py-4 pl-12 pr-12 outline-none text-gray-900 dark:text-white text-lg"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500">
              <X size={20} />
            </button>
          )}
        </div>

        {/* History Dropdown */}
        {isFocused && !query.trim() && history.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Searches</span>
              <button onClick={clearHistory} className="text-xs text-primary hover:underline">Clear</button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {history.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setQuery(item); inputRef.current?.blur(); }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-3xl mx-auto w-full">
        <Filter size={16} className="text-gray-400 mr-2" />
        {FILE_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedType === type.id 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-primary/50'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p>Searching knowledge base...</p>
          </div>
        ) : query.trim() && results.length === 0 ? (
          <div className="text-center py-20">
            <SearchIcon size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No results found</h3>
            <p className="text-gray-500">We couldn't find any documents matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div 
                key={idx} 
                className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{result.source}</h4>
                      <p className="text-xs text-gray-500">Chunk #{result.id + 1}</p>
                    </div>
                  </div>
                  <div className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getScoreColor(result.score)}`}>
                    {result.score}% Match
                  </div>
                </div>
                
                <div className="relative">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-serif line-clamp-4 group-hover:line-clamp-none transition-all">
                    <HighlightText text={result.content} highlight={query} />
                  </p>
                  <div className="absolute bottom-0 right-0 left-0 h-8 bg-gradient-to-t from-white/60 dark:from-[#1a1a1a]/60 to-transparent group-hover:opacity-0 transition-opacity pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

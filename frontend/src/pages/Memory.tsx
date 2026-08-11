import React, { useState, useEffect } from 'react';
import { Brain, Plus, Search, Trash2, Edit2, Check, X, Filter } from 'lucide-react';

interface MemoryItem {
  id: string;
  content: string;
  category: string;
  date: string;
}

const CATEGORIES = ['All', 'Preferences', 'Facts', 'Code Style', 'Project Context'];

const Memory = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Preferences');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const existing = localStorage.getItem('agent_memory');
    if (existing) {
      try {
        setMemories(JSON.parse(existing));
      } catch (e) {}
    } else {
      // Add some sample memories
      const sample = [
        { id: '1', content: 'User prefers Python over JavaScript for backend tasks.', category: 'Preferences', date: new Date().toISOString() },
        { id: '2', content: 'Working on a local RAG chatbot project using FastAPI and React.', category: 'Project Context', date: new Date().toISOString() }
      ];
      setMemories(sample);
      localStorage.setItem('agent_memory', JSON.stringify(sample));
    }
  }, []);

  const saveMemories = (mems: MemoryItem[]) => {
    setMemories(mems);
    localStorage.setItem('agent_memory', JSON.stringify(mems));
  };

  const handleAdd = () => {
    if (!newContent.trim()) return;
    const newMem = {
      id: Date.now().toString(),
      content: newContent,
      category: newCategory,
      date: new Date().toISOString()
    };
    saveMemories([newMem, ...memories]);
    setIsAdding(false);
    setNewContent('');
  };

  const handleDelete = (id: string) => {
    saveMemories(memories.filter(m => m.id !== id));
  };

  const startEdit = (mem: MemoryItem) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
  };

  const saveEdit = () => {
    if (!editContent.trim()) return;
    saveMemories(memories.map(m => m.id === editingId ? { ...m, content: editContent } : m));
    setEditingId(null);
  };

  const filtered = memories.filter(m => {
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Agent Memory</h1>
          <p className="text-gray-500">Manage what the AI remembers about you across all conversations.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search memory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-sm shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add Memory</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <Filter size={16} className="text-gray-400 mr-2 shrink-0" />
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              selectedCategory === cat 
                ? 'bg-primary border-primary text-white shadow-md' 
                : 'bg-white/50 dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isAdding && (
        <div className="mb-6 bg-white/60 dark:bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 shadow-lg animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Brain size={20} className="text-primary"/> Teach AI something new</h3>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="E.g., I always prefer dark mode in my UI designs."
            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-all resize-none min-h-[100px] mb-4"
          />
          <div className="flex items-center justify-between">
            <select 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-primary"
            >
              {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">Save Memory</button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <Brain size={48} className="mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Blank Slate</h3>
          <p className="text-gray-500 max-w-sm">The AI doesn't have any specific memories in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(mem => (
            <div key={mem.id} className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-wider">{mem.category}</span>
                <span className="text-[10px] text-gray-400">{new Date(mem.date).toLocaleDateString()}</span>
              </div>
              
              {editingId === mem.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-white dark:bg-black/40 border border-primary/50 rounded-lg p-3 text-sm outline-none text-gray-900 dark:text-white resize-none min-h-[120px] flex-1 mb-4"
                />
              ) : (
                <div className="text-gray-700 dark:text-gray-300 text-sm flex-1 mb-4 leading-relaxed">
                  {mem.content}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId === mem.id ? (
                  <>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded"><X size={16}/></button>
                    <button onClick={saveEdit} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"><Check size={16}/></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(mem)} className="p-1.5 text-gray-400 hover:text-primary transition-colors"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(mem.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Memory;

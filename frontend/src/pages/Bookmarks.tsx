import React, { useState, useEffect } from 'react';
import { Bookmark, Search, Trash2, Share2, Filter, ChevronDown, Check } from 'lucide-react';
import api from '../services/api';

interface SavedBookmark {
  id: string;
  content: string;
  category: string;
  date: string;
  chatId: string;
}

const CATEGORIES = ['All', 'General', 'Code', 'Research', 'Writing', 'Important'];

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const response = await api.get('/bookmarks/');
      setBookmarks(response.data);
    } catch (e) {
      console.error('Failed to load bookmarks', e);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(bookmarks.filter(b => b.id !== id));
    } catch (e) {
      console.error('Failed to delete bookmark', e);
    }
  };

  const updateCategory = async (id: string, newCategory: string) => {
    try {
      await api.put(`/bookmarks/${id}`, { category: newCategory });
      setBookmarks(bookmarks.map(b => b.id === id ? { ...b, category: newCategory } : b));
    } catch (e) {
      console.error('Failed to update category', e);
    }
  };

  const copyToClipboard = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const matchesSearch = b.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Saved Answers</h1>
          <p className="text-gray-500">Your bookmarked responses from across all conversations.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search bookmarks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
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

      {/* Grid */}
      {filteredBookmarks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <Bookmark size={48} className="mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No bookmarks found</h3>
          <p className="text-gray-500 max-w-sm">When you see an AI response you like, click the bookmark icon to save it here.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredBookmarks.map((bookmark) => (
            <div 
              key={bookmark.id} 
              className="break-inside-avoid bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="relative inline-block">
                  <select 
                    value={bookmark.category}
                    onChange={(e) => updateCategory(bookmark.id, e.target.value)}
                    className="appearance-none bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold px-2.5 py-1 rounded-md border-none outline-none cursor-pointer pr-6 transition-colors"
                  >
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                </div>
                <span className="text-[10px] text-gray-400">{new Date(bookmark.date).toLocaleDateString()}</span>
              </div>
              
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 line-clamp-6 mb-4">
                {bookmark.content}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button 
                    onClick={() => copyToClipboard(bookmark.id, bookmark.content)}
                    className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedId === bookmark.id ? <Check size={16} className="text-green-500"/> : <Share2 size={16} />}
                  </button>
                  <a href={`/c/${bookmark.chatId}`} className="text-[10px] text-primary hover:underline flex items-center px-2">
                    View Chat
                  </a>
                </div>
                <button 
                  onClick={() => deleteBookmark(bookmark.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete bookmark"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;

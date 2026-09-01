import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Plus, MessageSquare, Database, Settings, Trash2, X, Sun, Moon, Search,
  Pin, Bookmark, Brain, BarChart2, Folder, FolderPlus, ChevronDown, ChevronRight,
  Loader2, AlertCircle, RefreshCw, LogOut, User as UserIcon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string | null;
}

interface DateGroup {
  label: string;
  chats: Chat[];
}

// ─── Date grouping helpers ────────────────────────────────────────────────────

function getEffectiveDate(chat: Chat): Date {
  return new Date(chat.updated_at ?? chat.created_at);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function groupChatsByDate(chats: Chat[]): DateGroup[] {
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const sevenDaysStart = todayStart - 7 * 86_400_000;

  const groups: DateGroup[] = [
    { label: 'Today', chats: [] },
    { label: 'Yesterday', chats: [] },
    { label: 'Previous 7 Days', chats: [] },
    { label: 'Older', chats: [] },
  ];

  for (const chat of chats) {
    const t = getEffectiveDate(chat).getTime();
    if (t >= todayStart) {
      groups[0].chats.push(chat);
    } else if (t >= yesterdayStart) {
      groups[1].chats.push(chat);
    } else if (t >= sevenDaysStart) {
      groups[2].chats.push(chat);
    } else {
      groups[3].chats.push(chat);
    }
  }

  // Only return groups that have chats
  return groups.filter(g => g.chats.length > 0);
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = ({ onClose }: { onClose: () => void }) => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ── State ──
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [chatsError, setChatsError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);

  const [activeTab, setActiveTab] = useState<'history' | 'collections'>('history');
  const [collections, setCollections] = useState<{ id: string; name: string; chatIds: number[] }[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // ── Fetch chats ──
  const fetchChats = useCallback(async () => {
    setChatsError(false);
    try {
      const res = await api.get('/chats');
      setChats(res.data);
    } catch {
      setChatsError(true);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  // ── Effects ──
  useEffect(() => {
    fetchChats();

    // Listen to the unified 'chat-updated' event fired by Chat.tsx
    const handleChatUpdated = () => fetchChats();
    window.addEventListener('chat-updated', handleChatUpdated);

    const savedPins = localStorage.getItem('pinned_chats');
    if (savedPins) {
      try { setPinnedIds(JSON.parse(savedPins)); } catch (_) {}
    }

    const savedCols = localStorage.getItem('chat_collections');
    if (savedCols) {
      try { setCollections(JSON.parse(savedCols)); } catch (_) {}
    }

    return () => window.removeEventListener('chat-updated', handleChatUpdated);
  }, [fetchChats]);

  // ── New Chat: navigate to blank state — chat is created lazily on first message ──
  const handleNewChat = () => {
    navigate('/');
    if (window.innerWidth < 1024) onClose();
  };

  // ── Delete chat ──
  const deleteChat = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/chats/${id}`);
      setChats(prev => prev.filter(c => c.id !== id));
      // If we're currently viewing the deleted chat, go to blank state
      if (location.pathname === `/c/${id}`) navigate('/');
    } catch {
      console.error('Failed to delete chat');
    }
  };

  // ── Pin / unpin ──
  const togglePin = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds(prev => {
      const newPins = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem('pinned_chats', JSON.stringify(newPins));
      return newPins;
    });
  };

  // ── Collections ──
  const createCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    const newCol = { id: Date.now().toString(), name: newCollectionName, chatIds: [] };
    const updated = [...collections, newCol];
    setCollections(updated);
    localStorage.setItem('chat_collections', JSON.stringify(updated));
    setNewCollectionName('');
    setIsCreatingCollection(false);
  };

  const deleteCollection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = collections.filter(c => c.id !== id);
    setCollections(updated);
    localStorage.setItem('chat_collections', JSON.stringify(updated));
  };

  const handleDropCollection = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!draggedId) return;
    setCollections(prev => {
      const updated = prev.map(col => {
        if (col.id === collectionId && !col.chatIds.includes(draggedId)) {
          return { ...col, chatIds: [...col.chatIds, draggedId] };
        }
        return col;
      });
      localStorage.setItem('chat_collections', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCollection = (e: React.MouseEvent, collectionId: string, chatId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCollections(prev => {
      const updated = prev.map(col =>
        col.id === collectionId ? { ...col, chatIds: col.chatIds.filter(id => id !== chatId) } : col
      );
      localStorage.setItem('chat_collections', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: number) => e.dataTransfer.setData('text/plain', id.toString());
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (draggedId === targetId) return;
    setPinnedIds(prev => {
      const di = prev.indexOf(draggedId);
      const ti = prev.indexOf(targetId);
      if (di === -1 || ti === -1) return prev;
      const newPins = [...prev];
      newPins.splice(di, 1);
      newPins.splice(ti, 0, draggedId);
      localStorage.setItem('pinned_chats', JSON.stringify(newPins));
      return newPins;
    });
  };

  // ── Derived data ──
  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedChats = pinnedIds.map(id => filteredChats.find(c => c.id === id)).filter(Boolean) as Chat[];
  const recentChats = filteredChats.filter(c => !pinnedIds.includes(c.id));
  const dateGroups = groupChatsByDate(recentChats);

  // ── Chat row renderer ──
  const renderChatRow = (chat: Chat, opts?: { isPinned?: boolean; inCollection?: string }) => {
    const isActive = location.pathname === `/c/${chat.id}`;
    return (
      <div
        key={chat.id}
        draggable
        onDragStart={e => handleDragStart(e, chat.id)}
        onDragOver={handleDragOver}
        onDrop={opts?.isPinned ? e => handleDrop(e, chat.id) : undefined}
        onClick={() => { navigate(`/c/${chat.id}`); if (window.innerWidth < 1024) onClose(); }}
        className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white'
            : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          {opts?.isPinned
            ? <Pin size={16} className="shrink-0 text-primary" fill="currentColor" />
            : <MessageSquare size={16} className="shrink-0 opacity-50" />
          }
          <span className="truncate text-sm">{chat.title}</span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
          {opts?.inCollection ? (
            <button
              onClick={e => removeFromCollection(e, opts.inCollection!, chat.id)}
              className="p-1 hover:text-red-400 transition-colors"
              title="Remove from collection"
            >
              <X size={12} />
            </button>
          ) : (
            <>
              <button
                onClick={e => togglePin(e, chat.id)}
                className="p-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={opts?.isPinned ? 'Unpin' : 'Pin chat'}
              >
                <Pin size={13} />
              </button>
              <button
                onClick={e => deleteChat(e, chat.id)}
                className="p-1 hover:text-red-400 transition-colors"
                title="Delete chat"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── History content ──
  const renderHistory = () => {
    if (loadingChats) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-xs">Loading chats…</span>
        </div>
      );
    }

    if (chatsError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
          <AlertCircle size={22} className="text-red-400" />
          <span className="text-xs text-center">Failed to load chats.</span>
          <button
            onClick={() => { setLoadingChats(true); fetchChats(); }}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Pinned section */}
        {pinnedChats.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider px-2">
              Pinned
            </div>
            <div className="space-y-0.5">
              {pinnedChats.map(chat => renderChatRow(chat, { isPinned: true }))}
            </div>
          </div>
        )}

        {/* Date-grouped recent chats */}
        {recentChats.length === 0 && pinnedChats.length === 0 && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
            <MessageSquare size={28} className="opacity-30" />
            <p className="text-xs text-center leading-relaxed">
              No conversations yet.<br />Start a new chat to get going!
            </p>
          </div>
        )}

        {recentChats.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
            <Search size={20} className="opacity-40" />
            <p className="text-xs text-center">No chats match "{searchQuery}"</p>
          </div>
        )}

        {dateGroups.map(group => (
          <div key={group.label}>
            <div className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider px-2">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.chats.map(chat => renderChatRow(chat))}
            </div>
          </div>
        ))}
      </>
    );
  };

  // ── Render ──
  return (
    <div className="w-[280px] h-full flex flex-col bg-white dark:bg-sidebar-dark text-gray-600 dark:text-gray-300 shadow-xl border-r border-gray-200 dark:border-white/5 relative">
      <button onClick={onClose} className="lg:hidden absolute right-4 top-4 p-1 hover:text-gray-900 dark:text-white">
        <X size={20} />
      </button>

      {/* New Chat button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all text-gray-900 dark:text-white font-medium py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm cursor-pointer"
        >
          <Plus size={20} /> New Chat
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-1 mb-2">
        <button
          onClick={() => setActiveTab('history')}
          onDragOver={e => { e.preventDefault(); setActiveTab('history'); }}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          onDragOver={e => { e.preventDefault(); setActiveTab('collections'); }}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'collections'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Collections
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'history' ? 'Search chats…' : 'Search collections…'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-colors"
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div className={activeTab === 'history' ? 'block' : 'hidden'}>
          {renderHistory()}
        </div>
        <div className={activeTab === 'collections' ? 'block space-y-2' : 'hidden'}>
            {!isCreatingCollection ? (
              <button
                onClick={() => setIsCreatingCollection(true)}
                className="w-full flex items-center gap-2 p-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <FolderPlus size={16} /> New Collection
              </button>
            ) : (
              <form onSubmit={createCollection} className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                <input
                  autoFocus
                  type="text"
                  placeholder="Collection name..."
                  value={newCollectionName}
                  onChange={e => { e.stopPropagation(); setNewCollectionName(e.target.value); }}
                  onKeyDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 px-1 py-1 text-sm outline-none mb-2 focus:border-primary text-gray-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsCreatingCollection(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
                  <button type="submit" className="text-xs px-2 py-1 bg-primary text-white rounded">Save</button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {collections
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(col => (
                  <div
                    key={col.id}
                    className="rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={e => handleDropCollection(e, col.id)}
                  >
                    <div
                      onClick={() => setOpenCollectionId(openCollectionId === col.id ? null : col.id)}
                      className="group flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {openCollectionId === col.id
                          ? <ChevronDown size={14} className="shrink-0" />
                          : <ChevronRight size={14} className="shrink-0" />
                        }
                        <Folder size={16} className="shrink-0 text-primary" fill="currentColor" fillOpacity={0.2} />
                        <span className="truncate text-sm font-medium">{col.name}</span>
                      </div>
                      <button
                        onClick={e => deleteCollection(e, col.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-colors"
                        title="Delete collection"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {openCollectionId === col.id && (
                      <div className="pl-9 pr-2 pb-2 space-y-1">
                        {col.chatIds.length === 0 ? (
                          <div className="text-xs text-gray-400 py-1 italic">Drag chats here to add…</div>
                        ) : (
                          col.chatIds.map(chatId => {
                            const chat = chats.find(c => c.id === chatId);
                            if (!chat) return null;
                            return renderChatRow(chat, { inCollection: col.id });
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="p-3 border-t border-gray-200 dark:border-white/10">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:bg-white/5 transition-colors text-left"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <Link
          to="/knowledge-base"
          onClick={() => window.innerWidth < 1024 && onClose()}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${location.pathname === '/knowledge-base' ? 'bg-primary/20 text-gray-900 dark:text-white' : 'hover:bg-gray-50 dark:bg-white/5'}`}
        >
          <Database size={20} />
          <span className="text-sm font-medium">Knowledge Base</span>
        </Link>
        <Link
          to="/search"
          onClick={() => window.innerWidth < 1024 && onClose()}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${location.pathname === '/search' ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          <Search size={20} />
          <span className="text-sm font-medium">Search</span>
        </Link>
        <Link
          to="/bookmarks"
          onClick={() => window.innerWidth < 1024 && onClose()}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${location.pathname === '/bookmarks' ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          <Bookmark size={20} />
          <span className="text-sm font-medium">Bookmarks</span>
        </Link>
        <Link
          to="/memory"
          onClick={() => window.innerWidth < 1024 && onClose()}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${location.pathname === '/memory' ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          <Brain size={20} />
          <span className="text-sm font-medium">Memory</span>
        </Link>
        <Link
          to="/analytics"
          onClick={() => window.innerWidth < 1024 && onClose()}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${location.pathname === '/analytics' ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          <BarChart2 size={20} />
          <span className="text-sm font-medium">Analytics</span>
        </Link>
        <Link
          to="/settings"
          onClick={() => window.innerWidth < 1024 && onClose()}
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${location.pathname === '/settings' ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          <Settings size={20} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
            <UserIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="truncate">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

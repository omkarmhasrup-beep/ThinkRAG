import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Plus, MessageSquare, Database, Settings, LogOut, Trash2, X, Sun, Moon, Search, Pin, Bookmark, Brain, BarChart2, Folder, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const Sidebar = ({ onClose }: { onClose: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  
  const [activeTab, setActiveTab] = useState<'history' | 'collections'>('history');
  const [collections, setCollections] = useState<{ id: string, name: string, chatIds: number[] }[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
    const handleChatCreated = () => fetchChats();
    window.addEventListener('chat-created', handleChatCreated);
    
    const savedPins = localStorage.getItem('pinned_chats');
    if (savedPins) {
      try { setPinnedIds(JSON.parse(savedPins)); } catch(e) {}
    }
    
    const savedCols = localStorage.getItem('chat_collections');
    if (savedCols) {
      try { setCollections(JSON.parse(savedCols)); } catch(e) {}
    }
    
    return () => window.removeEventListener('chat-created', handleChatCreated);
  }, []);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const createChat = async () => {
    try {
      const res = await api.post('/chats', { title: 'New Conversation' });
      setChats([res.data, ...chats]);
      navigate(`/c/${res.data.id}`);
      if (window.innerWidth < 1024) onClose();
    } catch (error) {
      console.error(error);
    }
  };
  
  const deleteChat = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/chats/${id}`);
      setChats(chats.filter(c => c.id !== id));
      if (location.pathname === `/c/${id}`) navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const togglePin = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds(prev => {
      const newPins = prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id];
      localStorage.setItem('pinned_chats', JSON.stringify(newPins));
      return newPins;
    });
  };

  const createCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    const newCol = { id: Date.now().toString(), name: newCollectionName, chatIds: [] };
    const newCols = [...collections, newCol];
    setCollections(newCols);
    localStorage.setItem('chat_collections', JSON.stringify(newCols));
    setNewCollectionName('');
    setIsCreatingCollection(false);
  };

  const deleteCollection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newCols = collections.filter(c => c.id !== id);
    setCollections(newCols);
    localStorage.setItem('chat_collections', JSON.stringify(newCols));
  };

  const handleDropCollection = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!draggedId) return;

    setCollections(prev => {
      const newCols = prev.map(col => {
        if (col.id === collectionId) {
          if (!col.chatIds.includes(draggedId)) {
            return { ...col, chatIds: [...col.chatIds, draggedId] };
          }
        }
        return col;
      });
      localStorage.setItem('chat_collections', JSON.stringify(newCols));
      return newCols;
    });
  };

  const removeFromCollection = (e: React.MouseEvent, collectionId: string, chatId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCollections(prev => {
      const newCols = prev.map(col => {
        if (col.id === collectionId) {
          return { ...col, chatIds: col.chatIds.filter(id => id !== chatId) };
        }
        return col;
      });
      localStorage.setItem('chat_collections', JSON.stringify(newCols));
      return newCols;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (draggedId === targetId) return;

    setPinnedIds(prev => {
      const draggedIdx = prev.indexOf(draggedId);
      const targetIdx = prev.indexOf(targetId);
      if (draggedIdx === -1 || targetIdx === -1) return prev;
      
      const newPins = [...prev];
      newPins.splice(draggedIdx, 1);
      newPins.splice(targetIdx, 0, draggedId);
      
      localStorage.setItem('pinned_chats', JSON.stringify(newPins));
      return newPins;
    });
  };

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const pinnedChats = pinnedIds.map(id => filteredChats.find(c => c.id === id)).filter(Boolean);
  const recentChats = filteredChats.filter(c => !pinnedIds.includes(c.id));

  return (
    <div className="w-[280px] h-full flex flex-col bg-white dark:bg-sidebar-dark text-gray-600 dark:text-gray-300 shadow-xl border-r border-gray-200 dark:border-white/5 relative">
      <button onClick={onClose} className="lg:hidden absolute right-4 top-4 p-1 hover:text-gray-900 dark:text-white">
        <X size={20} />
      </button>
      
      <div className="p-4">
        <button 
          onClick={createChat}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:bg-white/20 transition-all text-gray-900 dark:text-white font-medium py-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm cursor-pointer"
        >
          <Plus size={20} /> New Chat
        </button>
      </div>
      
      <div className="flex px-4 pt-1 mb-2">
        <button 
          onClick={() => setActiveTab('history')} 
          onDragOver={(e) => { e.preventDefault(); setActiveTab('history'); }}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          History
        </button>
        <button 
          onClick={() => setActiveTab('collections')} 
          onDragOver={(e) => { e.preventDefault(); setActiveTab('collections'); }}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'collections' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Collections
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={activeTab === 'history' ? "Search chats..." : "Search collections..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-colors"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {activeTab === 'history' ? (
          <>
            {pinnedChats.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider px-2">Pinned</div>
                <div className="space-y-1">
                  {pinnedChats.map(chat => (
                    <div 
                      key={chat.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, chat.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, chat.id)}
                      onClick={() => {
                        navigate(`/c/${chat.id}`);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${location.pathname === `/c/${chat.id}` ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Pin size={16} className="shrink-0 text-primary" fill="currentColor" />
                        <span className="truncate text-sm font-medium">{chat.title}</span>
                      </div>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => togglePin(e, chat.id)} className="p-1 hover:text-gray-900 dark:hover:text-white" title="Unpin chat"><Pin size={14} /></button>
                        <button onClick={(e) => deleteChat(e, chat.id)} className="p-1 hover:text-red-400 z-10" title="Delete chat"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider px-2">Recent</div>
              <div className="space-y-1">
                {recentChats.map(chat => (
                  <div 
                    key={chat.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, chat.id)}
                    onClick={() => {
                      navigate(`/c/${chat.id}`);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${location.pathname === `/c/${chat.id}` ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare size={16} className="shrink-0 opacity-70" />
                      <span className="truncate text-sm">{chat.title}</span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => togglePin(e, chat.id)} className="p-1 hover:text-gray-900 dark:hover:text-white" title="Pin chat"><Pin size={14} /></button>
                      <button onClick={(e) => deleteChat(e, chat.id)} className="p-1 hover:text-red-400 z-10" title="Delete chat"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {!isCreatingCollection ? (
              <button onClick={() => setIsCreatingCollection(true)} className="w-full flex items-center gap-2 p-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <FolderPlus size={16} /> New Collection
              </button>
            ) : (
              <form onSubmit={createCollection} className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Collection name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 px-1 py-1 text-sm outline-none mb-2 focus:border-primary text-gray-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsCreatingCollection(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
                  <button type="submit" className="text-xs px-2 py-1 bg-primary text-white rounded">Save</button>
                </div>
              </form>
            )}

            <div className="space-y-1">
              {collections.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(col => (
                <div 
                  key={col.id} 
                  className="rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropCollection(e, col.id)}
                >
                  <div 
                    onClick={() => setOpenCollectionId(openCollectionId === col.id ? null : col.id)}
                    className="group flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {openCollectionId === col.id ? <ChevronDown size={14} className="shrink-0"/> : <ChevronRight size={14} className="shrink-0"/>}
                      <Folder size={16} className="shrink-0 text-primary" fill="currentColor" fillOpacity={0.2} />
                      <span className="truncate text-sm font-medium">{col.name}</span>
                    </div>
                    <button onClick={(e) => deleteCollection(e, col.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 z-10" title="Delete collection"><Trash2 size={14} /></button>
                  </div>
                  
                  {openCollectionId === col.id && (
                    <div className="pl-9 pr-2 pb-2 space-y-1">
                      {col.chatIds.length === 0 ? (
                        <div className="text-xs text-gray-400 py-1 italic">Drag chats here to add to collection...</div>
                      ) : (
                        col.chatIds.map(chatId => {
                          const chat = chats.find(c => c.id === chatId);
                          if (!chat) return null;
                          return (
                            <div 
                              key={chat.id} 
                              onClick={() => {
                                navigate(`/c/${chat.id}`);
                                if (window.innerWidth < 1024) onClose();
                              }}
                              className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${location.pathname === `/c/${chat.id}` ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <MessageSquare size={14} className="shrink-0 opacity-70" />
                                <span className="truncate text-xs">{chat.title}</span>
                              </div>
                              <button onClick={(e) => removeFromCollection(e, col.id, chat.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 z-10" title="Remove from collection"><X size={12} /></button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
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
        <div className="mt-2 flex items-center justify-between p-3 bg-black/20 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-gray-900 dark:text-white font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username}</span>
          </div>
          <button onClick={logout} className="p-2 hover:bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

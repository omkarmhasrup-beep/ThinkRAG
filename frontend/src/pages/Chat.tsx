import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Bot, Pencil, Plus, BookmarkPlus, Check, Download, Image as ImageIcon, X as CloseIcon, Maximize2, Loader2, FileType, Copy, RefreshCw, Share, Trash2, Volume2, VolumeX, ThumbsUp, ThumbsDown, FileText, FileSpreadsheet, Presentation, Paperclip, X } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import DocumentViewer from '../components/DocumentViewer';
import RetrievedContextPanel from '../components/RetrievedContextPanel';
import ThinkingIndicator from '../components/ThinkingIndicator';
import SuggestedQuestions from '../components/SuggestedQuestions';
import ModelSelector from '../components/ModelSelector';
import VoiceChat, { AiSpeakingIndicator } from '../components/VoiceChat';
import ExportModal from '../components/ExportModal';
import CodeBlock from '../components/CodeBlock';
import AiConfidenceCard from '../components/AiConfidenceCard';

const TypewriterText = ({ content, isStreaming }: { content: string, isStreaming?: boolean }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    if (displayed.length >= content.length) return;
    
    // Smoothly type out the content that we have received so far
    const timeout = setTimeout(() => {
      setDisplayed(content.slice(0, displayed.length + 2)); // 2 chars at a time for speed
    }, 15);
    
    return () => clearTimeout(timeout);
  }, [content, displayed]);

  // If content suddenly jumps (e.g. stream finishes), let's ensure we eventually catch up
  // but the timeout above will naturally catch up 2 chars at a time.
  // Actually, let's make it catch up faster if it's far behind.
  useEffect(() => {
    if (content.length - displayed.length > 50) {
       setDisplayed(content.slice(0, content.length - 20)); // Jump ahead if falling too far behind
    }
  }, [content]);

  return (
    <>
      <ReactMarkdown
        components={{
          code({node, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            if (!isInline && match) {
              return <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />;
            }
            return <code className={`${className || ''} bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono`} {...props}>{children}</code>;
          }
        } as Components}
      >
        {displayed}
      </ReactMarkdown>
      {(isStreaming || displayed.length < content.length) && (
        <span className="inline-block w-2 h-4 ml-1 align-middle bg-primary animate-pulse opacity-80 rounded-sm" />
      )}
    </>
  );
};

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [bookmarkSuccess, setBookmarkSuccess] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [readingMessageId, setReadingMessageId] = useState<number | null>(null);
  
  // Image Upload State
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [ocrStatus, setOcrStatus] = useState<Record<string, 'scanning' | 'done' | 'failed'>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [docs, setDocs] = useState<File[]>([]);
  const [docProgress, setDocProgress] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string | number, 'up' | 'down' | undefined>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSource, setViewerSource] = useState('');
  const [viewerSnippet, setViewerSnippet] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const fetchMessages = async (idToFetch?: string) => {
    const id = idToFetch || chatId;
    if (!id) return;
    try {
      const res = await api.get(`/messages/${id}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      console.error(error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBookmark = (messageIndex: number, content: string) => {
    const existing = localStorage.getItem('bookmarks');
    const bookmarks = existing ? JSON.parse(existing) : [];
    bookmarks.push({
      id: Date.now().toString(),
      content,
      category: 'General',
      date: new Date().toISOString(),
      chatId: chatId
    });
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    setBookmarkSuccess(messageIndex);
    setTimeout(() => setBookmarkSuccess(null), 2000);
  };

  const handleReadAloud = (messageIndex: number, content: string) => {
    if (readingMessageId === messageIndex) {
      window.speechSynthesis.cancel();
      setReadingMessageId(null);
      return;
    }
    
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => setReadingMessageId(null);
    utterance.onerror = () => setReadingMessageId(null);
    setReadingMessageId(messageIndex);
    window.speechSynthesis.speak(utterance);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;

    let targetChatId = chatId;
    if (!targetChatId) {
      try {
        const res = await api.post('/chats', { title: textToSend.substring(0, 30) || 'New Conversation' });
        targetChatId = res.data.id;
        window.history.replaceState(null, '', `/c/${targetChatId}`);
        window.dispatchEvent(new Event('chat-created'));
      } catch (error) {
        console.error("Failed to create chat", error);
        return;
      }
    }

    const userMessage = { role: 'user', content: textToSend };
    const tempAiMessage = { role: 'ai', content: '', isStreaming: true };
    setMessages(prev => [...prev, userMessage, tempAiMessage]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);
    scrollToBottom();

    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/messages/${targetChatId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'user', content: userMessage.content })
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...tempAiMessage, content: aiContent };
          return newMessages;
        });
        scrollToBottom();
      }
      
      // Mark as complete
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'ai', content: aiContent, isStreaming: false };
        return newMessages;
      });
      await fetchMessages(targetChatId);
    } catch (error) {
      console.error("Failed to generate response", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));
      const docFiles = fileArray.filter(f => !f.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        handleImageSelection(imageFiles);
      }

      if (docFiles.length > 0) {
        handleDocSelection(docFiles);
      }
    }
  };

  const handleDocSelection = (files: File[]) => {
    setDocs(prev => [...prev, ...files]);
    
    // Simulate upload progress for each file
    files.forEach(file => {
      const fileName = file.name;
      setDocProgress(prev => ({ ...prev, [fileName]: 0 }));
      
      const interval = setInterval(() => {
        setDocProgress(prev => {
          const current = prev[fileName] || 0;
          if (current >= 100) {
            clearInterval(interval);
            return { ...prev, [fileName]: 100 };
          }
          return { ...prev, [fileName]: current + Math.floor(Math.random() * 20) + 10 };
        });
      }, 300);
    });

    setUploadingFile(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    api.post(`/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).catch(error => {
      console.error("Upload failed", error);
    }).finally(() => {
      setUploadingFile(false);
    });
  };

  const handleImageSelection = (files: File[]) => {
    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviews(prev => [...prev, url]);
      
      // Mock OCR
      setOcrStatus(prev => ({ ...prev, [url]: 'scanning' }));
      setTimeout(() => {
        setOcrStatus(prev => ({ ...prev, [url]: 'done' }));
      }, 1500 + Math.random() * 2000);
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleEditSubmit = async (msgId: number) => {
    if (!editContent.trim() || !chatId || loading) return;
    setLoading(true);
    setEditingMessageId(null);

    // Find the index of the message we are regenerating
    const targetIdx = messages.findIndex(m => m.id === msgId);
    if (targetIdx !== -1) {
      const newMessages = messages.slice(0, targetIdx);
      const userMessage = { role: 'user', content: editContent, id: msgId };
      const tempAiMessage = { role: 'ai', content: '', isStreaming: true };
      setMessages([...newMessages, userMessage, tempAiMessage]);
    }

    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/messages/${chatId}/${msgId}/regenerate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'user', content: editContent })
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'ai', content: aiContent };
          return newMessages;
        });
        scrollToBottom();
      }
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'ai', content: aiContent, isStreaming: false };
        return newMessages;
      });
      
      await fetchMessages();
    } catch (error) {
      console.error("Failed to edit message", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: number | string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async (aiMsgIdx: number) => {
    let userMsg = null;
    let userMsgIdx = -1;
    for (let i = aiMsgIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i];
        userMsgIdx = i;
        break;
      }
    }

    if (!userMsg || !userMsg.id || !chatId || loading) return;
    setLoading(true);

    const newMessages = messages.slice(0, userMsgIdx);
    const tempAiMessage = { role: 'ai', content: '', isStreaming: true };
    setMessages([...newMessages, userMsg, tempAiMessage]);

    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/messages/${chatId}/${userMsg.id}/regenerate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'user', content: userMsg.content })
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'ai', content: aiContent };
          return newMessages;
        });
        scrollToBottom();
      }
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'ai', content: aiContent, isStreaming: false };
        return newMessages;
      });
      await fetchMessages();
    } catch (error) {
      console.error("Failed to regenerate message", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (content: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Response',
          text: content,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(content);
      alert('Content copied to clipboard for sharing');
    }
  };

  const handleExport = (content: string, id: number | string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFeedback = (id: string | number, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [id]: prev[id] === type ? undefined : type
    }));
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.href.startsWith('rag-source://')) {
      e.preventDefault();
      const url = new URL(anchor.href);
      setViewerSource(url.pathname.replace('//', ''));
      setViewerSnippet(decodeURIComponent(url.searchParams.get('snippet') || ''));
      setViewerOpen(true);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-[#000000]">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 hidden md:block">Active Chat</span>
        </div>
        <ModelSelector />
        <div className="hidden md:flex">
          <button 
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        messages={messages} 
        chatTitle="Current Chat" 
      />

      {!isEmpty && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8" onClick={handleLinkClick}>
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {messages.map((msg, idx) => {
              let cleanContent = msg.content || '';
              let chunks: any[] = [];
              const ragMatch = /```rag-context\n([\s\S]*?)```/.exec(cleanContent);
              if (ragMatch) {
                try {
                  chunks = JSON.parse(ragMatch[1]);
                } catch (e) {}
                cleanContent = cleanContent.replace(ragMatch[0], '').trim();
              }

              const uniqueSources = chunks.reduce((acc: any[], chunk) => {
                if (!acc.find(s => s.source === chunk.source)) {
                  acc.push(chunk);
                }
                return acc;
              }, []);

              const avgConfidence = chunks.length > 0 
                ? Math.round(chunks.reduce((acc, curr) => acc + curr.score, 0) / chunks.length) 
                : 0;

              return (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md relative mt-1">
                    <Bot size={24} className="text-gray-900 dark:text-white" />
                    {msg.isStreaming && (
                      <div className="absolute -bottom-1 right-0 bg-white dark:bg-black rounded-full px-1 shadow">
                        <AiSpeakingIndicator />
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex flex-col gap-2 max-w-[85%] group ${msg.role === 'ai' ? 'w-full' : ''}`}>
                  <div className={`px-6 py-5 rounded-[16px] shadow-[0_4px_30px_rgba(0,0,0,0.05)] ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm shadow-md'
                      : 'bg-white/70 dark:bg-[#1a1a1a]/80 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-bl-sm'
                    }`}>
                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col min-w-[250px] md:min-w-[400px] bg-gray-100 dark:bg-[#2f2f2f] rounded-3xl p-3 shadow-sm border border-gray-200 dark:border-white/10">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-transparent border-none p-2 outline-none focus:ring-0 text-gray-900 dark:text-white text-sm resize-y min-h-[80px]"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-4 py-1.5 text-sm font-medium bg-gray-50 dark:bg-white/5 border border-white/10 hover:bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-full transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditSubmit(msg.id)}
                            className="px-4 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 text-white rounded-full transition-colors cursor-pointer"
                          >
                            Save & Submit
                          </button>
                        </div>
                      </div>
                    ) : msg.role === 'ai' ? (
                      msg.content ? (
                        <div className="flex flex-col w-full">
                          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans mb-2">
                            {msg.isStreaming ? (
                              <TypewriterText content={cleanContent} isStreaming={true} />
                            ) : (
                              <TypewriterText content={cleanContent} isStreaming={false} />
                            )}
                          </div>
                          
                          {/* AI Additions (Cards & Context) */}
                          {!msg.isStreaming && cleanContent && chunks.length > 0 && (
                            <div className="mt-4 flex flex-col gap-3">
                              
                              {/* Sources Card */}
                              <div className="bg-white dark:bg-[#222] border border-gray-100 dark:border-white/5 rounded-xl p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  <FileText size={16} className="text-primary" />
                                  Sources
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {uniqueSources.map((src: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors group/source">
                                      <div className="bg-red-500/10 text-red-500 p-1.5 rounded-md">
                                        <FileType size={16} />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200 group-hover/source:text-primary transition-colors">
                                          {src.source.replace(/^user_\d+_/, '')}
                                        </span>
                                        <span className="text-[10px] text-gray-500">Document</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <RetrievedContextPanel data={chunks} />

                              {/* Metadata Chips */}
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <AiConfidenceCard confidence={avgConfidence} />
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <span>⚡</span> 1.2 sec
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <span>🧠</span> Llama 3
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[11px] font-medium">
                                  <span>📄</span> {uniqueSources.length} Source{uniqueSources.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <ThinkingIndicator />
                      )
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>

                  {/* Message Actions (AI only) */}
                  {msg.role === 'ai' && !msg.isStreaming && (
                    <div className="flex items-center gap-1 mt-1 pl-1 opacity-70 hover:opacity-100 transition-opacity">
                      <button onClick={() => setFeedback(prev => ({ ...prev, [idx]: prev[idx] === 'up' ? undefined : 'up' as any }))} className={`p-1.5 rounded-md transition-colors ${feedback[idx] === 'up' ? 'text-green-500 bg-green-500/10' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}`} title="Helpful"><ThumbsUp size={14} /></button>
                      <button onClick={() => setFeedback(prev => ({ ...prev, [idx]: prev[idx] === 'down' ? undefined : 'down' as any }))} className={`p-1.5 rounded-md transition-colors ${feedback[idx] === 'down' ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}`} title="Not helpful"><ThumbsDown size={14} /></button>
                      <button onClick={() => handleBookmark(idx, msg.content)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors" title="Bookmark">{bookmarkSuccess === idx ? <Check size={14} className="text-green-500"/> : <BookmarkPlus size={14} />}</button>
                      <button onClick={() => handleCopy(idx, msg.content)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors" title="Copy">{copiedId === idx ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}</button>
                      <button onClick={() => sendMessage(msg.content)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors" title="Regenerate"><RefreshCw size={14} /></button>
                      <button onClick={() => handleShare(msg.content)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors" title="Share"><Share size={14} /></button>
                    </div>
                  )}

                  {msg.role === 'user' && editingMessageId !== msg.id && (
                    <div className="flex justify-end gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(msg.id || idx, msg.content)}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-50 dark:bg-white/5 transition-colors rounded cursor-pointer"
                        title={copiedId === (msg.id || idx) ? "Copied!" : "Copy message"}
                      >
                        {copiedId === (msg.id || idx) ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                      </button>
                      <button
                        onClick={() => {
                          if (msg.id) {
                            setEditingMessageId(msg.id);
                            setEditContent(msg.content);
                          }
                        }}
                        className={`p-1.5 transition-colors rounded ${msg.id ? 'text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-50 dark:bg-white/5 cursor-pointer' : 'text-gray-600 dark:text-gray-300 cursor-not-allowed'}`}
                        title="Edit message"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  )}


                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-gray-900 dark:text-white font-bold">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`p-4 bg-transparent w-full ${isEmpty ? 'flex-1 flex flex-col justify-center max-w-4xl mx-auto mb-10' : ''}`}>
        {isEmpty && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-normal tracking-wide text-gray-800 dark:text-[#f3f3f3]">Ready when you are.</h2>
            <SuggestedQuestions onSelect={(q) => sendMessage(q)} />
          </div>
        )}
        
        {/* Image Previews */}
        {previews.length > 0 && (
          <div className="max-w-4xl mx-auto w-full px-4 mb-2">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative group shrink-0 w-24 h-24 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-gray-50 dark:bg-black/20">
                  <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                  
                  {/* OCR Badge */}
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 text-[8px] text-white font-medium">
                    {ocrStatus[preview] === 'scanning' ? (
                      <><Loader2 size={8} className="animate-spin" /> OCR</>
                    ) : (
                      <><FileType size={8} className="text-green-400" /> TEXT</>
                    )}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setZoomedImage(preview)} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors">
                      <Maximize2 size={12} />
                    </button>
                    <button onClick={() => removeImage(idx)} className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors">
                      <CloseIcon size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto w-full px-4 pb-4 sm:pb-6 relative z-10 shrink-0 before:content-[''] before:absolute before:inset-x-0 before:bottom-0 before:h-24 before:bg-gradient-to-t before:from-bg-light dark:before:from-bg-dark before:to-transparent before:-z-10 before:pointer-events-none">
          <div className="relative flex items-end w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-xl hover:shadow-2xl focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all duration-300">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer ml-1 mb-1 relative group/btn"
              title="Upload file or image"
            >
              {uploadingFile ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />}
            </button>
            <VoiceChat 
              onTranscript={(text) => {
                const currentInput = input;
                const newInput = currentInput ? currentInput + ' ' + text : text;
                setInput(newInput);
                sendMessage(newInput);
              }}
              isAiSpeaking={messages.some(m => m.isStreaming)}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message AI..."
              className="flex-1 max-h-[200px] bg-transparent resize-none py-4 px-2 outline-none text-gray-800 dark:text-gray-100 self-center text-[15px]"
              rows={1}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all duration-200 mb-1.5 mr-1.5 shadow-md cursor-pointer"
            >
              <Send size={18} className="pointer-events-none" />
            </button>
          </div>
          <p className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-3 relative z-10">AI can make mistakes. Verify important information.</p>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors">
            <CloseIcon size={24} />
          </button>
          <img src={zoomedImage} alt="Zoomed preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in duration-200" />
        </div>
      )}

      <DocumentViewer 
        isOpen={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        filename={viewerSource} 
        snippet={viewerSnippet} 
      />
    </div>
  );
};

export default Chat;

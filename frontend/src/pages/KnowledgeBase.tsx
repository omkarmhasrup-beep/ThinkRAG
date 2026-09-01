import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, Loader2, CheckCircle2, Database, HardDrive, Clock, FileStack, Binary, Network } from 'lucide-react';
import api from '../services/api';

import AnimatedCounter from '../components/AnimatedCounter';

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/documents/stats');
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get(`/documents`);
      setDocuments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        await api.post(`/documents/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const deleteDocument = async (docId: number) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      fetchStats();
    } catch (error) {
      console.error("Failed to delete document", error);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold mb-2">Global Knowledge Base</h1>
        <p className="text-gray-500">Manage documents used by the AI to answer your questions across ALL chats.</p>
      </div>

      {/* Dashboard Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Files', value: stats?.total_files || 0, icon: FileStack, isNumber: true },
          { label: 'Total Chunks', value: stats?.total_chunks || 0, icon: Binary, isNumber: true },
          { label: 'Embeddings', value: stats?.embeddings || 0, icon: Network, isNumber: true },
          { label: 'Vector DB', value: stats?.vector_database || 'Loading...', icon: Database, isNumber: false },
          { label: 'Storage Used', value: stats?.storage_used || '0 B', icon: HardDrive, isNumber: false },
          { label: 'Last Updated', value: stats?.last_updated ? new Date(stats.last_updated).toLocaleDateString() : 'Never', icon: Clock, isNumber: false },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className="relative overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-purple-600 dark:text-purple-400">
                  <Icon size={16} />
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                  {stat.isNumber ? <AnimatedCounter value={Number(stat.value)} /> : stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-200 dark:border-white/5 shadow-sm">
            <h3 className="font-semibold mb-4">Upload Document</h3>
            
            <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors group">
              <input 
                type="file" 
                accept=".pdf,.txt,.csv,.docx" 
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              />
              <UploadCloud className="mx-auto h-12 w-12 text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors mb-4" />
              <p className="text-sm font-medium mb-1">Click or drag file to upload</p>
              <p className="text-xs text-gray-500">PDF, TXT, DOCX, CSV</p>
            </div>
            
            {uploading && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
                <Loader2 size={16} className="animate-spin" /> Processing & Embedding...
              </div>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-200 dark:border-white/5 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-gray-50 dark:bg-white/5">
              <h3 className="font-semibold">Active Documents</h3>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {documents.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">No documents uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-200 dark:border-white/5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-50 dark:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.filename}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 uppercase">{doc.filetype}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Embedded
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={18} className="pointer-events-none" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default KnowledgeBase;

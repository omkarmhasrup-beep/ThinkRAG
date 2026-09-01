import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Monitor, Moon, Sun, Check, Bot, Sliders, Palette, Database } from 'lucide-react';

const Settings = () => {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'rag'>('appearance');

  // RAG Settings State (Mocked local state, would typically sync with backend/localStorage)
  const [ragSettings, setRagSettings] = useState({
    topK: 5,
    similarityThreshold: 0.75,
    temperature: 0.2,
    chunkSize: 1000,
    chunkOverlap: 200,
    embeddingModel: 'all-MiniLM-L6-v2',
    llmModel: 'llama-3-8b-instruct'
  });

  const handleRagChange = (key: string, value: string | number) => {
    setRagSettings(prev => ({ ...prev, [key]: value }));
  };

  const themes = [
    { id: 'light', name: 'Light Mode', icon: Sun },
    { id: 'dark', name: 'Dark Mode', icon: Moon },
    { id: 'system', name: 'System Default', icon: Monitor },
  ] as const;

  const colors = [
    { id: 'purple', name: 'Purple', bg: 'bg-[#8b5cf6]' },
    { id: 'blue', name: 'Blue', bg: 'bg-[#3b82f6]' },
    { id: 'green', name: 'Green', bg: 'bg-[#10b981]' },
    { id: 'pink', name: 'Pink', bg: 'bg-[#ec4899]' },
  ] as const;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Settings</h1>
        <p className="text-gray-500">Configure appearance and advanced model parameters.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 mb-8">
        <button 
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'appearance' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
        >
          <Palette size={18} /> Appearance
        </button>
        <button 
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rag' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
        >
          <Sliders size={18} /> RAG Configuration
        </button>
      </div>

      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Controls Column */}
          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      theme === t.id 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500'
                    }`}
                  >
                    <t.icon size={24} className="mb-2" />
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Accent Color</h3>
              <div className="flex flex-wrap gap-4">
                {colors.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id as any)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${c.bg} ${
                      accentColor === c.id ? 'ring-4 ring-primary/30 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-lg scale-110' : 'shadow-sm'
                    }`}
                    title={c.name}
                  >
                    {accentColor === c.id && <Check size={20} className="text-white" />}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Live Preview Column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Live Preview</h3>
            <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm min-h-[300px] flex flex-col justify-end space-y-4">
              <div className="flex gap-4 justify-end">
                <div className="px-4 py-3 rounded-2xl bg-primary text-white rounded-tr-sm max-w-[80%] shadow-md">
                  <p>Can you show me how the appearance settings work?</p>
                </div>
              </div>
              <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md">
                  <Bot size={24} className="text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-sm max-w-[80%] shadow-sm">
                  <p className="mb-3">Of course! As you change the theme and accent color on the left, this chat bubble will update in real-time to reflect your choices.</p>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold hover:bg-primary/20 transition-colors">
                      <Check size={14} /> Looks great!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rag' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-6">
            <section className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Database size={20} className="text-primary"/> Retrieval Parameters</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Top K Documents</label>
                    <span className="text-sm font-bold text-primary">{ragSettings.topK}</span>
                  </div>
                  <input type="range" min="1" max="20" step="1" value={ragSettings.topK} onChange={(e) => handleRagChange('topK', parseInt(e.target.value))} className="w-full accent-primary" />
                  <p className="text-xs text-gray-500 mt-1">Number of chunks to retrieve from the vector database.</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Similarity Threshold</label>
                    <span className="text-sm font-bold text-primary">{ragSettings.similarityThreshold}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={ragSettings.similarityThreshold} onChange={(e) => handleRagChange('similarityThreshold', parseFloat(e.target.value))} className="w-full accent-primary" />
                  <p className="text-xs text-gray-500 mt-1">Minimum similarity score (cosine) required to include a document.</p>
                </div>
              </div>
            </section>

            <section className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Bot size={20} className="text-primary"/> Generation Parameters</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Temperature</label>
                    <span className="text-sm font-bold text-primary">{ragSettings.temperature}</span>
                  </div>
                  <input type="range" min="0" max="2" step="0.1" value={ragSettings.temperature} onChange={(e) => handleRagChange('temperature', parseFloat(e.target.value))} className="w-full accent-primary" />
                  <p className="text-xs text-gray-500 mt-1">Controls randomness. Lower is more deterministic.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Sliders size={20} className="text-primary"/> Models & Indexing</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LLM Model</label>
                  <select value={ragSettings.llmModel} onChange={(e) => handleRagChange('llmModel', e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-all shadow-sm cursor-pointer">
                    <option value="llama-3-8b-instruct">Llama 3 (8B)</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="mistral-large">Mistral Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Embedding Model</label>
                  <select value={ragSettings.embeddingModel} onChange={(e) => handleRagChange('embeddingModel', e.target.value)} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-all shadow-sm cursor-pointer">
                    <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (Fast)</option>
                    <option value="bge-m3">BGE-M3 (Multilingual)</option>
                    <option value="text-embedding-3-small">OpenAI text-embedding-3</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-white/10 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chunk Size</label>
                    <select value={ragSettings.chunkSize} onChange={(e) => handleRagChange('chunkSize', parseInt(e.target.value))} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-all shadow-sm cursor-pointer">
                      <option value="500">500 tokens</option>
                      <option value="1000">1000 tokens</option>
                      <option value="2000">2000 tokens</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chunk Overlap</label>
                    <select value={ragSettings.chunkOverlap} onChange={(e) => handleRagChange('chunkOverlap', parseInt(e.target.value))} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary text-gray-900 dark:text-white transition-all shadow-sm cursor-pointer">
                      <option value="50">50 tokens</option>
                      <option value="100">100 tokens</option>
                      <option value="200">200 tokens</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

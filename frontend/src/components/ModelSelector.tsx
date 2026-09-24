import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Brain, Bot, Cpu, Check, Activity, Award, Loader2, LayoutGrid } from 'lucide-react';


interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  speed: number;
  quality: number;
  context: string;
  description: string;
  recommended: boolean;
}

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  'Google (Gemini)': Sparkles,
  'Meta (Groq)': Bot,
  'Google (Groq)': Zap,
  'Moonshot AI (Groq)': Sparkles,
  'DeepSeek (Groq)': Brain,
  'Qwen (Groq)': Sparkles,
  'OpenAI (Groq)': Brain,
  'Groq': Zap,
};

const PROVIDER_COLORS: Record<string, { color: string; bg: string }> = {
  'Google (Gemini)': { color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'Meta (Groq)': { color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'Google (Groq)': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'Moonshot AI (Groq)': { color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  'DeepSeek (Groq)': { color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  'Qwen (Groq)': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'OpenAI (Groq)': { color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'Groq': { color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

const HARDCODED_MODELS: ModelInfo[] = [
  { id: 'qwen/qwen3.8-27b', name: 'Qwen 27B', provider: 'Qwen (Groq)', speed: 95, quality: 90, context: '32K', description: 'Fast and smart general purpose model', recommended: true },
  { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', provider: 'OpenAI (Groq)', speed: 75, quality: 95, context: '128K', description: 'Very large and capable model', recommended: false },
  { id: 'allam-2-7b', name: 'Allam 2 7B', provider: 'Meta (Groq)', speed: 99, quality: 80, context: '8K', description: 'Extremely fast, lightweight model', recommended: false },
];

const ModelSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [models] = useState<ModelInfo[]>(HARDCODED_MODELS);
  const [selected, setSelected] = useState<ModelInfo | null>(null);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Try loading from localStorage first
    const savedModelId = localStorage.getItem('selectedModelId');
    if (savedModelId) {
      const found = HARDCODED_MODELS.find(m => m.id === savedModelId);
      if (found) setSelected(found);
      else setSelected(HARDCODED_MODELS[0]);
    } else {
      setSelected(HARDCODED_MODELS[0]);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchModel = async (model: ModelInfo) => {
    if (model.id === selected?.id) { setIsOpen(false); return; }
    setSwitching(true);
    
    localStorage.setItem('selectedModelId', model.id);
    setSelected(model);
    
    // Slight artificial delay for UX
    setTimeout(() => {
      setSwitching(false);
      setIsOpen(false);
    }, 300);
  };

  const getIcon = (provider: string) => PROVIDER_ICONS[provider] || Cpu;
  const getColors = (provider: string) => PROVIDER_COLORS[provider] || { color: 'text-gray-500', bg: 'bg-gray-500/10' };

  if (!selected) return null;

  const SelectedIcon = getIcon(selected.provider);
  const selectedColors = getColors(selected.provider);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl transition-all shadow-sm"
      >
        {switching ? (
          <Loader2 size={14} className="animate-spin text-primary" />
        ) : (
          <div className={`p-1 rounded-md ${selectedColors.bg} ${selectedColors.color}`}>
            <SelectedIcon size={14} />
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">{selected.name}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-[340px] bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
            <LayoutGrid size={14} className="text-primary" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select AI Model</p>
            <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">Gemini & Groq • Instant</span>
          </div>
          <div className="p-2 max-h-[420px] overflow-y-auto space-y-1">
            {models.map((model) => {
              const Icon = getIcon(model.provider);
              const colors = getColors(model.provider);
              const isActive = selected.id === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => switchModel(model)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-2 relative overflow-hidden group ${
                    isActive
                      ? 'bg-primary/5 border border-primary/20'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg} ${colors.color} shrink-0`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                          {model.name}
                          {model.recommended && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Fastest</span>
                          )}
                          {isActive && <Check size={13} className="text-primary" />}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate">{model.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2 mt-0.5">{model.context}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><Activity size={9}/> Speed</span>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${model.speed}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><Award size={9}/> Quality</span>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${model.quality}%` }} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t border-gray-100 dark:border-white/5">
            <p className="text-[10px] text-gray-400 text-center">Powered by <span className="text-primary font-medium">Google Gemini</span> & Cloud Inference</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;

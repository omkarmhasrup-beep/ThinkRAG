import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Brain, Bot, Cpu, Check, Activity, Award, Coins } from 'lucide-react';

const MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', icon: Sparkles, color: 'text-green-500', bg: 'bg-green-500/10', speed: 60, quality: 95, cost: '$$$' },
  { id: 'claude-3', name: 'Claude 3.5', provider: 'Anthropic', icon: Brain, color: 'text-orange-500', bg: 'bg-orange-500/10', speed: 70, quality: 98, cost: '$$' },
  { id: 'gemini', name: 'Gemini 1.5', provider: 'Google', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', speed: 90, quality: 90, cost: '$$' },
  { id: 'llama-3', name: 'Llama 3', provider: 'Meta (Local)', icon: Bot, color: 'text-purple-500', bg: 'bg-purple-500/10', speed: 85, quality: 85, cost: 'Free' },
  { id: 'deepseek', name: 'DeepSeek', provider: 'DeepSeek', icon: Cpu, color: 'text-indigo-500', bg: 'bg-indigo-500/10', speed: 80, quality: 92, cost: '$' }
];

const ModelSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(MODELS[3]); // Default to Llama (Local) since it's a local RAG
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl transition-all shadow-sm"
      >
        <div className={`p-1 rounded-md ${selected.bg} ${selected.color}`}>
          <selected.icon size={14} />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{selected.name}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-[320px] bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-gray-100 dark:border-white/5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select AI Model</p>
          </div>
          <div className="p-2 max-h-[400px] overflow-y-auto space-y-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => { setSelected(model); setIsOpen(false); }}
                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-2 relative overflow-hidden group ${
                  selected.id === model.id 
                    ? 'bg-primary/5 border border-primary/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${model.bg} ${model.color}`}>
                      <model.icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {model.name}
                        {selected.id === model.id && <Check size={14} className="text-primary" />}
                      </h4>
                      <p className="text-xs text-gray-500">{model.provider}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-2 relative z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Activity size={10}/> Speed</span>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${model.speed}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Award size={10}/> Quality</span>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${model.quality}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><Coins size={10}/> Cost</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{model.cost}</span>
                  </div>
                </div>

                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;

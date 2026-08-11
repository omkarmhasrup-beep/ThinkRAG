import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface Chunk {
  chunk_id: number;
  source: string;
  score: number;
  content: string;
}

interface RetrievedContextPanelProps {
  data: Chunk[]; 
}

const RetrievedContextPanel: React.FC<RetrievedContextPanelProps> = ({ data }) => {
  const [panelOpen, setPanelOpen] = useState(false);

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-4 mb-2">
      {/* Panel Header */}
      <button 
        onClick={() => setPanelOpen(!panelOpen)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors"
      >
        {panelOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        View Retrieved Context
      </button>

      {/* Accordion Content */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${panelOpen ? 'max-h-[800px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pl-6 border-l-2 border-gray-200 dark:border-white/10 flex flex-col gap-4">
          {data.map((chunk, idx) => (
            <div key={idx}>
              <pre className="text-[13px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed font-sans">
                {chunk.content}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RetrievedContextPanel;

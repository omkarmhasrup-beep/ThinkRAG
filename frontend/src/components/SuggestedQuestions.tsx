import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  "Summarize my recently uploaded documents",
  "What are the key takeaways from the reports?",
  "Find any actionable items in my notes",
  "Explain the core concepts from the knowledge base"
];

const SuggestedQuestions: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-6 mt-6 w-full max-w-3xl mx-auto px-4">
      {SUGGESTIONS.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-[#2a2a2a]/60 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:border-primary/50 hover:text-primary dark:hover:text-purple-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow hover:-translate-y-0.5"
        >
          <Sparkles size={14} className="text-primary dark:text-purple-400" />
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;

import { useState, useEffect } from 'react';
import { Search, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

const ThinkingIndicator = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Simulate the thinking steps
    const timer1 = setTimeout(() => setStep(1), 1500); // After 1.5s, move to Retrieving
    const timer2 = setTimeout(() => setStep(2), 3500); // After 3.5s, move to Generating

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const steps = [
    { id: 0, label: 'Searching Knowledge Base...', icon: Search },
    { id: 1, label: 'Retrieving Documents...', icon: FileText },
    { id: 2, label: 'Generating Response...', icon: Sparkles }
  ];

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm py-2">
      {steps.map((s, index) => {
        const isActive = step === index;
        const isPast = step > index;
        const Icon = isPast ? CheckCircle2 : s.icon;

        return (
          <div 
            key={s.id} 
            className={`flex items-center gap-3 transition-all duration-500 ${
              isActive ? 'opacity-100 translate-y-0' : 
              isPast ? 'opacity-60 translate-y-0' : 
              'opacity-0 translate-y-4 hidden' // Hide future steps completely until they are active
            } ${!isActive && !isPast ? '!h-0 !overflow-hidden' : ''}`}
          >
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
              isActive ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 
              isPast ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 
              'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              <Icon size={16} className={`${isActive && s.id !== 2 ? 'animate-pulse' : ''} ${isActive && s.id === 2 ? 'animate-spin-slow' : ''}`} />
              
              {isActive && (
                <span className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" style={{ animationDuration: '2s' }}></span>
              )}
            </div>
            
            <span className={`text-sm font-medium ${
              isActive ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400' : 
              isPast ? 'text-gray-500 dark:text-gray-400' : 
              'text-gray-400'
            }`}>
              {s.label}
            </span>
          </div>
        );
      })}

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full mt-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 ease-out"
          style={{ width: `${(step + 1) * 33.33}%` }}
        />
      </div>
    </div>
  );
};

export default ThinkingIndicator;

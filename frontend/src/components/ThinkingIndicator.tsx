import React from 'react';

const ThinkingIndicator = () => {
  return (
    <div className="flex items-center gap-1.5 py-3 px-2 text-gray-500 dark:text-gray-400">
      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

export default ThinkingIndicator;

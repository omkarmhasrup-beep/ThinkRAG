import React from 'react';

interface Props {
  confidence: number; // 0 to 100
}

const AiConfidenceCard: React.FC<Props> = ({ confidence }) => {
  let status = 'Low';
  let colorClass = 'text-red-500 bg-red-500/10 border-red-500/20';
  let icon = '🔴';

  if (confidence >= 80) {
    status = 'High';
    colorClass = 'text-green-500 bg-green-500/10 border-green-500/20';
    icon = '🟢';
  } else if (confidence >= 50) {
    status = 'Medium';
    colorClass = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    icon = '🟡';
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${colorClass} cursor-help transition-opacity hover:opacity-80`}
      title={`${confidence}% confidence based on retrieved context`}
    >
      <span>{icon}</span>
      <span>{status}</span>
    </div>
  );
};

export default AiConfidenceCard;

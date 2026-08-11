import React, { useState } from 'react';
import { X, FileText, FileCode, File, Download, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  chatTitle: string;
}

const FORMATS = [
  { id: 'md', name: 'Markdown', icon: FileCode, desc: 'Best for developers', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'txt', name: 'Plain Text', icon: FileText, desc: 'Simple text format', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  { id: 'pdf', name: 'PDF Document', icon: File, desc: 'Best for sharing', color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'docx', name: 'Word Document', icon: FileText, desc: 'Editable document', color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

const ExportModal: React.FC<Props> = ({ isOpen, onClose, messages, chatTitle }) => {
  const [selectedFormat, setSelectedFormat] = useState('md');
  const [status, setStatus] = useState<'idle' | 'exporting' | 'success'>('idle');
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleExport = () => {
    setStatus('exporting');
    setProgress(0);

    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setStatus('success');
          downloadFile();
          setTimeout(() => {
            onClose();
            setTimeout(() => {
              setStatus('idle');
              setProgress(0);
            }, 300);
          }, 1500);
          return 100;
        }
        return p + Math.floor(Math.random() * 20);
      });
    }, 200);
  };

  const downloadFile = () => {
    let content = '';
    if (selectedFormat === 'md') {
      content = `# ${chatTitle}\n\n`;
      messages.forEach(m => {
        content += `### ${m.role === 'user' ? 'You' : 'AI'}\n${m.content}\n\n`;
      });
    } else {
      content = `${chatTitle.toUpperCase()}\n\n`;
      messages.forEach(m => {
        content += `[${m.role === 'user' ? 'You' : 'AI'}]:\n${m.content}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${selectedFormat === 'md' ? 'md' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Export Conversation</h2>
        <p className="text-sm text-gray-500 mb-6">Save your chat history to your device.</p>

        {status === 'idle' ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormat(f.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedFormat === f.id 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                      : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${f.bg} ${f.color}`}>
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{f.name}</h3>
                    <p className="text-[10px] text-gray-500">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-md"
            >
              <Download size={18} /> Download
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            {status === 'exporting' ? (
              <>
                <Loader2 size={40} className="text-primary animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Generating file...</h3>
                <div className="w-full h-2 bg-gray-100 dark:bg-black/20 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary transition-all duration-200 ease-out" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-500">{progress}% complete</p>
              </>
            ) : (
              <>
                <CheckCircle2 size={48} className="text-green-500 mb-4 animate-in zoom-in duration-300" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Complete!</h3>
                <p className="text-sm text-gray-500 text-center mt-2">Your file has been saved to your device.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportModal;

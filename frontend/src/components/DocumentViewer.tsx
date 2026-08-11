import React, { useEffect, useState, useRef } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  snippet?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ isOpen, onClose, filename, snippet }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && filename) {
      fetchContent();
    } else {
      setContent('');
      setError('');
    }
  }, [isOpen, filename]);

  useEffect(() => {
    // Scroll to the highlighted element when content is rendered
    if (content && snippet && contentRef.current) {
      setTimeout(() => {
        const mark = contentRef.current?.querySelector('mark');
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [content, snippet]);

  const fetchContent = async () => {
    setLoading(true);
    setError('');
    try {
      // Decode filename as it might be URL encoded
      const decodedFilename = decodeURIComponent(filename);
      // Fallback: If filename is empty or weird, try to parse from the full URL if passed differently
      const actualName = decodedFilename.split('/').pop() || decodedFilename;
      
      const response = await api.get(`/documents/content?filename=${encodeURIComponent(actualName)}`);
      setContent(response.data.content);
    } catch (err) {
      console.error(err);
      setError('Failed to load document content. It might have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Highlight logic: simple substring replacement
  // Because snippet might have slight variations (whitespace, truncated), 
  // we try to highlight the exact snippet, or a large chunk of it.
  const renderHighlightedContent = () => {
    if (!snippet) return content;
    
    // Normalize newlines and spaces for matching
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedSnippet = snippet.replace(/\r\n/g, '\n').trim();
    
    if (!normalizedSnippet) return content;

    const index = normalizedContent.indexOf(normalizedSnippet);
    if (index !== -1) {
      const before = normalizedContent.substring(0, index);
      const match = normalizedContent.substring(index, index + normalizedSnippet.length);
      const after = normalizedContent.substring(index + normalizedSnippet.length);
      return (
        <>
          {before}
          <mark className="bg-yellow-200 dark:bg-yellow-500/40 text-black dark:text-white rounded px-1 py-0.5">{match}</mark>
          {after}
        </>
      );
    }

    // Fallback: Try matching first 50 chars if exact match fails due to truncation
    const shortSnippet = normalizedSnippet.substring(0, 50);
    const shortIndex = normalizedContent.indexOf(shortSnippet);
    if (shortIndex !== -1 && shortSnippet.length >= 10) {
      const before = normalizedContent.substring(0, shortIndex);
      const match = normalizedContent.substring(shortIndex, shortIndex + shortSnippet.length);
      const after = normalizedContent.substring(shortIndex + shortSnippet.length);
      return (
        <>
          {before}
          <mark className="bg-yellow-200 dark:bg-yellow-500/40 text-black dark:text-white rounded px-1 py-0.5">{match}</mark>
          {after}
        </>
      );
    }

    return content;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-sm" title={decodeURIComponent(filename)}>
                {decodeURIComponent(filename).split('/').pop()}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Extracted Text View</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#1a1a1a]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p>Loading document text...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500 p-8 text-center bg-red-50 dark:bg-red-500/10 rounded-xl">
              <p>{error}</p>
            </div>
          ) : (
            <div 
              ref={contentRef}
              className="prose prose-sm md:prose-base dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {renderHighlightedContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;

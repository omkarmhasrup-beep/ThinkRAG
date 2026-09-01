import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface VoiceChatProps {
  onTranscript: (text: string) => void;
  isAiSpeaking: boolean;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ onTranscript, isAiSpeaking }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // We could make this dynamic

      recognition.onstart = () => {
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        stopRecording();
      };

      recognition.onend = () => {
        // If we were manually stopped, don't auto-restart
        if (status === 'listening') {
          // Sometimes it stops automatically on silence
          stopRecording();
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch(e) {}
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    setTranscript('');
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch(e) {
      console.error(e);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setStatus('processing');
    try {
      recognitionRef.current?.stop();
    } catch(e) {}
    
    // Simulate slight processing delay before sending
    setTimeout(() => {
      if (transcript.trim()) {
        onTranscript(transcript);
      }
      setIsRecording(false);
      setStatus('idle');
      setTranscript('');
    }, 500);
  };

  return (
    <>
      <button
        onClick={startRecording}
        className="w-10 h-10 flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
        title="Voice Input"
      >
        <Mic size={20} />
      </button>

      {/* Voice Recording Overlay */}
      {isRecording && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center gap-6 border border-gray-200 dark:border-white/10 scale-in-center">
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-primary/30">
                <Mic size={32} />
              </div>
            </div>

            <div className="text-center w-full">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {status === 'listening' ? 'Listening...' : 'Processing...'}
              </h3>
              
              <div className="min-h-[60px] bg-gray-50 dark:bg-black/20 rounded-xl p-3 flex items-center justify-center border border-gray-100 dark:border-white/5">
                <p className="text-sm text-gray-600 dark:text-gray-300 italic text-center w-full break-words line-clamp-3">
                  {transcript || "Speak now..."}
                </p>
              </div>
            </div>

            {/* Waveform Animation */}
            {status === 'listening' ? (
              <div className="flex items-end gap-1.5 h-10 w-full justify-center">
                {[...Array(9)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-primary/80 rounded-t-full origin-bottom animate-waveform" 
                    style={{ 
                      height: '20%', 
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${0.5 + (Math.random() * 0.5)}s`
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            )}

            <button 
              onClick={stopRecording}
              className="mt-2 flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors cursor-pointer shadow-md shadow-red-500/20"
            >
              <Square size={16} fill="currentColor" /> Stop Recording
            </button>
          </div>
        </div>
      )}

      {/* Global CSS for waveforms */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes waveform {
          0% { height: 20%; }
          50% { height: 100%; }
          100% { height: 20%; }
        }
        .animate-waveform {
          animation: waveform 0.8s ease-in-out infinite;
        }
        @keyframes ai-wave {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .ai-speaking-bar {
          animation: ai-wave 1s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}} />
    </>
  );
};

export const AiSpeakingIndicator = () => (
  <div className="flex items-end gap-[3px] h-4 ml-3 opacity-80">
    <div className="w-1 bg-primary rounded-full ai-speaking-bar" style={{ animationDelay: '0.0s' }} />
    <div className="w-1 bg-primary rounded-full ai-speaking-bar" style={{ animationDelay: '0.2s' }} />
    <div className="w-1 bg-primary rounded-full ai-speaking-bar" style={{ animationDelay: '0.4s' }} />
    <div className="w-1 bg-primary rounded-full ai-speaking-bar" style={{ animationDelay: '0.1s' }} />
  </div>
);

export default VoiceChat;

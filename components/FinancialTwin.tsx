import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { chatWithTwin } from '../services/ai';
import { MessageCircle, X, Send } from 'lucide-react';

const FinancialTwin: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: `Hello ${user.name}! I'm here to help with your investment questions.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newHistory = [...messages, { role: 'user' as const, text: input }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    const reply = await chatWithTwin(newHistory, user);
    setMessages([...newHistory, { role: 'model', text: reply }]);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-all hover:scale-105 z-50 flex items-center space-x-2"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-[450px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-fade-in-up h-[600px] max-h-[85vh]">
      {/* Simple Header */}
      <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold tracking-tight">AI Financial Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:text-slate-300 transition-colors"><X size={20} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
            }`}>
              <div className="break-words whitespace-pre-wrap min-w-0">
                 {m.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-200 px-4 py-2 rounded-full text-xs text-slate-500 animate-pulse font-medium">
                Thinking...
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center space-x-3 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about risks, scams, or investing..."
          className="flex-1 bg-slate-100 border-transparent focus:border-blue-500 focus:bg-white rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default FinancialTwin;
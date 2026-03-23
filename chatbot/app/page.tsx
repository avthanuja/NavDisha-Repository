'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { 
  Send, ArrowLeft, MoreVertical,
  ChevronRight, Search, Activity, 
  MapPin, Stethoscope, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavDishaChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const quickActions = [
    { label: 'Find a doctor', icon: <Stethoscope size={14} /> },
    { label: 'Nearby clinics', icon: <MapPin size={14} /> },
    { label: 'Urgent care', icon: <Activity size={14} /> },
    { label: 'About services', icon: <Info size={14} /> }
  ];

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="glass-header flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-4">
          <button className="text-orange-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-orange-500">Chat Assistant</h1>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="messages-container flex flex-col gap-8 flex-1"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <div className="mt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  N
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-gray-900">NavDisha</span>
                  <p className="text-[10px] text-gray-400">your healthcare bestie</p>
                  <div className="message-bubble message-bot mt-1">
                    Hey! 👋 How are you actually doing today?
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {m.role === 'assistant' ? (
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    N
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-gray-900">NavDisha</span>
                    <div className="message-bubble message-bot mt-1">
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end max-w-[85%]">
                  <div className="message-bubble message-user">
                    {m.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 mr-1">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓
                  </span>
                </div>
              )}
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                N
              </div>
              <div className="message-bubble message-bot">
                <div className="flex gap-1 py-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Area */}
      <div className="input-area border-t shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {/* Quick Actions Scrollable */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => setInput(action.label)}
              className="pill-button flex items-center gap-2"
            >
              <span className="text-orange-500">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={`Message NavDisha...`}
            className="search-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 disabled:opacity-20 transition-all shadow-lg shadow-orange-500/20"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

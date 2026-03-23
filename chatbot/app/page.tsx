'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { 
  Send, Bot, User, Stethoscope, Sparkles,
  Search, Info, Menu, MoreVertical, Plus,
  Hash, Command, ShieldCheck, Heart, 
  Settings, LogOut, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavDishaChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const suggestions = [
    "Find practitioners in Auckland",
    "Who are the specialist practitioners?",
    "Clinics with wheelchair access?",
    "Urgent care contact details"
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden md:flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                <Stethoscope size={18} strokeWidth={2.5} />
              </div>
              <span className="font-heading font-bold text-white text-lg tracking-tight">Nav-Disha</span>
            </div>

            <div className="flex-1 px-4 py-2 overflow-y-auto space-y-6">
              <div>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group">
                  <Plus size={18} className="text-white/60 group-hover:text-white transition-colors" />
                  <span className="text-sm font-medium">New Conversation</span>
                </button>
              </div>

              <div className="space-y-1">
                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Suggestions</p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left group"
                  >
                    <Hash size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-sm truncate">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-all">
                <Settings size={18} />
                <span className="text-sm font-medium">Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-all text-red-400">
                <LogOut size={18} />
                <span className="text-sm font-medium">Clear Chat</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="chat-main">
        {/* Top Header */}
        <header className="glass-header">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-slate-900 leading-none mb-1 flex items-center gap-2">
                AI Health Assistant
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Always Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck size={12} className="text-emerald-500" />
              Verified Repository
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <MoreVertical size={20} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="messages-container flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto mt-20">
              <div className="w-20 h-20 rounded-[32px] bg-indigo-50 flex items-center justify-center text-indigo-500 mb-8 relative">
                <Bot size={40} />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
                >
                  <Sparkles size={12} className="text-amber-500" />
                </motion.div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">How can I assist your health search?</h2>
              <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                I'm your dedicated Nav-Disha assistant. Ask me about specialists, clinics, contact details, or accessibility features.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-sm font-medium text-left flex items-center justify-between group"
                  >
                    {s}
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl w-full mx-auto flex flex-col gap-6 h-full pb-20">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`message-bubble ${m.role === 'user' ? 'message-user' : 'message-bot'}`}>
                      <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                        {m.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 p-3 bg-white border border-slate-100 w-fit rounded-2xl shadow-sm self-start ml-10">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="input-container">
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute left-6 inset-y-0 flex items-center pointer-events-none">
                <Command size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Message your health assistant..."
                className="w-full h-[64px] pl-14 pr-32 rounded-[24px] bg-slate-100/50 border border-slate-200/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 outline-none shadow-sm"
              />
              <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="h-[48px] px-6 bg-indigo-600 text-white rounded-[18px] flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale transition-all font-bold text-sm shadow-lg shadow-indigo-600/20"
                >
                  Send
                  <Send size={16} />
                </button>
              </div>
            </form>
            <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><Heart size={12} className="text-rose-500" /> Human Centered</div>
              <div className="flex items-center gap-1.5"><Search size={12} className="text-indigo-500" /> Smart Discovery</div>
              <div className="flex items-center gap-1.5 text-slate-300">|</div>
              <div className="hidden sm:flex items-center gap-1.5 italic font-normal normal-case">Press Enter to send</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

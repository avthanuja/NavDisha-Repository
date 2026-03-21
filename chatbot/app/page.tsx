'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Stethoscope, Search, Info, Settings, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'initial',
        role: 'assistant',
        content: "👋 Hello! I'm the NavDisha Healthcare Assistant. I can help you find details about healthcare services and practitioners from our database. What can I help you find today?",
      },
    ],
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 opacity-20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400 opacity-20 blur-[120px] rounded-full" />
      
      <div className="flex flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 gap-8 relative z-10">
        
        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:flex w-80 flex-col gap-6 bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-900/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">NavDisha</h1>
          </div>
          
          <div className="mt-8 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">Knowledge Hub</p>
            <div className="space-y-1">
              {[
                { icon: Search, label: 'Search Clinics', active: true },
                { icon: Info, label: 'How it works', active: false },
                { icon: Settings, label: 'Settings', active: false },
              ].map((item, i) => (
                <button 
                  key={i}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-300 ${
                    item.active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/25' : 'text-slate-600 hover:bg-white/80'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-blue-950 text-sm">Example Queries:</h3>
            <ul className="mt-3 space-y-2.5 text-xs text-blue-800/80 font-medium">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                "Who are the practitioners for Caring Clinic Doctors?"
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                "Find doctors at The Fono - Central"
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                "List practitioners for Wintec Health Services"
              </li>
            </ul>
          </div>
        </aside>

        {/* Chat Main Area */}
        <main className="flex-1 flex flex-col bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-blue-900/5 overflow-hidden">
          
          {/* Header */}
          <header className="px-8 py-6 border-b border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-full flex items-center justify-center text-white shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Healthpoint AI Assistant</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Online & Knowledge-ready</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Moon className="w-5 h-5" />
               </button>
            </div>
          </header>

          {/* Messages Container */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth"
          >
            <AnimatePresence mode="popLayout">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border text-blue-600'
                  }`}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`group relative max-w-[80%] px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm transition-all duration-300 ${
                    m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-white/50 rounded-tl-none hover:bg-white/80'
                  }`}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.role === 'assistant' && (
                      <div className="absolute -bottom-5 left-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400 font-medium">
                        Just now • Reference: Service Database
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && messages[messages.length - 1].role === 'user' && (
               <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-blue-600 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white/50 px-5 py-3 rounded-2xl flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <footer className="p-6 md:p-8 bg-blue-50/30 border-t border-white/20">
            <form 
              onSubmit={handleSubmit}
              className="relative max-w-4xl mx-auto"
            >
              <div className="relative group">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about practitioners (e.g., practitioners for Caring Clinic Doctors)..."
                  className="w-full bg-white border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-6 py-5 pr-16 outline-none shadow-xl shadow-blue-900/5 transition-all duration-300 placeholder:text-slate-400 placeholder:font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:translate-y-0 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-300 transform"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Powered by Gemini AI • Direct CSV Integration
              </p>
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
}

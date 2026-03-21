'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { 
  Send, Bot, User, Stethoscope, Search, Info, 
  MapPin, Phone, Mail, ArrowRight, Sparkles,
  Heart, Activity, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavDishaHub() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const categories = [
    { 
      title: 'Auckland Services', 
      desc: 'Top-rated clinics and doctors in the Auckland region.', 
      icon: <MapPin className="text-blue-500" />,
      query: 'List practitioners in Auckland'
    },
    { 
      title: 'Specialists', 
      desc: 'Find dermatologists, dentists, and radiologists.', 
      icon: <Stethoscope className="text-teal-500" />,
      query: 'Who are the specialist practitioners available?'
    },
    { 
      title: 'Emergency Contacts', 
      desc: 'Direct phone lines and emails for urgent care.', 
      icon: <Activity className="text-rose-500" />,
      query: 'What are the contact details for urgent care services?'
    },
    { 
      title: 'Accessibility', 
      desc: 'Services with full wheelchair and disabled access.', 
      icon: <ShieldCheck className="text-emerald-500" />,
      query: 'Which clinics have wheelchair access?'
    }
  ];

  const handleCardClick = (query: string) => {
    setInput(query);
    document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-slate-900 selection:bg-blue-100">
      
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-20 border-b border-slate-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent -z-10" />
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Health Directory</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"
          >
            Nav-Disha Knowledge Hub
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed"
          >
            Explore structured insights, practitioners, and healthcare guidance in one unified platform. Powered by real-time data and AI assistance.
          </motion.p>
          
          {/* Main Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-2xl relative group"
          >
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search for a clinic or ask a question..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCardClick(searchTerm)}
              className="w-full h-16 pl-14 pr-32 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/40 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-lg"
            />
            <button 
              onClick={() => handleCardClick(searchTerm)}
              className="absolute right-3 top-3 h-10 px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Explore Categories</h2>
            <p className="text-slate-500">Quickly find the most requested information from our database.</p>
          </div>
          <button className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
            View all categories <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer group"
              onClick={() => handleCardClick(cat.query)}
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-50 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">{cat.title}</h3>
              <p className="text-sm text-slate-500 mb-6">{cat.desc}</p>
              <div className="text-xs font-bold text-blue-600 tracking-wider uppercase">Explore →</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Chatbot Section */}
      <section id="chat-section" className="px-6 py-20 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Nav-Disha Assistant</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Our AI assistant can help you cross-reference doctors, services, and location details in seconds.</p>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-blue-900/5 overflow-hidden flex flex-col h-[700px]">
            {/* Chat Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Bot className="w-16 h-16 mb-4 text-blue-600" />
                  <p className="text-lg font-medium">How can I help you today?</p>
                </div>
              )}
              <AnimatePresence>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`max-w-[75%] px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex gap-2 p-4 bg-slate-50 w-fit rounded-2xl animate-pulse">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-8 border-t border-slate-100 bg-white">
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask the assistant anything..."
                  className="w-full h-16 pl-6 pr-16 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-3 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><Heart className="w-3 h-3 text-rose-500" /> Human Centered</div>
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified Data</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20 text-white">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Nav-Disha</span>
        </div>
        <p className="text-slate-400 text-sm">© 2026 Nav-Disha Healthcare Repository. All rights reserved.</p>
      </footer>
    </div>
  );
}

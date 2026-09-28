import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import chatApi from '../services/chatApi';
import { useAuth } from '../context/AuthContext';
import ChatActionPill from '../components/ChatActionPill';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Compass,
  Luggage,
  Hotel,
  CalendarCheck,
  RotateCcw,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Bot
} from 'lucide-react';

const STARTER_PROMPTS = [
  {
    icon: <Luggage className="w-4 h-4 text-teal-600" />,
    title: 'Popular Holiday Packages',
    prompt: 'Show me your top recommended holiday packages and itineraries.'
  },
  {
    icon: <Compass className="w-4 h-4 text-teal-600" />,
    title: 'Explore Destinations',
    prompt: 'What destinations are currently featured in TravelSphere?'
  },
  {
    icon: <Hotel className="w-4 h-4 text-teal-600" />,
    title: 'Find Hotel Accommodations',
    prompt: 'What luxury and boutique hotels are available to book?'
  },
  {
    icon: <CalendarCheck className="w-4 h-4 text-teal-600" />,
    title: 'Check Reservation Status',
    prompt: 'What is the current status of my bookings and payments?'
  }
];

export const TravelAssistant = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionUuid, setSessionUuid] = useState(null);
  const [error, setError] = useState(null);

  const [savedSessions, setSavedSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load user sessions if authenticated
  const fetchSessions = async () => {
    if (!isAuthenticated) return;
    setLoadingSessions(true);
    try {
      const data = await chatApi.getSessions();
      setSavedSessions(data || []);
    } catch {
      // Non-critical background failure
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [isAuthenticated]);

  const handleStartNewChat = () => {
    setMessages([]);
    setSessionUuid(null);
    setError(null);
    setInputText('');
    setIsSidebarOpen(false);
  };

  const handleSelectSession = async (uuid) => {
    setIsSending(true);
    setError(null);
    setSessionUuid(uuid);
    setIsSidebarOpen(false);
    try {
      const history = await chatApi.getSessionMessages(uuid);
      const formatted = (history || []).map((m) => ({
        id: Math.random().toString(),
        role: m.senderRole?.toLowerCase() === 'user' ? 'user' : 'assistant',
        content: m.message,
        createdAt: m.createdAt
      }));
      setMessages(formatted);
    } catch (err) {
      setError(err.message || 'Unable to retrieve session history.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteSession = async (e, uuid) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(uuid);
      setSavedSessions((prev) => prev.filter((s) => s.sessionUuid !== uuid));
      if (sessionUuid === uuid) {
        handleStartNewChat();
      }
    } catch {
      // Ignore
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setError(null);
    setInputText('');

    // Append user message immediately
    const userMsg = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const response = await chatApi.sendMessage(text, sessionUuid);

      setSessionUuid(response.sessionUuid);

      const assistantMsg = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response.message,
        suggestedPrompts: response.suggestedPrompts || [],
        actions: response.referencedActions || [],
        createdAt: response.createdAt || new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (isAuthenticated) {
        fetchSessions();
      }
    } catch (err) {
      setError(err.message || 'Unable to communicate with the travel assistant. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col min-h-[calc(100vh-140px)]">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-teal-950 rounded-3xl p-5 sm:p-6 text-white mb-6 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">TravelSphere Concierge</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/20">
                <Sparkles className="w-2.5 h-2.5" /> AI ASSISTANT
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Authoritative trip planning grounded in real TravelSphere packages, hotels & database pricing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleStartNewChat}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Left Sidebar (Saved Trips & Inspirations) */}
        <div
          className={`lg:block ${
            isSidebarOpen ? 'fixed inset-0 z-50 bg-slate-950/70 p-4' : 'hidden'
          } lg:relative lg:p-0`}
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200/90 p-5 h-full flex flex-col justify-between shadow-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {isAuthenticated ? 'Recent Conversations' : 'Travel Inspirations'}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={handleStartNewChat}
                    className="p-1 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 transition-colors"
                    title="New Conversation"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sessions List */}
              {isAuthenticated ? (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {loadingSessions ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading sessions...</div>
                  ) : savedSessions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No saved conversations yet. Start a new query!
                    </div>
                  ) : (
                    savedSessions.map((s) => {
                      const isActive = s.sessionUuid === sessionUuid;
                      return (
                        <div
                          key={s.sessionUuid}
                          onClick={() => handleSelectSession(s.sessionUuid)}
                          className={`w-full group text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-teal-50 text-teal-950 font-bold border border-teal-200'
                              : 'hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MessageSquare className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate">{s.sessionTitle}</span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(e, s.sessionUuid)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sign in to save and sync your travel conversations across all your devices.
                  </p>
                </div>
              )}
            </div>

            {/* AI Trust Badge */}
            <div className="pt-4 border-t border-slate-100">
              <div className="bg-teal-50/60 border border-teal-200/60 rounded-2xl p-3.5 text-xs text-teal-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-teal-900 mb-0.5">Authoritative Accuracy:</strong>
                  <p className="text-[11px] text-teal-800 leading-normal">
                    Responses prioritize live database catalogue data over speculative assumptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Chat Thread (3 Columns) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
          {/* Messages Canvas */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6 max-h-[580px] min-h-[420px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200/80 text-teal-600 flex items-center justify-center mb-4 shadow-sm">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
                  How can I help you travel smarter today?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-8">
                  Ask me about destinations, curated tour itineraries, boutique hotels, or check your reservation details.
                </p>

                {/* Starter Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {STARTER_PROMPTS.map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(starter.prompt)}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-500/50 bg-slate-50/60 hover:bg-teal-50/40 transition-all text-left flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:border-teal-200 shadow-2xs shrink-0">
                        {starter.icon}
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block group-hover:text-teal-900">
                          {starter.title}
                        </strong>
                        <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          "{starter.prompt}"
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`max-w-2xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                      {/* Message Bubble */}
                      <div
                        className={`rounded-3xl p-4 sm:p-5 text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-brand-navy text-white rounded-br-none ml-auto'
                            : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.content}</div>
                      </div>

                      {/* Action Navigation Pills */}
                      {!isUser && msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {msg.actions.map((act, i) => (
                            <ChatActionPill key={i} action={act} />
                          ))}
                        </div>
                      )}

                      {/* Suggested Next Prompt Chips */}
                      {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Suggested Follow-ups
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {msg.suggestedPrompts.map((p, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-slate-700 hover:text-teal-900 text-xs font-semibold transition-colors"
                              >
                                <span>{p}</span>
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Sending indicator */}
            {isSending && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                  <span>Consulting TravelSphere catalogue & formulating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error notice */}
          {error && (
            <div className="mx-5 mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Bottom Chat Input Bar */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about destinations, holiday packages, luxury hotels, or your bookings..."
                  maxLength={1000}
                  disabled={isSending}
                  className="w-full pl-4 pr-16 py-3.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                  {inputText.length}/1000
                </span>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-md shadow-teal-600/20 transition-all shrink-0 hover:shadow-lg"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Responses are strictly grounded in real TravelSphere records. Double-check package milestones and booking terms before traveling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelAssistant;

import { useState, useEffect, useRef } from 'react';
import { 
  X, Send, User, Sparkles, AlertCircle, RefreshCw, Bot, 
  TrendingUp, Calendar, CheckSquare, Target, ChevronRight, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import studentApi from '../services/studentApi';

// Helper to render bold (**), italic (*), and inline code (`)
function renderInline(str) {
  if (!str) return null;
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const tokens = [];
  let lastIdx = 0;
  let match;
  let keyIdx = 0;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(<span key={keyIdx++}>{str.substring(lastIdx, match.index)}</span>);
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code key={keyIdx++} className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-blue-600 font-semibold">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={keyIdx++} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={keyIdx++} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < str.length) {
    tokens.push(<span key={keyIdx++}>{str.substring(lastIdx)}</span>);
  }
  return tokens.length > 0 ? tokens : str;
}

// Markdown and Table Formatter for Chat Messages
function MessageContent({ text, isUser }) {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  const lines = (text || '').split('\n');
  const elements = [];
  let i = 0;
  let elemKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Table Detection: lines starting and ending with '|'
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());
        
        const hasSeparator = tableLines[1].includes('---');
        const startRow = hasSeparator ? 2 : 1;

        const rows = [];
        for (let r = startRow; r < tableLines.length; r++) {
          const rowCells = tableLines[r]
            .split('|')
            .slice(1, -1)
            .map(c => c.trim());
          rows.push(rowCells);
        }

        elements.push(
          <div key={elemKey++} className="overflow-x-auto my-2.5 rounded-xl border border-slate-200/90 shadow-xs bg-white">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  {headerCells.map((h, hi) => (
                    <th key={hi} className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/50 hover:bg-blue-50/30'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 2. Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={elemKey++} className="font-bold text-slate-900 text-xs sm:text-sm mt-3 mb-1.5 flex items-center gap-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={elemKey++} className="font-extrabold text-[#2563EB] text-sm mt-3.5 mb-1.5">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={elemKey++} className="font-extrabold text-slate-900 text-base mt-4 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // 3. Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={elemKey++} className="my-2.5 border-slate-200" />);
      i++;
      continue;
    }

    // 4. Bullet list items (* , - , • )
    if (/^[\*\-•]\s+/.test(trimmed)) {
      const listContent = trimmed.replace(/^[\*\-•]\s+/, '');
      elements.push(
        <div key={elemKey++} className="flex items-start gap-2 my-1 text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0 mt-1.5"></span>
          <div className="flex-1 leading-relaxed">{renderInline(listContent)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 5. Numbered list items (1. , 2. )
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={elemKey++} className="flex items-start gap-2 my-1 text-slate-700">
          <span className="text-xs font-bold text-[#2563EB] shrink-0 min-w-4">{numMatch[1]}.</span>
          <div className="flex-1 leading-relaxed">{renderInline(numMatch[2])}</div>
        </div>
      );
      i++;
      continue;
    }

    // 6. Blank lines
    if (trimmed === '') {
      elements.push(<div key={elemKey++} className="h-1.5"></div>);
      i++;
      continue;
    }

    // 7. Regular paragraph
    elements.push(
      <p key={elemKey++} className="my-1 leading-relaxed text-slate-700">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export default function EduAssistChatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 'initial', 
      sender: 'ai', 
      text: 'Hello! I am EduAssist AI, your personal academic co-pilot. I am directly synced with your real-time course marks, continuous assessments, assignment deadlines, and career trajectory. How can I assist your studies today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const hasLoadedHistory = useRef(false);
  const inputRef = useRef(null);

  // Quick Action prompts with rich LMS categories
  const quickActions = [
    {
      icon: TrendingUp,
      label: "Analyze My Performance",
      subtitle: "Course marks & standing",
      color: "text-[#2563EB]",
      bg: "bg-blue-50 border-blue-200 hover:border-blue-300",
      prompt: "Analyze my current academic performance and explain my main strengths, weaknesses, and areas that need attention."
    },
    {
      icon: CheckSquare,
      label: "Prioritize Assignments",
      subtitle: "Urgent deadlines first",
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200 hover:border-amber-300",
      prompt: "Review my current assignments and tell me what I should complete first."
    },
    {
      icon: Calendar,
      label: "Weekly Study Plan",
      subtitle: "Personalized task routine",
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
      prompt: "Recommend a weekly study schedule based on my current academic performance, pending assignments, and course weaknesses. How can I manage this in my AI Study Plan?"
    },
    {
      icon: Target,
      label: "Career Skill Gap",
      subtitle: "Market readiness & tracks",
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200 hover:border-purple-300",
      prompt: "Based on my target career goal, verified skills, and academic coursework, analyze my skill gaps and advise me on what high-priority skills and courses I should focus on."
    }
  ];

  // Listen for global open events from Sidebar or Header
  useEffect(() => {
    const handleToggle = (e) => {
      if (e.detail?.open !== undefined) {
        setIsOpen(e.detail.open);
      } else {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('toggle-ai-chat', handleToggle);
    return () => window.removeEventListener('toggle-ai-chat', handleToggle);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Load chat history from MySQL when chatbot is first opened
  useEffect(() => {
    if (isOpen && !hasLoadedHistory.current && user?.role === 'student') {
      hasLoadedHistory.current = true;
      const loadHistory = async () => {
        try {
          const res = await studentApi.getChatHistory();
          const history = res.data || [];
          if (history.length > 0) {
            const formatted = history.map(h => ({
              id: h.id,
              sender: h.sender,
              text: h.message
            }));
            setMessages(prev => [...prev, ...formatted]);
          }
        } catch (err) {
          console.warn('Could not load chat history:', err.message);
        }
      };
      loadHistory();
    }
  }, [isOpen, user]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Only show chatbot for students
  if (user?.role !== 'student') return null;

  const sendMessage = async (userMsg) => {
    if (!userMsg || !userMsg.trim() || isTyping) return;

    const trimmed = userMsg.trim();
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);
    setErrorMessage(null);

    try {
      const res = await studentApi.chat(trimmed);
      const reply = res.data?.message || res.reply || res.message || 'I have analyzed your request based on your current academic records.';
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: reply }]);
    } catch (err) {
      const fallbackText = "Sorry, I couldn't process that request right now. Please try asking again.";
      setErrorMessage(err.message || fallbackText);
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          sender: 'ai', 
          text: fallbackText 
        }
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action) => {
    if (!action.prompt) {
      inputRef.current?.focus();
      return;
    }
    sendMessage(action.prompt);
  };

  const clearChat = () => {
    setMessages([
      { 
        id: 'initial', 
        sender: 'ai', 
        text: 'Conversation reset. How can I help you with your coursework, continuous assessment marks, or career development?' 
      }
    ]);
    setErrorMessage(null);
  };

  return (
    <>
      {/* Sleek Floating Launcher Pill Button (Cute Compass Style with Mascot) */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 px-4 py-2.5 bg-white hover:bg-[#FAF9F5] text-[#001E2B] rounded-full shadow-xl hover:shadow-2xl border-2 border-[#00ED64] hover:scale-105 active:scale-95 transition-all duration-200 z-40 items-center gap-3 font-bold text-sm select-none cursor-pointer group ${isOpen ? 'hidden' : 'flex'}`}
        aria-label="Open EduAssist AI Assistant"
      >
        <div className="relative">
          <img 
            src="/chatbot-mascot.png" 
            alt="AI Mascot" 
            className="w-9 h-9 object-contain drop-shadow shrink-0" 
          />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00ED64] border-2 border-white animate-pulse"></span>
        </div>
        <div className="text-left">
          <span className="block text-xs font-black text-[#001E2B] leading-tight">
            EduAssist AI
          </span>
          <span className="block text-[11px] text-[#00684A] font-bold leading-none">
            ✦ Academic Copilot
          </span>
        </div>
        <div className="w-6 h-6 rounded-full bg-[#E6F8ED] text-[#00684A] flex items-center justify-center group-hover:bg-[#00ED64] group-hover:text-[#001E2B] transition-colors">
          <Sparkles size={12} />
        </div>
      </button>

      {/* Floating Chat Modal (MongoDB Compass Cute Theme) */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 w-[380px] sm:w-[430px] h-[610px] max-h-[88vh] bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-[#E2E1D9] animate-in fade-in zoom-in-95 duration-200 font-sans">
          
          {/* Header */}
          <div className="bg-[#001E2B] text-white p-4 flex items-center justify-between shrink-0 shadow-sm border-b-2 border-[#00ED64]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/chatbot-mascot.png" 
                  alt="EduAssist AI" 
                  className="w-10 h-10 object-contain drop-shadow" 
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00ED64] border-2 border-[#001E2B] animate-pulse"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white tracking-tight leading-tight">
                    EduAssist AI Copilot
                  </h3>
                  <span className="bg-[#00ED64] text-[#001E2B] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    LMS Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5 font-medium">
                  Synced with University Academic Records
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                className="p-2 text-slate-300 hover:text-[#00ED64] hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Reset Conversation"
              >
                <RefreshCw size={15} />
              </button>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-300 hover:text-[#00ED64] hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>
          
          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#FAF9F5] flex flex-col gap-3.5 text-sm">
            
            {/* Introductory LMS Companion Banner */}
            {messages.length <= 1 && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#E2E1D9] shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#001E2B]">
                  <Sparkles size={15} className="text-[#00684A]" />
                  <span>Academic Quick-Starters</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tap any recommendation to instantly query your LMS performance:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      type="button"
                      disabled={isTyping}
                      onClick={() => handleQuickAction(qa)}
                      className="p-2.5 rounded-xl border border-[#E2E1D9] hover:border-[#00ED64] bg-[#FAF9F5] hover:bg-[#E6F8ED] text-left transition-all duration-150 flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <qa.icon size={14} className="text-[#00684A]" />
                        <span className="text-[11px] font-bold text-[#001E2B] group-hover:text-[#00684A] truncate">
                          {qa.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        {qa.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 max-w-[92%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div className="shrink-0 mt-0.5">
                  {msg.sender === 'user' ? (
                    <div className="w-7 h-7 rounded-full bg-[#001E2B] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      <User size={13} />
                    </div>
                  ) : (
                    <img 
                      src="/chatbot-mascot.png" 
                      alt="AI" 
                      className="w-7 h-7 object-contain drop-shadow" 
                    />
                  )}
                </div>

                <div className={`p-3.5 rounded-2xl leading-relaxed text-xs sm:text-[13px] shadow-2xs ${
                  msg.sender === 'user' 
                    ? 'bg-[#00684A] text-white rounded-tr-xs font-medium' 
                    : 'bg-white border border-[#E2E1D9] text-[#001E2B] rounded-tl-xs'
                }`}>
                  <MessageContent text={msg.text} isUser={msg.sender === 'user'} />
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%] self-start">
                <img 
                  src="/chatbot-mascot.png" 
                  alt="AI Typing" 
                  className="w-7 h-7 object-contain drop-shadow shrink-0 mt-0.5 animate-bounce" 
                />
                <div className="p-3 bg-white shadow-2xs border border-[#E2E1D9] rounded-2xl rounded-tl-xs flex items-center gap-2">
                  <span className="text-xs font-bold text-[#00684A]">Analyzing LMS Records...</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#00ED64] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#00ED64] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#00ED64] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips & Input Form */}
          <div className="p-3.5 bg-white border-t border-[#E2E1D9] space-y-2.5 shrink-0">
            
            {/* Horizontal Prompt Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  type="button"
                  disabled={isTyping}
                  onClick={() => handleQuickAction(qa)}
                  className="whitespace-nowrap px-3 py-1 bg-[#FAF9F5] hover:bg-[#E6F8ED] text-slate-700 hover:text-[#00684A] font-bold rounded-xl border border-[#E2E1D9] hover:border-[#00ED64] transition-all text-[11px] disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <qa.icon size={13} className="text-[#00684A]" />
                  <span>{qa.label}</span>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input 
                ref={inputRef}
                type="text" 
                maxLength={2000}
                disabled={isTyping}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about course marks, assignments, or study plan..." 
                className="flex-1 bg-[#FAF9F5] border border-[#E2E1D9] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#001E2B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00ED64]/30 focus:border-[#00684A] focus:bg-white transition-all font-medium disabled:opacity-60"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping} 
                className="w-10 h-10 bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] rounded-2xl flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none transition-all shrink-0 shadow-xs active:scale-95 cursor-pointer font-bold"
                title="Send Message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

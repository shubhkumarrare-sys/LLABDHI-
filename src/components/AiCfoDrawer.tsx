import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DebtorItem, CreditorItem, EmiItem, ComplianceItem, AppSettings } from '../types';
import {
  Bot,
  X,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  Mail,
  Loader2,
} from 'lucide-react';

interface AiCfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataContext: {
    debtors: DebtorItem[];
    creditors: CreditorItem[];
    emis: EmiItem[];
    compliance: ComplianceItem[];
    settings: AppSettings;
  };
  initialPrompt?: string;
}

export const AiCfoDrawer: React.FC<AiCfoDrawerProps> = ({
  isOpen,
  onClose,
  dataContext,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Hello! I am your AI Chief Financial & Operations Manager for Llabdhi Manufacturing LLP.\n\nI have full access to the "LLABDHI OPS NODE" dataset across your 5-Day, 15-Day, and Monthly Cash Flow Command Centers, Debtors, Creditors, Car Loans (MG Cyberster & Mercedes-Benz), and LLP Statutory Compliance (GST, TDS, MCA). How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Generate 5-Day Cash Flow Report',
        'Generate 15-Day Cash Flow Projection',
        'Generate Monthly (30-Day) Cash Flow Report',
        'Analyze Overdue Receivables by Client',
        'Check Statutory Compliance Deadlines for GST & MCA',
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = textToSend || inputPrompt;
    if (!promptText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          dataContext,
        }),
      });

      const data = await res.json();

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'No response generated from server.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ Error contacting AI Manager: ${err?.message || 'Server error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 text-white flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-lg flex items-center justify-center shadow">
              <img
                src="https://llabdhi.com/assets/img/llabdhi_img/Llabdhi_Mfgr_LLP3223.png"
                alt="Llabdhi Manufacturing LLP Logo"
                referrerPolicy="no-referrer"
                className="h-7 w-auto object-contain max-w-[110px]"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <span>AI Chief Financial & Operations Manager</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                  Gemini 3.6 Flash
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Llabdhi Manufacturing LLP Executive Intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Optional Quick Suggestion Chips */}
                {msg.suggestions && (
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSendMessage(sug)}
                        className="px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-[11px] font-medium transition cursor-pointer text-left"
                      >
                        ⚡ {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-indigo-400 text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI Chief Financial Manager is analyzing Llabdhi Ops Node data...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask about cash flow, overdue AR, EMIs, or tax deadlines..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center transition cursor-pointer disabled:opacity-50 shadow shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

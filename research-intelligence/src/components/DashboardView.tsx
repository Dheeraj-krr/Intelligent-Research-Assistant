import { User, DocumentItem, ChatSession } from '../types';
import { ArrowRight, UserCheck, BookOpen, Clock } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

interface DashboardViewProps {
  user: User;
  documents: DocumentItem[];
  chatHistory: ChatSession[];
  onSelectTab: (tab: string) => void;
}

export default function DashboardView({ user, documents, chatHistory, onSelectTab }: DashboardViewProps) {

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const handleProtectedProfile = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://127.0.0.1:8000/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(data);
  };


  const askAI = async () => {

    if (!question.trim()) return;

    // user message add
    const userMessage = {
      role: "user" as const,
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentQuestion = question;

    // input clear
    setQuestion("");

    try {

      const response = await fetch("http://127.0.0.1:8000/ask-ai", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question: currentQuestion,
        }),

      });

      const data = await response.json();

      // AI message add
      const aiMessage = {
        role: "assistant" as const,
        content: data.answer || "I couldn't find an answer, please try again.",
      };

      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error(error);
    }
  };

  const handleQuestionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      askAI();
    }
  };

  return (
    <div className="relative space-y-8 animate-fade-in">
      <div className="absolute top-5 right-5 flex flex-col items-end gap-3 z-20">
        <button
          type="button"
          className="w-14 h-14 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary shadow-xl transition hover:bg-brand-primary/20"
          aria-label="Open profile"
          onClick={async () => {
            await handleProtectedProfile();

            onSelectTab("profile")
          }
          }

        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`${user.name} avatar`} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-lg font-bold">{user.name.charAt(0)}</span>
          )}
        </button>

      </div>

      {/* Welcome banner section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-geist text-3xl font-bold text-brand-primary tracking-tight">
            Welcome back, <span className="text-brand-text-primary">{user.name}</span>
          </h2>
          <p className="text-sm text-brand-on-secondary-container mt-1">Ready for your next breakthrough? Secure environment loaded.</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 min-w-[280px] bg-brand-surface/40">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-brand-bg rounded-full"></div>
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase font-geist tracking-wider text-brand-on-secondary-container/60">Token Authorization</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {/* <span className="text-xs font-bold text-brand-primary">Level 4 Node</span> */}
              <span className="text-[10px] text-brand-on-secondary-container font-mono">Expires: {user.tokenExpiresIn}</span>
            </div>
            <div className="w-full bg-brand-surface-container h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-brand-primary h-full rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <section className="md:col-span-3 glass-panel rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-text-primary">Chat with AI Assistant</h1>
            <p className="text-sm text-brand-on-secondary-container mt-1 max-w-2xl">
              Get your doubts resolved instantly , brainstorm  different ideas, or ask for explanations.
            </p>
          </div>
          <div className="rounded-2xl bg-brand-surface-container border border-brand-border px-4 py-3 text-xs font-semibold text-brand-secondary-container">
            Live assistant mode
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-brand-border bg-brand-surface-container p-4 max-h-[520px]">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="text-xs uppercase tracking-[0.24em] text-brand-on-secondary-container font-semibold">
              Conversation
            </div>
            <div className="text-[11px] text-brand-secondary-container">{messages.length} messages</div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-2 pb-2">
            {messages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-brand-border bg-brand-surface flex flex-col gap-3 p-6 text-brand-on-secondary-container">
                <div className="text-sm font-semibold text-brand-text-primary">Start a new conversation</div>
                <p className="text-sm leading-6">
                  Ask anything bothering you. The assistant will respond instantly.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                >
                  <div className={`rounded-[28px] px-5 py-4 text-sm leading-6 shadow-sm ${msg.role === 'user'
                      ? 'bg-brand-primary text-brand-on-primary rounded-br-[6px] rounded-tl-[28px] rounded-tr-[28px] rounded-bl-[28px]'
                      : 'bg-brand-surface-high text-brand-text-primary rounded-tl-[6px] rounded-tr-[28px] rounded-bl-[28px] rounded-br-[28px]'
                    }`}>
                    {msg.content}
                  </div>
                  <div className="text-[11px] text-brand-secondary-container tracking-wide">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-3xl border border-brand-border bg-brand-bg p-3 shadow-inner">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask anything..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleQuestionKeyDown}
                className="flex-1 rounded-2xl border border-brand-border bg-brand-surface px-4 py-3 text-sm text-brand-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <button
                onClick={askAI}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-on-primary transition hover:brightness-110"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

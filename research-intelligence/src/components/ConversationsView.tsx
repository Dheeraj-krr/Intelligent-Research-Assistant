import { useState, useEffect, type FormEvent } from "react";

type ConversationSummary = {
  conversation_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_preview?: string | null;
};

type MessageItem = {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

export default function ConversationsView() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    } as HeadersInit;
  };

  const fetchConversations = async () => {
    const response = await fetch("http://127.0.0.1:8000/chat/conversations", {
      headers: authHeaders(),
    });
    if (!response.ok) return;
    const data = await response.json();
    setConversations(data);
  };

  const fetchConversationMessages = async (conversationId: number) => {
    const response = await fetch(`http://127.0.0.1:8000/chat/conversations/${conversationId}/messages`, {
      headers: authHeaders(),
    });
    if (!response.ok) return;
    const data = await response.json();
    setMessages(
      data.map((item: any) => ({
        role: item.role,
        content: item.content,
        created_at: item.created_at,
      }))
    );
  };

  useEffect(() => {
    void fetchConversations();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;
    setMessage("");
    setIsTyping(true);

    setMessages((prev) => [...prev, { role: "user", content: currentMessage }]);

    const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        message: currentMessage,
        conversation_id: activeConversationId ?? undefined,
      }),
    });

    if (!response.body) {
      setIsTyping(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let aiText = "";
    let conversationIdFromStream: number | null = activeConversationId;

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);

          if (data.type === "conversation_started") {
            conversationIdFromStream = data.conversation_id;
            setActiveConversationId(data.conversation_id);
            await fetchConversations();
            continue;
          }

          if (data.type === "done") {
            await fetchConversations();
            if (conversationIdFromStream) {
              await fetchConversationMessages(conversationIdFromStream);
            }
            continue;
          }

          if (data.token) {
            aiText += data.token;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: aiText,
              };
              return updated;
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
    }

    setIsTyping(false);
  };

  const clearHistory = async () => {
    await fetch("http://127.0.0.1:8000/chat/history", {
      method: "DELETE",
      headers: authHeaders(),
    });
    setMessages([]);
    setConversations([]);
    setActiveConversationId(null);
  };

  const startNewConversation = async () => {
    const response = await fetch("http://127.0.0.1:8000/chat/conversations", {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await response.json();
    setActiveConversationId(data.conversation_id);
    setMessages([]);
    await fetchConversations();
  };

  const deleteConversation = async (conversationId: number) => {
    await fetch(`http://127.0.0.1:8000/chat/conversations/${conversationId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    await fetchConversations();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Conversations</p>
          <h2 className="text-4xl font-semibold text-slate-100">Chat with AI</h2>
          <p className="max-w-2xl text-base text-slate-400">
            Persistent conversations, multiple threads, and full message history for every signed-in user.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={startNewConversation}
            className="inline-flex items-center justify-center rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/20"
          >
            New Conversation
          </button>
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Threads</h3>
            <span className="text-xs text-slate-500">{conversations.length}</span>
          </div>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.conversation_id}
                className={`rounded-2xl border p-3 transition ${activeConversationId === conversation.conversation_id ? "border-sky-500/40 bg-sky-500/10" : "border-slate-800 bg-slate-950/50"}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setActiveConversationId(conversation.conversation_id);
                    void fetchConversationMessages(conversation.conversation_id);
                  }}
                >
                  <div className="text-sm font-semibold text-slate-100">{conversation.title}</div>
                </button>
                <button
                  type="button"
                  className="mt-2 text-xs text-rose-300"
                  onClick={() => void deleteConversation(conversation.conversation_id)}
                >
                  Delete
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                No saved conversations yet.
              </div>
            )}
          </div>
        </aside>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Active thread</p>
              <h3 className="text-xl font-semibold text-slate-100">
                {activeConversationId ? "Continuing conversation" : "New conversation"}
              </h3>
            </div>
            {activeConversationId && (
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                #{activeConversationId}
              </span>
            )}
          </div>

          <div className="space-y-6">
            {isTyping && (
              <div className="flex items-center gap-3 rounded-3xl bg-slate-900/90 px-4 py-3 text-sm text-slate-200 shadow-sm shadow-slate-950/20">
                <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-sky-400" />
                AI is typing...
              </div>
            )}

            <div className="space-y-5">
              {messages.length === 0 && !isTyping ? (
                <div className="rounded-3xl bg-slate-900/80 px-6 py-8 text-center text-slate-500 shadow-sm shadow-slate-950/20">
                  Select a conversation or start a new one to continue the chat.
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className="space-y-4">
                    <div className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm ${msg.role === "user" ? "rounded-tl-none bg-slate-900/90 text-slate-100" : "rounded-tr-none bg-sky-500/15 text-slate-200"}`}>
                        <div className={`mb-2 text-xs uppercase tracking-[0.22em] ${msg.role === "user" ? "text-slate-500" : "text-sky-300"}`}>
                          {msg.role === "user" ? "You" : "Assistant"}
                        </div>
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask something..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 rounded-full border border-slate-700 bg-slate-950/90 px-5 py-4 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center rounded-full bg-sky-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

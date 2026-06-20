import { useState, useEffect, type FormEvent } from "react";

export default function ConversationsView() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const fetchChatHistory = async () => {
    const response = await fetch("http://127.0.0.1:8000/chat/history");
    const data = await response.json();

    const formattedMessages = data.map((chat: any) => ({
      user: chat.user_message,
      ai: chat.ai_response,
    }));

    setMessages(formattedMessages);
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;
    setMessage("");
    setIsTyping(true);

    await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: currentMessage }),
    });

    setTimeout(async () => {
      await fetchChatHistory();
      setIsTyping(false);
    }, 1500);
  };

  const clearHistory = async () => {
    await fetch("http://127.0.0.1:8000/chat/history", {
      method: "DELETE",
    });
    setMessages([]);
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
            A simple conversational experience with chat bubbles and a clean, modern layout.
          </p>
        </div>

        <button
          type="button"
          onClick={clearHistory}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        >
          Clear History
        </button>
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
              Your chat history is empty. Ask a question to start the conversation.
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="space-y-4">
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-3xl rounded-tl-none bg-slate-900/90 px-5 py-4 text-slate-100 shadow-sm shadow-slate-950/20">
                    <div className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">You</div>
                    <p className="whitespace-pre-line text-sm leading-7">{msg.user}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-3xl rounded-tr-none bg-sky-500/15 px-5 py-4 text-slate-100 shadow-sm shadow-slate-950/10 backdrop-blur-sm">
                    <div className="mb-2 text-xs uppercase tracking-[0.22em] text-sky-300">Assistant</div>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-200">{msg.ai}</p>
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
  );
}

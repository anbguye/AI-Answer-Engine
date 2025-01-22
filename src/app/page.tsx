"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user" as const, content: message };
    const loadingMessage = {
      role: "assistant" as const,
      content: "Thinking...",
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, messages }),
      });

      const data = await response.json();
      setMessages(prev =>
        prev.slice(0, -1).concat({ role: "assistant", content: data.message })
      );
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev =>
        prev
          .slice(0, -1)
          .concat({
            role: "assistant",
            content: "Sorry, something went wrong.",
          })
      );
    }
  };

  return (
    <div className="bg-zinc-950 flex flex-col min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Chat</h1>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-2xl mx-auto px-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`group flex gap-3 my-4 text-sm ${
                msg.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-6 w-6 mt-1">
                  <div className="bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-full bg-primary/20 text-primary/90 h-full w-full flex items-center justify-center text-xs font-medium">
                    AI
                  </div>
                </Avatar>
              )}
              <div
                className={`px-3 py-2 rounded-xl max-w-[85%] ${
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-zinc-800 to-zinc-700"
                    : "bg-slate-100 text-black"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl relative flex items-center">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSend()}
              placeholder="Message..."
              className="flex-1 bg-muted rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!message.trim()}
              className="absolute right-1 w-8 h-8 bg-zinc-600 rounded-xl "
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            AI may make mistakes. Please use with discretion.
          </p>
        </div>
      </div>
    </div>
  );
}

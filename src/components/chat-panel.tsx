"use client";

import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  questionId?: string | null;
  onClose?: () => void;
}

const HINT_TEXT =
  "I can see the question you're working on. Ask me anything — why an option is wrong, the underlying mechanism, a mnemonic, or related high-yield facts.";

export function ChatPanel({ questionId, onClose }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = useMemo(
    () =>
      new Chat({
        transport: new DefaultChatTransport({
          api: questionId ? `/api/chat?questionId=${questionId}` : "/api/chat",
        }),
        messages: questionId
          ? [
              {
                id: "system-hint",
                role: "assistant" as const,
                parts: [{ type: "text" as const, text: HINT_TEXT }],
              },
            ]
          : [],
      }),
    [questionId]
  );

  const { messages, status, sendMessage } = useChat({ chat });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    sendMessage({ text: inputValue });
    setInputValue("");
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-zinc-300">MedPrep AI Tutor</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="text-3xl">🩺</div>
            <p className="text-zinc-400 text-sm">
              Ask me anything about medicine.
              <br />
              I can explain concepts, quiz you, or review questions.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {[
                "Explain the Frank-Starling mechanism",
                "Quiz me on Pharmacology",
                "What's the difference between Type 1 and Type 2 diabetes?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    sendMessage({ text: suggestion });
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = (msg.role as string) === "user";
          return (
          <div
            key={msg.id}
            className={cn(
              "flex",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                isUser
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-300"
              )}
            >
              {msg.parts?.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <div key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
          );
        })}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-xl px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0.1s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a medical question..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

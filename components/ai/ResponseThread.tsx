"use client";

import React, { useEffect, useRef } from "react";
import { Star, User, Bot, Globe, MessageSquarePlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ResponseRenderer } from "@/components/ai/ResponseRenderer";
import { SelectionToolbar } from "@/components/ai/SelectionToolbar";
import type { ChatMessage } from "@/lib/data/types";

interface ResponseThreadProps {
  messages: ChatMessage[];
  onPin: (id: string) => void;
  onEntityClick: (type: string, id: string) => void;
  onDrillDown?: (selectedText: string, context: string) => void;
  onSaveSnippet?: (text: string) => void;
}

function formatMessageTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-stone-100 mb-5">
        <Globe className="h-7 w-7 text-brand-amber" />
      </div>
      <h2 className="text-xl font-semibold text-stone-800 mb-2">
        Welcome to GeoEx Copilot
      </h2>
      <p className="max-w-md text-sm text-stone-500 leading-relaxed">
        Ask me anything about your trips, travelers, documents, or operations.
        I can pull reports, draft communications, and help you stay on top of
        everything.
      </p>
    </div>
  );
}

export function ResponseThread({
  messages,
  onPin,
  onEntityClick,
  onDrillDown,
  onSaveSnippet,
}: ResponseThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-auto">
        <WelcomeMessage />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={cn(
                  "flex gap-3",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {/* Assistant avatar */}
                {!isUser && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-stone-100">
                    <Globe className="h-3.5 w-3.5 text-brand-amber" />
                  </div>
                )}

                <div
                  className={cn(
                    "group relative",
                    isUser ? "max-w-[70%]" : "max-w-[85%] min-w-0 flex-1"
                  )}
                >
                  <Card
                    className={cn(
                      "overflow-hidden",
                      isUser
                        ? "bg-stone-900 text-white border-stone-800"
                        : "bg-white border-stone-200"
                    )}
                  >
                    <div className={cn("px-4 py-3", !isUser && "pb-2")}>
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      ) : message.content ? (
                        <ResponseRenderer
                          content={message.content}
                          onEntityClick={onEntityClick}
                        />
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-stone-300 animate-bounce [animation-delay:0ms]" />
                            <span className="h-2 w-2 rounded-full bg-stone-300 animate-bounce [animation-delay:150ms]" />
                            <span className="h-2 w-2 rounded-full bg-stone-300 animate-bounce [animation-delay:300ms]" />
                          </div>
                          <span className="text-xs text-stone-400">Thinking...</span>
                        </div>
                      )}
                    </div>

                    {/* Footer with timestamp, pin, and drill-down */}
                    <div
                      className={cn(
                        "flex items-center justify-between px-4 pb-2",
                        isUser ? "pt-0" : "pt-1 border-t border-stone-100 mt-1"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[11px]",
                          isUser ? "text-stone-400" : "text-stone-400"
                        )}
                      >
                        {formatMessageTime(message.timestamp)}
                      </span>

                      {!isUser && (
                        <div className="flex items-center gap-0.5">
                          {/* Quick drill-down on the whole response */}
                          {message.content && onDrillDown && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() =>
                                onDrillDown(
                                  "",
                                  message.content.slice(0, 300)
                                )
                              }
                              title="Ask a follow-up about this response"
                            >
                              <MessageSquarePlus className="h-3.5 w-3.5 text-stone-400" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100",
                              message.pinned && "opacity-100"
                            )}
                            onClick={() => onPin(message.id)}
                          >
                            <Star
                              className={cn(
                                "h-3.5 w-3.5",
                                message.pinned
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-stone-400"
                              )}
                            />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* User avatar */}
                {isUser && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-200">
                    <User className="h-3.5 w-3.5 text-stone-600" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Selection toolbar for deep interaction */}
      {onDrillDown && onSaveSnippet && (
        <SelectionToolbar
          onDrillDown={onDrillDown}
          onSaveSnippet={onSaveSnippet}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}

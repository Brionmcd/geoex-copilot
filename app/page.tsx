"use client";

import { useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { PromptBar } from "@/components/ai/PromptBar";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import { ResponseThread } from "@/components/ai/ResponseThread";
import { PinnedItems } from "@/components/ai/PinnedItems";
import { notifications as seedNotifications } from "@/lib/data/seed-notifications";
import type { AppUser, ChatMessage, Notification } from "@/lib/data/types";
import { generateId } from "@/lib/utils";

const DEMO_USERS: AppUser[] = [
  {
    id: "staff-004",
    name: "Heather Walsh",
    role: "manager",
    email: "heather.walsh@geoex.com",
  },
  {
    id: "staff-001",
    name: "Sarah Chen",
    role: "gsm",
    email: "sarah.chen@geoex.com",
  },
  {
    id: "staff-002",
    name: "Jessica Torres",
    role: "gsm",
    email: "jessica.torres@geoex.com",
  },
  {
    id: "staff-003",
    name: "Michael Brooks",
    role: "rm",
    email: "michael.brooks@geoex.com",
  },
  {
    id: "staff-005",
    name: "Katia Novak",
    role: "marketing",
    email: "katia.novak@geoex.com",
  },
];

const SNIPPETS_KEY = "geoex-saved-snippets";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AppUser>(DEMO_USERS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState("");
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(seedNotifications);
  const threadRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
        pinned: false,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamStatus("");

      // Create a placeholder assistant message for streaming
      const assistantId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        pinned: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Build conversation history for the API
        const apiMessages = [...messages, userMessage].map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            userRole: currentUser.role,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "status") {
                setStreamStatus(data.message);
              } else if (data.type === "delta") {
                setStreamStatus("");
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + data.text }
                      : m
                  )
                );
              } else if (data.type === "done") {
                // Streaming complete
              } else if (data.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content:
                            "I encountered an error. Please try again.",
                        }
                      : m
                  )
                );
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }
      } catch (error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "I apologize, but I encountered an error processing your request. Please try again.",
                }
              : m
          )
        );
        console.error("Chat error:", error);
      } finally {
        setIsLoading(false);
        setStreamStatus("");
      }
    },
    [messages, isLoading, currentUser.role]
  );

  const handlePin = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m))
    );
  }, []);

  const handleEntityClick = useCallback(
    (type: string, id: string) => {
      // When an entity is clicked in a response, trigger a follow-up query
      const queries: Record<string, string> = {
        trip: `Show me full details for trip ${id}`,
        contact: `Tell me about ${id}`,
        supplier: `Show supplier details for ${id}`,
      };
      const query = queries[type] || `Tell me about ${id}`;
      sendMessage(query);
    },
    [sendMessage]
  );

  const handleDrillDown = useCallback(
    (selectedText: string, context: string) => {
      if (selectedText) {
        // User selected specific text — ask about it with context
        const query = `Regarding this from your previous response: "${selectedText}"\n\nCan you go deeper on this? Provide more detail, related data, and any actions I should consider.`;
        sendMessage(query);
      } else if (context) {
        // Whole-response drill-down (from the message footer button)
        const truncated = context.length > 200 ? context.slice(0, 200) + "..." : context;
        const query = `Based on your last response, what are the key action items and what should I focus on first? Here's a summary for context: "${truncated}"`;
        sendMessage(query);
      }
    },
    [sendMessage]
  );

  const handleSaveSnippet = useCallback((text: string) => {
    try {
      const existing = JSON.parse(
        localStorage.getItem(SNIPPETS_KEY) || "[]"
      );
      existing.push({
        id: `snippet-${Date.now()}`,
        text,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(SNIPPETS_KEY, JSON.stringify(existing));
      // Brief visual feedback could be added here
    } catch {
      // Silently fail on localStorage issues
    }
  }, []);

  const handlePinnedSelect = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-amber-400");
      setTimeout(
        () => element.classList.remove("ring-2", "ring-amber-400"),
        2000
      );
    }
  }, []);

  const handleNotificationAction = useCallback(
    (query: string) => {
      setNotificationPanelOpen(false);
      sendMessage(query);
    },
    [sendMessage]
  );

  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        notificationCount={unreadCount}
        onNotificationClick={() => setNotificationPanelOpen(true)}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pinned items sidebar */}
        {pinnedMessages.length > 0 && (
          <PinnedItems
            messages={pinnedMessages}
            onSelect={handlePinnedSelect}
          />
        )}

        {/* Response thread + prompt area */}
        <div className="flex flex-1 flex-col">
          {/* Scrollable thread */}
          <div ref={threadRef} className="flex-1 overflow-y-auto">
            <ResponseThread
              messages={messages}
              onPin={handlePin}
              onEntityClick={handleEntityClick}
              onDrillDown={handleDrillDown}
              onSaveSnippet={handleSaveSnippet}
            />
          </div>

          {/* Streaming status indicator */}
          {isLoading && streamStatus && (
            <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-stone-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{streamStatus}</span>
            </div>
          )}

          {/* Bottom prompt area */}
          <div className="border-t border-stone-200 bg-white px-4 pb-3 pt-3">
            <div className="mb-2">
              <SuggestedPrompts
                userRole={currentUser.role}
                onPromptClick={sendMessage}
              />
            </div>
            <PromptBar
              onSend={sendMessage}
              disabled={isLoading}
              userRole={currentUser.role}
            />
          </div>
        </div>
      </div>

      {/* Notification panel */}
      <NotificationPanel
        notifications={notifications}
        open={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        onAction={handleNotificationAction}
      />
    </div>
  );
}

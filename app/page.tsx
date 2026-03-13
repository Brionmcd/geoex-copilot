"use client";

import { useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Header, type ActiveView } from "@/components/layout/Header";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { PromptBar } from "@/components/ai/PromptBar";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import { ResponseThread } from "@/components/ai/ResponseThread";
import { PinnedItems } from "@/components/ai/PinnedItems";
import { WorkflowLibrary } from "@/components/workflow/WorkflowLibrary";
import { WorkflowProgress, type WorkflowProgressState } from "@/components/workflow/WorkflowProgress";
import { findWorkflowByPrompt } from "@/lib/data/workflows";
import { notifications as seedNotifications } from "@/lib/data/seed-notifications";
import type { AppUser, ChatMessage, Notification, WorkflowDefinition } from "@/lib/data/types";
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
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const threadRef = useRef<HTMLDivElement>(null);

  // Workflow progress tracking
  const [workflowProgress, setWorkflowProgress] = useState<WorkflowProgressState | null>(null);
  const activeWorkflowRef = useRef<WorkflowDefinition | null>(null);
  const completedStepsRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Match SSE toolNames to workflow steps and advance progress
  const advanceWorkflowProgress = useCallback((toolNames: string[]) => {
    const workflow = activeWorkflowRef.current;
    if (!workflow) return;

    let latestMatchedIdx = -1;
    for (const toolName of toolNames) {
      const idx = workflow.steps.findIndex((s) => s.toolName === toolName);
      if (idx > latestMatchedIdx) latestMatchedIdx = idx;
    }

    if (latestMatchedIdx >= 0) {
      // Mark all steps before the current one as completed
      for (let i = 0; i < latestMatchedIdx; i++) {
        completedStepsRef.current.add(workflow.steps[i].id);
      }
      const currentStepId = workflow.steps[latestMatchedIdx].id;

      setWorkflowProgress({
        workflow,
        completedStepIds: Array.from(completedStepsRef.current),
        currentStepId,
        isComplete: false,
      });
    }
  }, []);

  const completeWorkflowProgress = useCallback(() => {
    const workflow = activeWorkflowRef.current;
    if (!workflow) return;

    // Mark all steps as completed
    const allStepIds = workflow.steps.map((s) => s.id);

    setWorkflowProgress({
      workflow,
      completedStepIds: allStepIds,
      currentStepId: null,
      isComplete: true,
    });

    // Clear the active workflow ref after a delay
    setTimeout(() => {
      activeWorkflowRef.current = null;
      completedStepsRef.current = new Set();
    }, 1000);
  }, []);

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

      // Check if this prompt matches a workflow for progress tracking
      if (!activeWorkflowRef.current) {
        const matchedWorkflow = findWorkflowByPrompt(content.trim());
        if (matchedWorkflow) {
          activeWorkflowRef.current = matchedWorkflow;
          completedStepsRef.current = new Set();
          setWorkflowProgress({
            workflow: matchedWorkflow,
            completedStepIds: [],
            currentStepId: matchedWorkflow.steps[0]?.id || null,
            isComplete: false,
          });
        }
      }

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
                // Advance workflow progress if toolNames present
                if (data.toolNames && Array.isArray(data.toolNames)) {
                  advanceWorkflowProgress(data.toolNames);
                }
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
                completeWorkflowProgress();
              } else if (data.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: `⚠️ ${data.message || "I encountered an error. Please try again."}`,
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
                    "⚠️ Connection error.",
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
    [messages, isLoading, currentUser.role, advanceWorkflowProgress, completeWorkflowProgress]
  );

  const handleRunWorkflow = useCallback(
    (workflow: WorkflowDefinition) => {
      // Set up progress tracking
      activeWorkflowRef.current = workflow;
      completedStepsRef.current = new Set();
      setWorkflowProgress({
        workflow,
        completedStepIds: [],
        currentStepId: workflow.steps[0]?.id || null,
        isComplete: false,
      });

      // Switch to chat view and send the prompt
      setActiveView("chat");
      // Small delay to let view switch render
      setTimeout(() => {
        sendMessage(workflow.prompt);
      }, 100);
    },
    [sendMessage]
  );

  const handlePin = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m))
    );
  }, []);

  const handleEntityClick = useCallback(
    (type: string, id: string) => {
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
        const query = `Regarding this from your previous response: "${selectedText}"\n\nCan you go deeper on this? Provide more detail, related data, and any actions I should consider.`;
        sendMessage(query);
      } else if (context) {
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
      setActiveView("chat");
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
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main content area — switches between chat and library */}
      {activeView === "chat" ? (
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

            {/* Workflow progress + streaming status */}
            {isLoading && workflowProgress && !workflowProgress.isComplete && (
              <div className="px-4 pt-2">
                <div className="max-w-4xl mx-auto">
                  <WorkflowProgress progress={workflowProgress} />
                </div>
              </div>
            )}

            {isLoading && streamStatus && !workflowProgress && (
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
                  onOpenLibrary={() => setActiveView("library")}
                  onRunWorkflow={handleRunWorkflow}
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
      ) : (
        <WorkflowLibrary onRunWorkflow={handleRunWorkflow} />
      )}

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

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ConversationList } from "@/components/layout/ConversationList";
import { ModelSelector, type ModelConfig } from "@/components/chat/ModelSelector";
import { SessionExpiredModal } from "@/components/auth/SessionExpiredModal";
import { useSessionExpired } from "@/hooks/useSessionExpired";
import { Settings, Menu, Check } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

type ErrorType = "network" | "auth" | "quota" | "server" | "unknown";

interface Message {
  id: string;
  role: string;
  content: string;
  modelId?: string;
  failed?: boolean;
  errorMessage?: string;
  errorType?: ErrorType;
}

export default function ChatHomePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { showModal: showSessionExpiredModal, setShowModal: setShowSessionExpiredModal, handleUnauthorized } = useSessionExpired();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conversation state
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Model state
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [modelSwitchMessage, setModelSwitchMessage] = useState<string | null>(null);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [failedMessageContent, setFailedMessageContent] = useState<string | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user's model configs
  useEffect(() => {
    if (session?.user) {
      fetchModelConfigs();
    }
  }, [session]);

  const fetchModelConfigs = async () => {
    try {
      const res = await fetch("/api/model-configs");
      if (res.ok) {
        const data = await res.json();
        const enabledModels = data.filter((m: ModelConfig) => m.enabled);
        setModelConfigs(enabledModels);
        // Don't auto-select here - let conversation loading handle it
      }
    } catch (error) {
      console.error("Failed to fetch model configs:", error);
    }
  };

  // Note: Removed auto-creation of conversation on mount
  // Conversations are now only created when user explicitly clicks "New Chat"
  // or sends their first message

  const createNewConversation = async () => {
    try {
      const defaultModelId = selectedModel?.modelId || modelConfigs[0]?.modelId || "gpt-4o-mini";
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "新对话",
          modelId: defaultModelId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversation(data);
        setMessages([]); // Clear messages for new conversation

        // Set selected model based on new conversation
        const model = modelConfigs.find(m => m.modelId === data.modelId);
        if (model) {
          setSelectedModel(model);
        } else if (modelConfigs.length > 0) {
          setSelectedModel(modelConfigs[0]);
        }
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // Load messages and sync model when conversation changes
  useEffect(() => {
    if (conversation?.id && session?.user) {
      loadConversationData(conversation.id);
    }
  }, [conversation?.id, session]);

  const loadConversationData = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        const conversationData = data.conversation;
        const messagesData = data.messages;

        // Update conversation state
        setConversation(conversationData);

        // Update messages
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          modelId: msg.modelId,
        }));
        setMessages(formattedMessages);

        // Sync model selector with conversation's modelId
        if (conversationData.modelId && modelConfigs.length > 0) {
          const model = modelConfigs.find(m => m.modelId === conversationData.modelId);
          if (model) {
            setSelectedModel(model);
          } else {
            // If conversation's model is not in user's configs, use first available
            setSelectedModel(modelConfigs[0]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  // Handle model switch - update conversation in backend
  const handleModelChange = useCallback(async (model: ModelConfig) => {
    // If no conversation exists, just set the selected model
    // It will be used when creating a new conversation
    if (!conversation?.id) {
      setSelectedModel(model);
      setModelSwitchMessage(`已选择 ${model.name || model.modelId}，发送消息后生效`);
      setTimeout(() => setModelSwitchMessage(null), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: model.modelId }),
      });

      if (res.ok) {
        const updatedConversation = await res.json();
        setConversation(updatedConversation);
        setSelectedModel(model);

        // Show success message
        setModelSwitchMessage(`已切换到 ${model.name || model.modelId}`);
        setTimeout(() => setModelSwitchMessage(null), 3000);
      } else {
        throw new Error("Failed to update conversation model");
      }
    } catch (error) {
      console.error("Failed to switch model:", error);
      throw error; // Re-throw to let ModelSelector handle the error state
    }
  }, [conversation?.id]);

  const handleSendFromInput = async (message: string) => {
    if (!message.trim()) return;

    // Create conversation if it doesn't exist
    if (!conversation?.id) {
      await createNewConversation();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!conversation?.id) {
      console.error("Failed to create conversation");
      return;
    }

    const messageContent = message.trim();
    const messageId = Date.now().toString();

    setIsLoading(true);
    setFailedMessageContent(null);

    // Append user message locally
    setMessages(prev => [...prev, { id: messageId, role: "user", content: messageContent }]);

    try {
      let response: Response;
      try {
        response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversation.id,
            messages: [...messages, { role: "user", content: messageContent }],
          }),
        });
      } catch (fetchError) {
        // Network error - fetch failed entirely
        console.error("[ERROR] Network error:", fetchError);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, failed: true, errorMessage: "网络连接失败，请检查网络", errorType: "network" as ErrorType }
              : msg
          )
        );
        setFailedMessageContent(messageContent);
        return;
      }

      if (!response.ok) {
        // Classify error based on HTTP status code
        let errorMsg = "发送失败";
        let errorType: ErrorType = "unknown";

        // Try to parse error as JSON for more details
        try {
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch {
          // Response not JSON, use status text
        }

        // Classify error by status code
        switch (response.status) {
          case 401:
            errorType = "auth";
            errorMsg = "API 密钥无效，请在设置中检查";
            break;
          case 429:
            errorType = "quota";
            errorMsg = "API 配额已用尽，请稍后重试";
            break;
          case 500:
          case 502:
          case 503:
            errorType = "server";
            errorMsg = "服务暂时不可用，请稍后重试";
            break;
          default:
            if (response.status >= 400 && response.status < 500) {
              errorType = "auth";
            } else {
              errorType = "server";
            }
        }

        // Mark message as failed with error details
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, failed: true, errorMessage: errorMsg, errorType }
              : msg
          )
        );
        setFailedMessageContent(messageContent);
        throw new Error(errorMsg);
      }

      console.log("[DEBUG] Response OK, starting stream read...");
      console.log("[DEBUG] Response body:", response.body);

      // Read the streaming text response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      const assistantId = (Date.now() + 1).toString();

      // Add placeholder for assistant message with current model
      setMessages(prev => [...prev, {
        id: assistantId,
        role: "assistant",
        content: "",
        modelId: selectedModel?.modelId
      }]);

      if (reader) {
        console.log("[DEBUG] Reader obtained, starting to read chunks...");
        let chunkCount = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log(`[DEBUG] Stream finished after ${chunkCount} chunks, total length: ${assistantMessage.length}`);
              break;
            }

            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            console.log(`[DEBUG] Chunk ${chunkCount}: ${chunk.length} chars`);
            assistantMessage += chunk;

            // Update message content in real-time
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantId ? { ...msg, content: assistantMessage } : msg
              )
            );
          }

          // Handle empty response
          if (assistantMessage.length === 0) {
            console.warn("[WARN] Received empty response from AI");
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantId
                  ? { ...msg, content: "（AI 未返回内容）", failed: true, errorMessage: "AI 未返回任何内容", errorType: "server" as ErrorType }
                  : msg
              )
            );
          }
        } catch (readError) {
          console.error("[ERROR] Failed to read stream:", readError);
          throw readError;
        }
      } else {
        console.error("[ERROR] No response body reader available!");
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: "（无法读取 AI 响应）", failed: true, errorMessage: "无法读取响应流", errorType: "server" as ErrorType }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!failedMessageContent) return;

    // Remove the failed message
    setMessages(prev => prev.filter(msg => !msg.failed));

    // Retry sending
    await handleSendFromInput(failedMessageContent);
  };

  const handleNewChat = async () => {
    setConversation(null);
    setMessages([]);
    await createNewConversation();
  };

  // Handle selecting a conversation from the sidebar
  const handleConversationSelect = (conversationId: string) => {
    if (conversationId !== conversation?.id) {
      setConversation({ id: conversationId } as Conversation);
      setMessages([]);
    }
  };

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const conversationTitle = conversation?.title || "新对话";

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed top-3 left-3 z-50 p-2 bg-background border rounded-lg shadow-sm lg:hidden"
        aria-label={showSidebar ? "隐藏侧边栏" : "显示侧边栏"}
      >
        <Menu className="w-5 h-5" />
      </button>

      {showSidebar && (
        <aside className="w-64 flex-shrink-0 border-r bg-background">
          <ConversationList
            currentId={conversation?.id}
            onNewChat={handleNewChat}
          />
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            {/* Conversation title */}
            <h1 className="font-medium truncate max-w-[200px]" title={conversationTitle}>
              {conversationTitle}
            </h1>

            {/* Model Selector */}
            <ModelSelector
              models={modelConfigs}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              disabled={isLoading}
            />

            {/* Model switch success message */}
            {modelSwitchMessage && (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-left-2">
                <Check className="w-4 h-4" />
                <span>{modelSwitchMessage}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/settings")}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  {modelConfigs.length === 0
                    ? "请先在设置中添加 API Key"
                    : "开始对话"}
                </p>
                {selectedModel && modelConfigs.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    当前模型：{selectedModel.name || selectedModel.modelId}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role as "user" | "assistant" | "system"}
                  content={msg.content}
                  modelId={msg.role === "assistant" ? msg.modelId : undefined}
                  failed={msg.failed}
                  errorMessage={msg.errorMessage}
                  errorType={msg.errorType}
                  onRetry={msg.failed ? handleRetry : undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSendFromInput}
              disabled={isLoading || !conversation?.id || modelConfigs.length === 0}
              placeholder={
                modelConfigs.length === 0
                  ? "请先在设置中添加 API Key"
                  : isLoading
                    ? "AI 正在思考..."
                    : "输入消息..."
              }
            />
          </div>
        </div>
      </main>

      {/* Session Expired Modal */}
      <SessionExpiredModal
        isOpen={showSessionExpiredModal}
        onClose={() => setShowSessionExpiredModal(false)}
      />
    </div>
  );
}

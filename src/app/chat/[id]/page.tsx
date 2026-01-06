"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, MessageSquare, Settings, ChevronDown, Trash2, Download } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ConversationList } from "@/components/layout/ConversationList";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

interface ModelConfig {
  id: string;
  provider: string;
  modelId: string;
  name: string;
  enabled: boolean;
}

interface Message {
  id: string;
  role: string;
  content: string;
}

export default function ChatPage({ params }: ChatPageProps) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
        setModelConfigs(data);
      }
    } catch (error) {
      console.error("Failed to fetch model configs:", error);
    }
  };

  // Fetch conversation details and messages
  useEffect(() => {
    if (session?.user && conversationId) {
      loadConversation();
    }
  }, [conversationId, session]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showModelSelector || showExportMenu) {
        if (!target.closest(".dropdown-menu")) {
          setShowModelSelector(false);
          setShowExportMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModelSelector, showExportMenu]);

  // Set selected model based on conversation
  useEffect(() => {
    if (conversation && modelConfigs.length > 0) {
      const matchingModel = modelConfigs.find(
        (m) => m.modelId === conversation.modelId
      );
      if (matchingModel) {
        setSelectedModel(matchingModel);
      } else if (modelConfigs.length > 0) {
        setSelectedModel(modelConfigs[0]);
      }
    }
  }, [conversation, modelConfigs]);

  const loadConversation = async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        setMessages(data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        })));
      } else if (res.status === 404) {
        router.push("/chat");
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.id}`);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleModelChange = async (model: ModelConfig) => {
    setSelectedModel(model);
    setShowModelSelector(false);

    // Update conversation's model
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: model.modelId }),
      });
    } catch (error) {
      console.error("Failed to update conversation model:", error);
    }
  };

  const handleDeleteConversation = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // 删除成功，跳转到对话列表
        router.push("/chat");
      } else {
        const error = await res.json();
        console.error("Failed to delete conversation:", error.error);
        alert("删除失败，请重试");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("删除失败，请重试");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExport = async (desensitize: boolean = false) => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const url = `/api/export/${conversationId}?format=md&desensitize=${desensitize}`;

      // 创建下载链接
      const link = document.createElement("a");
      link.href = url;
      link.download = ""; // 让服务器指定文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting conversation:", error);
      alert("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendFromInput = async (message: string) => {
    if (!conversationId || !message.trim()) return;

    const messageContent = message.trim();
    const messageId = Date.now().toString();

    setIsLoading(true);
    setMessages(prev => [...prev, { id: messageId, role: "user", content: messageContent }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [...messages, { role: "user", content: messageContent }],
        }),
      });

      if (!response.ok) {
        let errorMsg = "发送失败";
        try {
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch {
          const text = await response.text();
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      const assistantId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          // Simply accumulate text from the stream
          assistantMessage += chunk;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId ? { ...msg, content: assistantMessage } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="w-64 flex-shrink-0 border-r">
          <ConversationList
            currentId={conversationId}
            onNewChat={handleNewChat}
          />
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 hover:bg-accent rounded-lg"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            <h1 className="font-medium truncate">
              {conversation?.title || "对话"}
            </h1>

            {/* Model Selector */}
            {modelConfigs.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md"
                >
                  <span className="truncate max-w-[120px]">
                    {selectedModel?.name || selectedModel?.modelId}
                  </span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                </button>

                {showModelSelector && (
                  <div className="dropdown-menu absolute top-full left-0 mt-1 w-56 bg-background border rounded-md shadow-lg z-10">
                    {modelConfigs.map((config) => (
                      <button
                        key={config.id}
                        onClick={() => handleModelChange(config)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex flex-col"
                      >
                        <span className="font-medium">{config.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {config.provider} / {config.modelId}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-accent rounded-lg lg:hidden"
            >
              {showSidebar ? <ArrowLeft className="w-5 h-5" /> : "☰"}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 hover:bg-accent rounded-lg"
                title="导出对话"
                disabled={isExporting}
              >
                <Download className="w-5 h-5" />
              </button>

              {showExportMenu && (
                <div className="dropdown-menu absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg z-10">
                  <button
                    onClick={() => handleExport(false)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4" />
                    导出对话（完整）
                  </button>
                  <button
                    onClick={() => handleExport(true)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4" />
                    导出对话（脱敏）
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-lg"
              title="删除对话"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="p-2 hover:bg-accent rounded-lg"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">开始对话</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role as "user" | "assistant" | "system"}
                  content={message.content}
                  isStreaming={false}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSendFromInput}
              disabled={isLoading}
              placeholder={isLoading ? "AI 正在思考..." : "输入消息..."}
            />
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="删除对话"
        message={`确定要删除对话"${conversation?.title || "未命名对话"}"吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConversation}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}


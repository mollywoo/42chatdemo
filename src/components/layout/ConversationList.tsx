"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare, Trash2, Search, X, MoreVertical, Edit2, Archive, ArchiveRestore, FolderOpen } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

interface ConversationListProps {
  currentId?: string;
  onNewChat: () => void;
}

export function ConversationList({ currentId, onNewChat }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [archiving, setArchiving] = useState<string | null>(null);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      fetchConversations();
    }
  }, [session, showArchived, currentId]); // 当前对话ID变化时也刷新列表

  const fetchConversations = useCallback(async (query?: string) => {
    setSearching(!!query);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (showArchived) params.set("archived", "true");

      const url = `/api/conversations${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [showArchived]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (session?.user) {
        fetchConversations(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, session, fetchConversations]);

  const handleDeleteClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setDeleteTarget(conversation);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    const id = deleteTarget.id;
    setDeleting(id);
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentId === id) {
          router.push("/chat");
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const handleRenameClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setRenameTarget(conversation);
    setRenameValue(conversation.title || "");
    setActiveMenu(null);
  };

  const handleRenameSubmit = async () => {
    if (!renameTarget || !renameValue.trim()) return;

    const id = renameTarget.id;
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c))
        );
        setRenameTarget(null);
        setRenameValue("");
      }
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
  };

  const handleRenameCancel = () => {
    setRenameTarget(null);
    setRenameValue("");
  };

  const handleArchiveClick = async (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    const id = conversation.id;
    setArchiving(id);
    setActiveMenu(null);

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentId === id) {
          router.push("/chat");
        }
      }
    } catch (error) {
      console.error("Failed to archive conversation:", error);
    } finally {
      setArchiving(null);
    }
  };

  const handleUnarchiveClick = async (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    const id = conversation.id;
    setUnarchiving(id);
    setActiveMenu(null);

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentId === id) {
          router.push("/chat");
        }
      }
    } catch (error) {
      console.error("Failed to unarchive conversation:", error);
    } finally {
      setUnarchiving(null);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <>
      <div className="flex flex-col h-full bg-muted/30">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建对话</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索对话..."
              className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Archived Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              showArchived
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50 text-muted-foreground"
            }`}
          >
            {showArchived ? (
              <MessageSquare className="w-4 h-4" />
            ) : (
              <FolderOpen className="w-4 h-4" />
            )}
            <span>{showArchived ? "查看活跃对话" : "查看归档对话"}</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading || searching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searching ? "搜索中..." : "加载中..."}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? "未找到匹配的对话" : "暂无对话"}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors relative ${currentId === conversation.id
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                    }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{conversation.title}</p>
                      {conversation.archived && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded flex-shrink-0">
                          已归档
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conversation.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleMenuClick(e, conversation.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-all"
                    disabled={archiving === conversation.id || unarchiving === conversation.id || deleting === conversation.id}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === conversation.id && (
                    <div className="absolute right-2 top-full mt-1 w-40 bg-background border rounded-lg shadow-lg z-10">
                      <button
                        onClick={(e) => handleRenameClick(e, conversation)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        重命名
                      </button>
                      {conversation.archived ? (
                        <button
                          onClick={(e) => handleUnarchiveClick(e, conversation)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                          disabled={unarchiving === conversation.id}
                        >
                          <ArchiveRestore className="w-3 h-3" />
                          取消归档
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleArchiveClick(e, conversation)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                          disabled={archiving === conversation.id}
                        >
                          <Archive className="w-3 h-3" />
                          归档
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteClick(e, conversation)}
                        disabled={deleting === conversation.id}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 hover:text-destructive flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="删除对话"
        message={`确定要删除对话「${deleteTarget?.title || ""}」吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Rename Dialog */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleRenameCancel}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-background border rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">重命名对话</h2>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") handleRenameCancel();
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入新标题"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleRenameCancel}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
              >
                取消
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={!renameValue.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

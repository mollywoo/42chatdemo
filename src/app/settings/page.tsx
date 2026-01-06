"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Settings, Key, Trash2, Plus, Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ModelConfig {
  id: string;
  provider: string;
  modelId: string;
  name: string;
  enabled: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    provider: "openrouter",
    modelId: "openai/gpt-4o-mini",
    name: "",
    apiKey: "",
  });

  // Fetch model configs
  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/model-configs");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error("Failed to fetch configs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchConfigs();
    } else if (!isPending && !session) {
      // Session loaded but user not authenticated, redirect to login
      router.push("/login");
    }
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/model-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          provider: "openrouter",
          modelId: "openai/gpt-4o-mini",
          name: "",
          apiKey: "",
        });
        setShowAddForm(false);
        fetchConfigs();
      }
    } catch (error) {
      console.error("Failed to create config:", error);
    }
  };

  const handleDeleteClick = (id: string) => {
    console.log("Delete button clicked for id:", id);
    setConfigToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!configToDelete) return;

    console.log("User confirmed deletion");
    setDeleteConfirmOpen(false);

    try {
      console.log("Sending DELETE request to:", `/api/model-configs/${configToDelete}`);
      const res = await fetch(`/api/model-configs/${configToDelete}`, {
        method: "DELETE",
      });

      console.log("DELETE response status:", res.status);
      const data = await res.json();
      console.log("DELETE response data:", data);

      if (res.ok) {
        alert("删除成功！");
        fetchConfigs();
      } else {
        alert(`删除失败：${data.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("Failed to delete config:", error);
      alert(`删除失败：${error}`);
    } finally {
      setConfigToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    console.log("User cancelled deletion");
    setDeleteConfirmOpen(false);
    setConfigToDelete(null);
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResults((prev) => ({ ...prev, [id]: { success: false, message: "" } }));

    try {
      const res = await fetch(`/api/model-configs/${id}/test`, {
        method: "POST",
      });

      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: data.success,
          message: data.success ? "连接成功" : data.error || "测试失败",
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, message: "网络错误" },
      }));
    } finally {
      setTestingId(null);
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
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">未登录，正在跳转...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h1 className="font-semibold">设置</h1>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            返回对话
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Model Configs Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">模型配置</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              添加配置
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-4">添加新的 API 配置</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">服务商</label>
                  <select
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">模型</label>
                  <input
                    type="text"
                    value={formData.modelId}
                    onChange={(e) =>
                      setFormData({ ...formData, modelId: e.target.value })
                    }
                    placeholder="例如: openai/gpt-4o-mini"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    OpenRouter 使用格式: openai/gpt-4o-mini, anthropic/claude-3-haiku 等
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">名称（可选）</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="例如: 我的工作密钥"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    placeholder="sk-..."
                    required
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border rounded-md hover:bg-accent"
                  >
                    取消
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Configs List */}
          {loading ? (
            <p className="text-muted-foreground">加载中...</p>
          ) : configs.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                还没有配置任何 API Key
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-primary hover:underline"
              >
                添加第一个配置
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="p-4 border rounded-lg bg-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{config.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          {config.provider}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {config.modelId}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {showApiKey[config.id]
                          ? "••••••••••••••••"
                          : "••••••••••••••••"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTest(config.id)}
                        disabled={testingId === config.id}
                        className="p-2 hover:bg-accent rounded-md disabled:opacity-50"
                        title="测试连接"
                      >
                        {testingId === config.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setShowApiKey({
                            ...showApiKey,
                            [config.id]: !showApiKey[config.id],
                          })
                        }
                        className="p-2 hover:bg-accent rounded-md"
                        title={showApiKey[config.id] ? "隐藏" : "显示"}
                      >
                        {showApiKey[config.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(config.id)}
                        className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-md"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {testResults[config.id] && (
                    <div
                      className={`text-sm mt-3 px-2 py-1 rounded ${testResults[config.id].success
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                    >
                      {testResults[config.id].message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info Section */}
        <section className="p-4 border rounded-lg bg-muted/50">
          <h3 className="font-medium mb-2">关于 API Key</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• API Key 将加密存储在数据库中</li>
            <li>• 每个用户可以配置多个服务商的 API Key</li>
            <li>
              • 获取 OpenAI API Key:{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com
              </a>
            </li>
          </ul>
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="删除配置"
        message="确定要删除这个模型配置吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

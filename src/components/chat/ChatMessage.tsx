"use client";

import { User, Bot, AlertCircle, RefreshCw, WifiOff, KeyRound, Clock, ServerCrash } from "lucide-react";

export interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  modelId?: string;
  isStreaming?: boolean;
  failed?: boolean;
  errorMessage?: string;
  errorType?: "network" | "auth" | "quota" | "server" | "unknown";
  onRetry?: () => void;
}

// Get error icon based on error type
function getErrorIcon(errorType?: string) {
  switch (errorType) {
    case "network":
      return <WifiOff className="w-3 h-3" />;
    case "auth":
      return <KeyRound className="w-3 h-3" />;
    case "quota":
      return <Clock className="w-3 h-3" />;
    case "server":
      return <ServerCrash className="w-3 h-3" />;
    default:
      return <AlertCircle className="w-3 h-3" />;
  }
}

export function ChatMessage({
  role,
  content,
  modelId,
  isStreaming,
  failed,
  errorMessage,
  errorType,
  onRetry
}: ChatMessageProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="flex flex-col gap-1 max-w-[70%]">
        {/* Model indicator for assistant messages */}
        {!isUser && modelId && (
          <span className="text-xs text-muted-foreground ml-1">
            {modelId}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${isUser
            ? failed
              ? "bg-destructive/10 text-destructive border border-destructive/30 rounded-br-sm"
              : "bg-primary text-primary-foreground rounded-br-sm"
            : failed
              ? "bg-destructive/10 text-destructive border border-destructive/30 rounded-bl-sm"
              : "bg-muted rounded-bl-sm"
            }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {content}
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1" />
            )}
          </p>
        </div>
        {failed && (
          <div className="flex items-center gap-2 text-destructive text-xs flex-wrap">
            {getErrorIcon(errorType)}
            <span>{errorMessage || "发送失败"}</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 px-2 py-0.5 bg-destructive/10 hover:bg-destructive/20 rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                重试
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${failed ? "bg-destructive/20" : "bg-primary"
          }`}>
          <User className={`w-4 h-4 ${failed ? "text-destructive" : "text-primary-foreground"}`} />
        </div>
      )}
    </div>
  );
}



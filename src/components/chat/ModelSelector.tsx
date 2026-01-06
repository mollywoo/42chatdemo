"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";

export interface ModelConfig {
    id: string;
    provider: string;
    modelId: string;
    name: string;
    enabled: boolean;
}

interface ModelSelectorProps {
    models: ModelConfig[];
    selectedModel: ModelConfig | null;
    onModelChange: (model: ModelConfig) => Promise<void>;
    disabled?: boolean;
    isLoading?: boolean;
}

export function ModelSelector({
    models,
    selectedModel,
    onModelChange,
    disabled = false,
    isLoading = false,
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleModelSelect = async (model: ModelConfig) => {
        if (model.id === selectedModel?.id) {
            setIsOpen(false);
            return;
        }

        setIsSwitching(true);
        try {
            await onModelChange(model);
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to switch model:", error);
        } finally {
            setIsSwitching(false);
        }
    };

    // Filter to only show enabled models
    const enabledModels = models.filter((m) => m.enabled);

    if (enabledModels.length === 0) {
        return (
            <div className="text-sm text-muted-foreground px-3 py-1.5">
                暂无可用模型
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || isSwitching}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label="选择模型"
            >
                {isSwitching || isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>切换中...</span>
                    </>
                ) : (
                    <>
                        <span className="max-w-[150px] truncate">
                            {selectedModel?.name || selectedModel?.modelId || "选择模型"}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                    role="listbox"
                    aria-label="模型列表"
                >
                    <div className="py-1 max-h-64 overflow-y-auto">
                        {enabledModels.map((model) => {
                            const isSelected = model.id === selectedModel?.id;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => handleModelSelect(model)}
                                    className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-start gap-2 ${isSelected
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent/50"
                                        }`}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{model.name || model.modelId}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {model.provider} / {model.modelId}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

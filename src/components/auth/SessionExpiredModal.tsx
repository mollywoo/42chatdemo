"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogIn, AlertTriangle } from "lucide-react";

interface SessionExpiredModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

export function SessionExpiredModal({ isOpen, onClose }: SessionExpiredModalProps) {
    const router = useRouter();
    const pathname = usePathname();

    if (!isOpen) return null;

    const handleLogin = () => {
        // Redirect to login with current path as callback
        const redirectUrl = encodeURIComponent(pathname);
        router.push(`/login?redirect=${redirectUrl}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-background rounded-lg shadow-lg p-6 max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-semibold">会话已过期</h2>

                    {/* Message */}
                    <p className="text-muted-foreground text-sm">
                        您的登录会话已过期，请重新登录以继续操作。登录后将自动返回当前页面。
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 mt-2">
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors"
                            >
                                取消
                            </button>
                        )}
                        <button
                            onClick={handleLogin}
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            重新登录
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

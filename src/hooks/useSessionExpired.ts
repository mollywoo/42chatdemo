"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "@/lib/auth/client";

interface UseSessionExpiredOptions {
    // Check session periodically (in milliseconds)
    checkInterval?: number;
}

/**
 * Hook to detect and handle session expiration
 * 
 * Returns:
 * - isSessionExpired: whether the session has expired
 * - showModal: whether to show the session expired modal
 * - setShowModal: function to control modal visibility
 * - checkSession: function to manually check session status
 * - handleUnauthorized: function to call when receiving 401 response
 */
export function useSessionExpired(options: UseSessionExpiredOptions = {}) {
    const { checkInterval = 0 } = options;
    const { data: session, isPending } = useSession();

    const [showModal, setShowModal] = useState(false);
    const [wasAuthenticated, setWasAuthenticated] = useState(false);

    // Track if user was previously authenticated
    useEffect(() => {
        if (!isPending && session?.user) {
            setWasAuthenticated(true);
        }
    }, [session, isPending]);

    // Detect session expiration (was authenticated, now not)
    useEffect(() => {
        if (!isPending && wasAuthenticated && !session?.user) {
            setShowModal(true);
        }
    }, [session, isPending, wasAuthenticated]);

    // Handle 401 responses from API calls
    const handleUnauthorized = useCallback(() => {
        setShowModal(true);
    }, []);

    // Check session status (can be called after API errors)
    const checkSession = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/get-session");
            if (res.status === 401 || !res.ok) {
                setShowModal(true);
                return false;
            }
            const data = await res.json();
            if (!data?.user) {
                setShowModal(true);
                return false;
            }
            return true;
        } catch {
            // Network error, don't show session expired modal
            return false;
        }
    }, []);

    // Optional periodic check
    useEffect(() => {
        if (checkInterval > 0) {
            const interval = setInterval(checkSession, checkInterval);
            return () => clearInterval(interval);
        }
    }, [checkInterval, checkSession]);

    return {
        isSessionExpired: wasAuthenticated && !session?.user && !isPending,
        showModal,
        setShowModal,
        checkSession,
        handleUnauthorized,
    };
}

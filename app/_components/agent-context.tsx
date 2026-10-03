"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchAgentMessages,
  forgetAgentThread,
  sendAgentMessage,
  type AgentChatMessage,
} from "@/lib/agent-client";
import { useUser } from "./user-context";

type AgentContextValue = {
  isOpen: boolean;
  messages: AgentChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  send: (message: string) => Promise<void>;
  forget: () => Promise<void>;
};

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setMessages([]);
    setHasLoaded(false);
    setError(null);
    setIsOpen(false);
  }, [user?.id]);

  const loadMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAgentMessages(user.id);
      setMessages(result.messages);
      setHasLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się wczytać rozmowy");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const open = useCallback(() => {
    setIsOpen(true);
    if (!hasLoaded) {
      void loadMessages();
    }
  }, [hasLoaded, loadMessages]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((current) => {
      const next = !current;
      if (next && !hasLoaded) {
        void loadMessages();
      }
      return next;
    });
  }, [hasLoaded, loadMessages]);

  const send = useCallback(
    async (message: string) => {
      if (!user) {
        return;
      }
      const text = message.trim();
      if (!text) {
        return;
      }

      setIsSending(true);
      setError(null);
      setMessages((current) => [...current, { role: "user", content: text }]);
      try {
        const result = await sendAgentMessage({ userId: user.id, message: text });
        setMessages(result.messages);
        setHasLoaded(true);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Nie udało się wysłać wiadomości");
        setMessages((current) =>
          current.at(-1)?.role === "user" && current.at(-1)?.content === text
            ? current.slice(0, -1)
            : current,
        );
      } finally {
        setIsSending(false);
      }
    },
    [user],
  );

  const forget = useCallback(async () => {
    if (!user) {
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await forgetAgentThread(user.id);
      setMessages([]);
      setHasLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się wyczyścić rozmowy");
    } finally {
      setIsSending(false);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      isOpen,
      messages,
      isLoading,
      isSending,
      error,
      open,
      close,
      toggle,
      send,
      forget,
    }),
    [isOpen, messages, isLoading, isSending, error, open, close, toggle, send, forget],
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within AgentProvider");
  }
  return context;
}

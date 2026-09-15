"use client";

import { useEffect, useRef, useState } from "react";
import store from "@/providers/store";
import { chatApi } from "./api";
import {
  chatIdentity,
  isBookingConfirmation,
  MAX_INPUT,
  MAX_MESSAGES,
  RequestGate,
  type ChatMessage,
} from "./model";

type FailedSend = {
  text: string;
  metadata: Record<string, unknown>;
  history: ChatMessage[];
  pending: ChatMessage[];
};
export function usePatientChat(identity: string) {
  const authenticated = identity.startsWith("account:");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(authenticated);
  const [historyReady, setHistoryReady] = useState(!authenticated);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [failedSend, setFailedSend] = useState<FailedSend | null>(null);
  const gate = useRef(new RequestGate());
  const controllers = useRef(new Set<AbortController>());
  const active = useRef(true);

  function isCurrent() {
    return active.current && chatIdentity(store.getState().login) === identity;
  }
  function controller() {
    const request = new AbortController();
    controllers.current.add(request);
    return request;
  }

  useEffect(() => {
    active.current = true;
    const requests = controllers.current;
    const requestGate = gate.current;
    function abort() {
      active.current = false;
      requestGate.reset();
      requests.forEach((request) => request.abort());
      requests.clear();
    }
    // Cancel synchronously with auth changes, before React can render the new account.
    const unsubscribe = store.subscribe(() => {
      if (chatIdentity(store.getState().login) !== identity) abort();
    });
    if (authenticated) {
      const request = new AbortController();
      requests.add(request);
      void chatApi
        .load(request.signal)
        .then((history) => {
          if (!active.current || request.signal.aborted) return;
          setMessages(history);
          setHistoryReady(true);
        })
        .catch(() => {
          if (active.current && !request.signal.aborted) {
            setHistoryError(
              "Không tải được lịch sử. Bạn vẫn có thể gửi tin nhắn mới; lịch sử sẽ được đồng bộ lại sau.",
            );
            // History is optional for sending. Do not lock the composer because
            // a separate history request failed.
            setHistoryReady(true);
          }
        })
        .finally(() => {
          requests.delete(request);
          if (active.current && !request.signal.aborted) setHistoryBusy(false);
        });
    }
    return () => {
      unsubscribe();
      abort();
    };
  }, [identity, authenticated]);

  async function retryHistory() {
    if (!isCurrent() || historyBusy || loading) return;
    const requestId = gate.current.start();
    if (requestId === null) return;
    const request = controller();
    setHistoryBusy(true);
    setHistoryError(null);
    try {
      const history = await chatApi.load(request.signal);
      if (!isCurrent() || request.signal.aborted) return;
      setMessages(history);
      setHistoryReady(true);
    } catch {
      if (isCurrent() && !request.signal.aborted)
        setHistoryError("Không tải được lịch sử. Vui lòng thử lại.");
    } finally {
      controllers.current.delete(request);
      gate.current.finish(requestId);
      if (isCurrent() && !request.signal.aborted) setHistoryBusy(false);
    }
  }

  async function save(history: ChatMessage[], request: AbortController) {
    if (!authenticated || !isCurrent() || request.signal.aborted) return;
    try {
      await chatApi.save(history, request.signal);
      if (isCurrent() && !request.signal.aborted) setSaveError(null);
    } catch {
      if (isCurrent() && !request.signal.aborted)
        setSaveError("Tin nhắn chưa được lưu vào tài khoản.");
    }
  }

  async function send(
    text: string,
    metadata: Record<string, unknown> = {},
    retry?: FailedSend,
  ) {
    const value = text.trim();
    if (
      !value ||
      value.length > MAX_INPUT ||
      !isCurrent() ||
      !historyReady ||
      historyBusy ||
      identity === "hydrating"
    )
      return false;
    const requestId = gate.current.start();
    if (requestId === null) return false;
    const request = controller();
    const history = retry?.history ?? messages;
    const pending =
      retry?.pending ??
      [
        ...history,
        {
          id: crypto.randomUUID(),
          sender: "user" as const,
          text: value,
          metadata,
        },
      ].slice(-MAX_MESSAGES);
    setMessages(pending);
    setLoading(true);
    setError(null);
    setFailedSend(null);
    try {
      const reply = await chatApi.send(
        value,
        history,
        metadata,
        authenticated,
        request.signal,
      );
      if (
        !isCurrent() ||
        !gate.current.isCurrent(requestId) ||
        request.signal.aborted
      )
        return true;
      const completed = [
        ...pending,
        { ...reply, id: crypto.randomUUID(), sender: "bot" as const },
      ].slice(-MAX_MESSAGES);
      setMessages(completed);
      await save(completed, request);
    } catch {
      if (
        isCurrent() &&
        gate.current.isCurrent(requestId) &&
        !request.signal.aborted
      ) {
        setFailedSend({ text: value, metadata, history, pending });
        setError(
          isBookingConfirmation(value, metadata, history)
            ? "Chưa nhận được kết quả xác nhận. Lịch hẹn có thể đã được tạo; hãy kiểm tra lịch hẹn của bạn."
            : "Không nhận được phản hồi. Kiểm tra kết nối hoặc thử gửi lại.",
        );
      }
    } finally {
      controllers.current.delete(request);
      if (isCurrent() && gate.current.isCurrent(requestId)) {
        gate.current.finish(requestId);
        setLoading(false);
      }
    }
    return true;
  }

  async function retrySave() {
    if (!isCurrent() || historyBusy || loading) return;
    const requestId = gate.current.start();
    if (requestId === null) return;
    const request = controller();
    setHistoryBusy(true);
    await save(messages, request);
    controllers.current.delete(request);
    gate.current.finish(requestId);
    if (isCurrent() && !request.signal.aborted) setHistoryBusy(false);
  }

  async function clear() {
    if (!isCurrent() || loading || historyBusy) return;
    const requestId = gate.current.start();
    if (requestId === null) return;
    const request = controller();
    setHistoryBusy(true);
    try {
      if (authenticated) await chatApi.clear(request.signal);
      if (!isCurrent() || request.signal.aborted) return;
      gate.current.reset();
      setMessages([]);
      setFailedSend(null);
      setError(null);
      setSaveError(null);
      setHistoryError(null);
      setHistoryReady(true);
    } catch {
      if (isCurrent() && !request.signal.aborted)
        setHistoryError("Không xóa được lịch sử. Vui lòng thử lại.");
    } finally {
      controllers.current.delete(request);
      gate.current.finish(requestId);
      if (isCurrent() && !request.signal.aborted) setHistoryBusy(false);
    }
  }

  const busy = loading || historyBusy || identity === "hydrating";
  const uncertainBooking = Boolean(
    failedSend &&
    isBookingConfirmation(
      failedSend.text,
      failedSend.metadata,
      failedSend.history,
    ),
  );
  function checkAppointments() {
    const text = "Lịch hẹn sắp tới của tôi";
    // A fresh, read-only question must not carry a pending booking confirmation.
    return send(
      text,
      {},
      {
        text,
        metadata: {},
        history: [],
        pending: [
          ...messages,
          { id: crypto.randomUUID(), sender: "user" as const, text },
        ].slice(-MAX_MESSAGES),
      },
    );
  }
  return {
    messages,
    loading,
    historyBusy,
    busy,
    canSend: !busy && historyReady,
    error,
    historyError,
    saveError,
    authenticated,
    uncertainBooking,
    checkAppointments,
    send,
    retry: () =>
      failedSend && !uncertainBooking
        ? send(failedSend.text, failedSend.metadata, failedSend)
        : Promise.resolve(false),
    retryAnswer: () => {
      const question = messages.at(-2);
      if (
        messages.at(-1)?.metadata?.status !== "unavailable" ||
        question?.sender !== "user"
      )
        return Promise.resolve(false);
      const metadata = question.metadata ?? {};
      if (isBookingConfirmation(question.text, metadata, messages.slice(0, -2)))
        return checkAppointments();
      return send(question.text, metadata, {
        text: question.text,
        metadata,
        history: messages.slice(0, -2),
        pending: messages.slice(0, -1),
      });
    },
    retryHistory,
    retrySave,
    clear,
  };
}

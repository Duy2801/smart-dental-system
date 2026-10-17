"use client";

import { useEffect, useRef } from "react";
import { CaptchaWidget, type CaptchaHandle } from "@/features/auth/login/CaptchaWidget";

type CaptchaWindow = Window & {
  ReactNativeWebView?: { postMessage: (message: string) => void };
};

function postToApp(message: Record<string, unknown>) {
  (window as CaptchaWindow).ReactNativeWebView?.postMessage(JSON.stringify(message));
}

export default function MobileCaptchaPage() {
  const captchaRef = useRef<CaptchaHandle>(null);
  const rootRef = useRef<HTMLElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let request: { type?: string; requestId?: string };
      try {
        request = JSON.parse(event.data);
      } catch {
        return;
      }

      const captcha = captchaRef.current;
      if (!captcha) return;

      // Ứng dụng báo đăng nhập thất bại: token đã bị dùng, cần xác minh lại
      if (request.type === "refresh") {
        captcha.refresh();
        return;
      }
      // Backend yêu cầu giải câu đố thay cho lượt qua tự động
      if (request.type === "puzzle") {
        captcha.requirePuzzle();
        return;
      }
      if (request.type !== "verify" || !request.requestId) return;

      void captcha.verify().then((token) => {
        postToApp({ type: "verified", requestId: request.requestId, token });
      });
    };
    window.addEventListener("message", handleMessage);
    postToApp({ type: "ready" });
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Báo chiều cao nội dung để WebView trong ứng dụng co giãn theo (ô kiểm tra / câu đố)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      postToApp({ type: "resize", height: Math.ceil(root.getBoundingClientRect().height) });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <main ref={rootRef} className="bg-white p-2 text-slate-900">
      <CaptchaWidget ref={captchaRef} siteKey={siteKey} />
    </main>
  );
}

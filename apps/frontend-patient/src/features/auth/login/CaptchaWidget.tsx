"use client";

import {
  ChallengeType,
  recordBehavior,
  WauCaptchaClient,
  type BehaviorRecorder,
  type Challenge,
} from "@waucaptcha-sdk/client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type CaptchaHandle = {
  /** Xác minh mã người dùng nhập, trả về token hoặc null (kèm thông báo lỗi). */
  verify: () => Promise<string | null>;
  /** Tải ảnh mã mới, ví dụ sau khi backend đã dùng token. */
  refresh: () => void;
  /** Loại nhập mã trong ảnh luôn là câu đố: chỉ cần tải ảnh mới. */
  requirePuzzle: () => void;
};

type CaptchaWidgetProps = {
  siteKey?: string;
};

export const CaptchaWidget = forwardRef<CaptchaHandle, CaptchaWidgetProps>(
  function CaptchaWidget({ siteKey }, ref) {
    const [generation, setGeneration] = useState(0);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<WauCaptchaClient | null>(null);
    const recorderRef = useRef<BehaviorRecorder | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (!siteKey) return;

      const abort = new AbortController();
      const client = new WauCaptchaClient({
        siteKey,
        baseUrl: "https://api.waucaptcha.com",
        challengeType: ChallengeType.IMAGE_DISTORT,
      });
      clientRef.current = client;
      setChallenge(null);
      setAnswer("");
      setError(null);
      setLoading(true);

      void client
        .newChallenge({ signal: abort.signal })
        .then((nextChallenge) => {
          if (!abort.signal.aborted) setChallenge(nextChallenge);
        })
        .catch(() => {
          if (!abort.signal.aborted) {
            setError("Không tải được ảnh CAPTCHA. Hãy thử tải lại.");
          }
        })
        .finally(() => {
          if (!abort.signal.aborted) setLoading(false);
        });

      return () => {
        abort.abort();
        if (clientRef.current === client) clientRef.current = null;
      };
    }, [siteKey, generation]);

    useEffect(() => {
      if (!challenge || !rootRef.current || !inputRef.current) return;
      const recorder = recordBehavior({ root: rootRef.current, input: inputRef.current });
      recorderRef.current = recorder;
      return () => {
        recorder.stop();
        if (recorderRef.current === recorder) recorderRef.current = null;
      };
    }, [challenge]);

    function refresh() {
      if (siteKey) setGeneration((current) => current + 1);
    }

    useImperativeHandle(ref, () => ({
      refresh,
      requirePuzzle: refresh,
      async verify() {
        if (!siteKey) return null;
        if (verifying || loading || !challenge || !clientRef.current) {
          setError("CAPTCHA đang tải. Vui lòng thử lại.");
          return null;
        }
        if (!answer.trim()) {
          setError("Vui lòng nhập mã trong ảnh trước khi đăng nhập.");
          inputRef.current?.focus();
          return null;
        }
        if (Date.now() >= challenge.expiresAt.getTime()) {
          setError("Mã CAPTCHA đã hết hạn. Đang tải ảnh mới.");
          refresh();
          return null;
        }

        setVerifying(true);
        setError(null);
        try {
          const result = await clientRef.current.verify(challenge.id, answer.trim(), {
            behavior: recorderRef.current?.snapshot(),
          });
          if (result.success) {
            return result.token;
          }
          setError("Mã CAPTCHA không đúng. Vui lòng nhập mã trong ảnh mới.");
          refresh();
        } catch {
          setError("Không xác minh được CAPTCHA. Vui lòng thử lại.");
          refresh();
        } finally {
          setVerifying(false);
        }
        return null;
      },
    }));

    return (
      <div ref={rootRef} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/20">
        <label htmlFor="login-captcha-answer" className="mb-1.5 block text-xs font-semibold text-slate-700">
          Mã xác minh
        </label>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id="login-captcha-answer"
            type="text"
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Nhập mã"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={!siteKey || loading || verifying || !challenge}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-captcha-error" : undefined}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100 disabled:opacity-60 shadow-2xs"
          />
          <button
            type="button"
            onClick={refresh}
            disabled={!siteKey || loading || verifying}
            aria-label="Đổi mã CAPTCHA"
            title="Đổi mã CAPTCHA"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-[#0863c5] active:scale-95 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
          {challenge ? (
            // The provider returns a data URL, so Next image optimization is unnecessary.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={challenge.imageUrl}
              alt="Ảnh mã CAPTCHA cần nhập"
              width={challenge.width}
              height={challenge.height}
              className="h-10 w-28 shrink-0 rounded-lg border border-slate-200 object-cover shadow-2xs select-none sm:w-32"
            />
          ) : (
            <span className="flex h-10 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-1 text-center text-[10px] font-medium text-slate-500 sm:w-32">
              {siteKey ? (loading ? "Đang tải ảnh..." : "Chưa có ảnh mã") : "Chưa cấu hình CAPTCHA"}
            </span>
          )}
        </div>
        {error && <p id="login-captcha-error" role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  },
);

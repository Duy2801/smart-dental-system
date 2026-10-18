import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';
import {
  NativeWauCaptchaClient,
  WauCaptchaError,
  type WauBehavior,
  type WauChallenge,
} from '../captcha/wauCaptchaClient';

/** Kết quả xác minh: token nếu thành công, hoặc thông báo lỗi để hiển thị */
export type CaptchaVerifyResult = { token: string | null; message?: string };

export type CaptchaHandle = {
  /** Gửi mã người dùng đã nhập tới WAU để lấy token */
  verify: () => Promise<CaptchaVerifyResult>;
  /** Tải ảnh mã mới (token chỉ dùng được một lần) */
  refresh: () => void;
  /** Loại nhập mã trong ảnh luôn là câu đố: chỉ cần tải ảnh mới */
  requirePuzzle: () => void;
};

type NativeCaptchaProps = {
  siteKey: string;
  /** Domain web bệnh nhân gửi kèm header Origin, ví dụ http://localhost:3001 */
  origin?: string;
};

const MAX_POINTER = 200;
const MAX_KEY_INTERVALS = 64;

/** Ghi lại hành vi chạm / gõ trong lúc captcha hiển thị, theo định dạng behavior của WAU */
function createBehaviorRecorder() {
  let startedAt = Date.now();
  let pointer: WauBehavior['pointer'] = [];
  let lastPointerAt = 0;
  let keyIntervals: number[] = [];
  let lastKeyAt = 0;
  let inputEvents = 0;
  let pasteEvents = 0;
  let usedTouch = false;
  let hiddenMs = 0;
  let hiddenSince: number | null = null;

  return {
    reset() {
      startedAt = Date.now();
      pointer = [];
      lastPointerAt = 0;
      keyIntervals = [];
      lastKeyAt = 0;
      inputEvents = 0;
      pasteEvents = 0;
      usedTouch = false;
      hiddenMs = 0;
      hiddenSince = null;
    },
    touch(x: number, y: number) {
      const now = Date.now();
      if (now - lastPointerAt < 16) return;
      lastPointerAt = now;
      usedTouch = true;
      pointer.push({ t: now - startedAt, x: Math.round(x), y: Math.round(y) });
      if (pointer.length > MAX_POINTER) pointer = pointer.slice(-MAX_POINTER);
    },
    text(previous: string, next: string) {
      const now = Date.now();
      inputEvents += 1;
      if (next.length - previous.length > 1) pasteEvents += 1;
      if (lastKeyAt) {
        keyIntervals.push(now - lastKeyAt);
        if (keyIntervals.length > MAX_KEY_INTERVALS) keyIntervals = keyIntervals.slice(-MAX_KEY_INTERVALS);
      }
      lastKeyAt = now;
    },
    appHidden(hidden: boolean) {
      if (hidden && hiddenSince === null) hiddenSince = Date.now();
      if (!hidden && hiddenSince !== null) {
        hiddenMs += Date.now() - hiddenSince;
        hiddenSince = null;
      }
    },
    snapshot(): WauBehavior {
      const pendingHidden = hiddenSince !== null ? Date.now() - hiddenSince : 0;
      return {
        version: 1,
        elapsed_ms: Date.now() - startedAt,
        pointer: [...pointer],
        pointer_type: usedTouch ? 'touch' : '',
        key_intervals_ms: [...keyIntervals],
        input_events: inputEvents,
        paste_events: pasteEvents,
        untrusted_events: 0,
        webdriver: false,
        hidden_ms: hiddenMs + pendingHidden,
      };
    },
  };
}

const NativeCaptcha = forwardRef<CaptchaHandle, NativeCaptchaProps>(({ siteKey, origin }, ref) => {
  const client = useMemo(() => new NativeWauCaptchaClient(siteKey, origin), [siteKey, origin]);
  const recorder = useRef(createBehaviorRecorder()).current;
  const inputRef = useRef<TextInput>(null);
  const challengeRef = useRef<WauChallenge | null>(null);
  const [challenge, setChallenge] = useState<WauChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadIdRef = useRef(0);

  const load = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    if (challengeRef.current) client.discard(challengeRef.current.id);
    challengeRef.current = null;
    setChallenge(null);
    setAnswer('');
    setError(null);
    setLoading(true);
    try {
      const next = await client.newChallenge();
      if (loadId !== loadIdRef.current) {
        client.discard(next.id);
        return;
      }
      challengeRef.current = next;
      setChallenge(next);
      recorder.reset();
    } catch (loadError) {
      if (loadId !== loadIdRef.current) return;
      setError(
        loadError instanceof WauCaptchaError
          ? `Không tải được ảnh CAPTCHA. ${loadError.message}`
          : 'Không tải được ảnh CAPTCHA. Hãy thử tải lại.',
      );
    } finally {
      if (loadId === loadIdRef.current) setLoading(false);
    }
  }, [client, recorder]);

  useEffect(() => {
    load();
    return () => {
      loadIdRef.current += 1;
      if (challengeRef.current) client.discard(challengeRef.current.id);
    };
  }, [load, client]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      recorder.appHidden(state !== 'active');
    });
    return () => subscription.remove();
  }, [recorder]);

  const recordTouch = (event: GestureResponderEvent) => {
    recorder.touch(event.nativeEvent.locationX, event.nativeEvent.locationY);
  };

  useImperativeHandle(ref, () => ({
    async verify() {
      const current = challengeRef.current;
      if (loading || verifying || !current) {
        const message = error ?? 'CAPTCHA đang tải. Vui lòng đợi giây lát.';
        setError(message);
        return { token: null, message };
      }
      if (!answer.trim()) {
        const message = 'Vui lòng nhập mã trong ảnh trước khi đăng nhập.';
        setError(message);
        inputRef.current?.focus();
        return { token: null, message };
      }
      if (Date.now() >= current.expiresAt) {
        const message = 'Mã CAPTCHA đã hết hạn. Đã tải ảnh mới, vui lòng nhập lại.';
        load().then(() => setError(message));
        return { token: null, message };
      }

      setVerifying(true);
      setError(null);
      try {
        const token = await client.verify(current.id, answer.trim(), recorder.snapshot());
        challengeRef.current = null;
        if (token) return { token };
        const message = 'Mã CAPTCHA không đúng. Vui lòng nhập mã trong ảnh mới.';
        load().then(() => setError(message));
        return { token: null, message };
      } catch (verifyError) {
        const message =
          verifyError instanceof WauCaptchaError
            ? verifyError.message
            : 'Không xác minh được CAPTCHA. Vui lòng thử lại.';
        load().then(() => setError(message));
        return { token: null, message };
      } finally {
        setVerifying(false);
      }
    },
    refresh() {
      load();
    },
    requirePuzzle() {
      load();
    },
  }));

  const disabled = loading || verifying || !challenge;

  return (
    <View
      style={[styles.container, error ? styles.containerError : null]}
      onTouchStart={recordTouch}
      onTouchMove={recordTouch}
    >
      <Text style={styles.label}>Mã xác minh</Text>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          value={answer}
          onChangeText={next => {
            recorder.text(answer, next);
            setAnswer(next);
            if (error) setError(null);
          }}
          placeholder="Nhập mã"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          importantForAutofill="no"
          editable={!disabled}
          maxLength={12}
          accessibilityLabel="Mã xác minh CAPTCHA"
          style={[styles.input, disabled ? styles.inputDisabled : null]}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Đổi mã CAPTCHA"
          activeOpacity={0.75}
          disabled={loading || verifying}
          onPress={() => load()}
          style={[styles.refreshButton, loading || verifying ? styles.refreshDisabled : null]}
        >
          {loading ? (
            <ActivityIndicator color="#0863c5" size="small" />
          ) : (
            <FontAwesome6 color="#475569" iconStyle="solid" name="rotate-right" size={14} />
          )}
        </TouchableOpacity>
        {challenge ? (
          <Image
            accessibilityLabel="Ảnh mã CAPTCHA cần nhập"
            resizeMode="cover"
            source={{ uri: challenge.imageUri }}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>{loading ? 'Đang tải ảnh...' : 'Chưa có ảnh mã'}</Text>
          </View>
        )}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

NativeCaptcha.displayName = 'NativeCaptcha';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  containerError: { borderColor: '#FECACA' },
  label: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: 40,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  inputDisabled: { opacity: 0.6 },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  refreshDisabled: { opacity: 0.5 },
  image: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    width: 112,
  },
  imagePlaceholder: {
    alignItems: 'center',
    borderStyle: 'dashed',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  placeholderText: { color: '#64748B', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  errorText: { color: '#DC2626', fontSize: 12, fontWeight: '600', marginTop: 8 },
});

export default NativeCaptcha;

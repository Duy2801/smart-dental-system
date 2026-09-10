import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  sendAiChatMessage,
  type AiChatHistoryItem,
  type AiChatSuggestion,
} from '~src/features/ai/api';
import type { RootState } from '~src/reducers/store';

type FloatingChatButtonProps = {
  onPress?: () => void;
};

type ChatMessage = {
  id: number;
  metadata?: Record<string, unknown>;
  sender: 'bot' | 'user';
  suggestions?: AiChatSuggestion[];
  text: string;
};

const quickSuggestions = [
  'Đặt lịch khám ngày mai',
  'Cạo vôi răng bao nhiêu?',
  'Tư vấn niềng răng',
  'Giờ làm việc phòng khám',
];

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: 'bot',
    text: 'Xin chào! Tôi là Trợ lý Nha khoa AI Smart Dental. Tôi có thể giúp bạn tư vấn dịch vụ, báo giá và tự động ĐẶT LỊCH HẸN khám online ngay!',
  },
];

export function FloatingChatButton({ onPress }: FloatingChatButtonProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const messageIdRef = useRef(2);
  const accessToken = useSelector((state: RootState) => state.login.accessToken);

  const panelWidth = Math.min(width - 36, 335);
  const panelHeight = Math.min(430, height - Math.max(insets.top, 10) - 142);
  const isLoggedIn = Boolean(accessToken);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const wrapperFrame = {
    bottom: Math.max(insets.bottom, 8) + 20,
    height: open ? panelHeight + 62 : 52,
    width: open ? panelWidth : 52,
  };

  const nextMessageId = useCallback(() => {
    const id = messageIdRef.current;
    messageIdRef.current += 1;
    return id;
  }, []);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [loading, messages, open]);

  const handleSendMessage = useCallback(
    async (textToSend: string, metadata?: Record<string, unknown>) => {
      const value = textToSend.trim();
      if (!value || loading) return;

      const userMessage: ChatMessage = {
        id: nextMessageId(),
        metadata,
        sender: 'user',
        text: value,
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput('');
      setLoading(true);

      const history: AiChatHistoryItem[] = nextMessages.slice(-8).map(item => ({
        content: item.text,
        metadata: item.metadata || {},
        role: item.sender === 'user' ? 'user' : 'assistant',
      }));

      try {
        const response = await sendAiChatMessage({
          history,
          isLoggedIn,
          message: value,
          metadata,
        });

        setMessages(current => [
          ...current,
          {
            id: nextMessageId(),
            sender: 'bot',
            suggestions:
              response.suggestions ||
              response.data?.suggestions ||
              response.data?.data?.suggestions ||
              [],
            text:
              response.reply ||
              response.data?.reply ||
              response.data?.data?.reply ||
              'Xin lỗi, trợ lý AI đang quá tải. Bạn vui lòng thử lại sau giây lát.',
          },
        ]);
      } catch {
        setMessages(current => [
          ...current,
          {
            id: nextMessageId(),
            sender: 'bot',
            text: 'Xin lỗi, không thể kết nối tới máy chủ AI. Bạn vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn, loading, messages, nextMessageId],
  );

  const handleTriggerPress = () => {
    if (onPress) {
      onPress();
      return;
    }
    setOpen(current => !current);
  };

  const renderSuggestion = (
    suggestion: AiChatSuggestion,
    messageId: number,
    index: number,
  ) => (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={loading}
      key={`${messageId}-${suggestion.type}-${index}`}
      onPress={() => handleSendMessage(suggestion.value, suggestion.metadata)}
      style={[
        styles.suggestionChip,
        suggestion.type === 'service' && styles.suggestionChipPrimary,
        suggestion.type === 'time_slot' && styles.suggestionChipSuccess,
      ]}
    >
      <Text
        style={[
          styles.suggestionText,
          suggestion.type === 'service' && styles.suggestionTextPrimary,
          suggestion.type === 'time_slot' && styles.suggestionTextSuccess,
        ]}
      >
        {suggestion.label}
      </Text>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isBot = item.sender === 'bot';
    return (
      <View style={[styles.messageWrap, !isBot && styles.userMessageWrap]}>
        <View style={[styles.messageBubble, isBot ? styles.botBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {item.text}
          </Text>
        </View>
        {isBot && item.suggestions?.length ? (
          <View style={styles.suggestionWrap}>
            {item.suggestions.map((suggestion, index) =>
              renderSuggestion(suggestion, item.id, index),
            )}
          </View>
        ) : null}
      </View>
    );
  };

  const renderFooter = () => (
    <View>
      {loading ? (
        <View style={styles.loadingBubble}>
          <ActivityIndicator color="#0863c5" size="small" />
          <Text style={styles.loadingText}>Trợ lý AI đang tra cứu...</Text>
        </View>
      ) : null}

      {messages.length === 1 && !loading ? (
        <View style={styles.quickWrap}>
          {quickSuggestions.map(suggestion => (
            <TouchableOpacity
              activeOpacity={0.82}
              key={suggestion}
              onPress={() => handleSendMessage(suggestion)}
              style={styles.quickChip}
            >
              <Text style={styles.quickText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, wrapperFrame]}
    >
      {open ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="auto"
          style={[styles.chatPanel, { height: panelHeight, width: panelWidth }]}
        >
          <View style={styles.panelHeader}>
            <View style={styles.headerIcon}>
              <FontAwesome6
                color="#FBBF24"
                iconStyle="solid"
                name="wand-magic-sparkles"
                size={16}
              />
              <View style={styles.headerOnlineDot} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Trợ lý AI Đặt Lịch</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerSubtitle}>
                  Sẵn sàng 24/7 · Smart Dental AI
                </Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityLabel="Đóng trợ lý AI"
              activeOpacity={0.82}
              onPress={() => setOpen(false)}
              style={styles.closeButton}
            >
              <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="xmark" size={14} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            contentContainerStyle={styles.messagesContent}
            data={messages}
            keyExtractor={item => String(item.id)}
            ListFooterComponent={renderFooter}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.inputBar}>
            <TextInput
              editable={!loading}
              onChangeText={setInput}
              placeholder="Nhập yêu cầu đặt lịch hoặc thắc mắc..."
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={input}
            />
            <TouchableOpacity
              activeOpacity={0.86}
              disabled={loading || !input.trim()}
              onPress={() => handleSendMessage(input)}
              style={[
                styles.sendButton,
                (loading || !input.trim()) && styles.sendButtonDisabled,
              ]}
            >
              <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="paper-plane" size={13} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : null}

      <TouchableOpacity
        accessibilityLabel={open ? 'Đóng trợ lý nha khoa AI' : 'Mở trợ lý nha khoa AI'}
        accessibilityState={{ expanded: open }}
        activeOpacity={0.88}
        onPress={handleTriggerPress}
        style={styles.button}
      >
        <FontAwesome6
          color="#FFFFFF"
          iconStyle="solid"
          name={open ? 'chevron-down' : 'comment-dots'}
          size={open ? 17 : 20}
        />
        {!open ? (
          <>
            <View style={styles.onlineRing} />
            <View style={styles.onlineDot} />
          </>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 5,
    borderWidth: 1,
  },
  botText: {
    color: '#334155',
  },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#0058bc',
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 18,
    borderWidth: 2,
    elevation: 12,
    height: 52,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    width: 52,
  },
  chatPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: '#DBEAFE',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#0F2B52',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
  },
  closeButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  headerCopy: {
    flex: 1,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    position: 'relative',
    width: 34,
  },
  headerOnlineDot: {
    backgroundColor: '#34D399',
    borderColor: '#0883D9',
    borderRadius: 5,
    borderWidth: 2,
    bottom: -2,
    height: 10,
    position: 'absolute',
    right: -2,
    width: 10,
  },
  headerSubtitle: {
    color: '#DBEAFE',
    fontSize: 9,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 13,
    borderWidth: 1,
    color: '#0F172A',
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    height: 40,
    paddingHorizontal: 12,
  },
  inputBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 9,
  },
  loadingBubble: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0F2FE',
    borderRadius: 16,
    borderTopLeftRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  messageBubble: {
    borderRadius: 16,
    elevation: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  messagesContent: {
    gap: 9,
    padding: 12,
    paddingBottom: 14,
  },
  messageText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 17,
  },
  messageWrap: {
    alignSelf: 'flex-start',
    maxWidth: '94%',
  },
  onlineDot: {
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: -3,
    top: -3,
    width: 14,
  },
  onlineRing: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    borderRadius: 10,
    height: 20,
    position: 'absolute',
    right: -6,
    top: -6,
    width: 20,
  },
  panelHeader: {
    alignItems: 'center',
    backgroundColor: '#0883D9',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickText: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
  },
  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingTop: 2,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#93C5FD',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  statusDot: {
    backgroundColor: '#34D399',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suggestionChipPrimary: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  suggestionChipSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  suggestionText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
  },
  suggestionTextPrimary: {
    color: '#0863c5',
  },
  suggestionTextSuccess: {
    color: '#047857',
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 7,
  },
  userBubble: {
    backgroundColor: '#0863c5',
    borderTopRightRadius: 5,
  },
  userMessageWrap: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
  },
  userText: {
    color: '#FFFFFF',
  },
  wrapper: {
    alignItems: 'flex-end',
    position: 'absolute',
    right: 18,
    zIndex: 80,
  },
});

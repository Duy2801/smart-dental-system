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
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Screen } from '~src/components/ui';
import type { RootState } from '~src/reducers/store';
import {
  sendAiChatMessage,
  type AiChatHistoryItem,
  type AiChatSuggestion,
} from './api';

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
    text: 'Xin chào! Tôi là Trợ lý Nha khoa AI Smart Dental. Tôi có thể giúp bạn tư vấn dịch vụ, báo giá và đặt lịch khám online.',
  },
];

export default function DentalAIScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const messageIdRef = useRef(2);
  const accessToken = useSelector((state: RootState) => state.login.accessToken);
  const isLoggedIn = Boolean(accessToken);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const nextMessageId = useCallback(() => {
    const id = messageIdRef.current;
    messageIdRef.current += 1;
    return id;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [loading, messages]);

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
        suggestion.type === 'time_slot' && styles.suggestionChipSuccess,
        suggestion.type === 'service' && styles.suggestionChipPrimary,
      ]}
    >
      <Text
        style={[
          styles.suggestionText,
          suggestion.type === 'time_slot' && styles.suggestionTextSuccess,
          suggestion.type === 'service' && styles.suggestionTextPrimary,
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

  const renderListFooter = () => (
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
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <FontAwesome6
              color="#FBBF24"
              iconStyle="solid"
              name="wand-magic-sparkles"
              size={17}
            />
            <View style={styles.headerOnlineDot} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Trợ lý AI Đặt Lịch</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerSubtitle}>
                Sẵn sàng 24/7 · Smart Dental AI
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={listRef}
          contentContainerStyle={styles.messagesContent}
          data={messages}
          keyExtractor={item => String(item.id)}
          ListFooterComponent={renderListFooter}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
            <FontAwesome6 color="#FFFFFF" iconStyle="solid" name="paper-plane" size={14} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
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
  container: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    elevation: 6,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: '#0756AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 13,
    height: 38,
    justifyContent: 'center',
    position: 'relative',
    width: 38,
  },
  headerOnlineDot: {
    backgroundColor: '#34D399',
    borderColor: '#0863c5',
    borderRadius: 5,
    borderWidth: 2,
    bottom: -1,
    height: 11,
    position: 'absolute',
    right: -1,
    width: 11,
  },
  headerSubtitle: {
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '700',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    height: 42,
    paddingHorizontal: 13,
  },
  inputBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  loadingBubble: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0F2FE',
    borderRadius: 18,
    borderTopLeftRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  messageBubble: {
    borderRadius: 18,
    elevation: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 19,
  },
  messagesContent: {
    gap: 10,
    padding: 14,
    paddingBottom: 20,
  },
  messageWrap: {
    alignSelf: 'flex-start',
    maxWidth: '94%',
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  quickText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },
  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingTop: 4,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendButtonDisabled: {
    opacity: 0.45,
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
    gap: 6,
    marginTop: 3,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
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
    fontSize: 11,
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
});

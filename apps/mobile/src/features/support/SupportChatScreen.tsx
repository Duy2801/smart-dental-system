import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { Screen } from '~src/components/ui';
import type { SupportConversationStatus, SupportMessage } from './api';
import { useSupportChat } from './useSupportChat';

const STARTER_PROMPTS = [
  'Tôi muốn đặt lịch khám',
  'Chi phí dịch vụ như thế nào?',
  'Tư vấn tình trạng răng miệng',
  'Giờ làm việc phòng khám',
];

function statusLabel(status?: SupportConversationStatus, staffName?: string) {
  if (!status) return 'Hỏi lễ tân bất cứ điều gì';
  if (status === 'WAITING') return 'Đang chờ lễ tân tiếp nhận...';
  if (status === 'ASSIGNED') return `Đang trao đổi với ${staffName || 'lễ tân'}`;
  return 'Hội thoại đã kết thúc';
}

export default function SupportChatScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<SupportMessage>>(null);
  const startedRef = useRef(false);

  const { conversation, loading, messages, send, sending, start } =
    useSupportChat();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [messages]);

  const isClosed = conversation?.status === 'CLOSED';
  const isEmpty = !loading && messages.length === 0;

  function handleSend(text: string) {
    const value = text.trim();
    if (!value || isClosed) return;
    setInput('');
    void send(value);
  }

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    if (item.senderType === 'SYSTEM') {
      return (
        <View style={styles.systemWrap}>
          <Text style={styles.systemText}>{item.content}</Text>
        </View>
      );
    }
    const isPatient = item.senderType === 'PATIENT';
    return (
      <View style={[styles.messageWrap, isPatient && styles.patientMessageWrap]}>
        <View
          style={[
            styles.messageBubble,
            isPatient ? styles.patientBubble : styles.staffBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isPatient ? styles.patientText : styles.staffText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderListHeader = () =>
    isEmpty ? (
      <View style={styles.emptyState}>
        <View style={styles.emptyAvatar}>
          <FontAwesome6
            color="#FFFFFF"
            iconStyle="solid"
            name="headset"
            size={26}
          />
        </View>
        <Text style={styles.emptyTitle}>Chào bạn! 👋</Text>
        <Text style={styles.emptyDesc}>
          Mình là lễ tân hỗ trợ trực tuyến. Bạn có thể hỏi về lịch hẹn, chi
          phí, dịch vụ hoặc bất kỳ thắc mắc nào khác.
        </Text>
        <View style={styles.promptWrap}>
          {STARTER_PROMPTS.map(prompt => (
            <TouchableOpacity
              activeOpacity={0.82}
              key={prompt}
              onPress={() => handleSend(prompt)}
              style={styles.promptChip}
            >
              <Text style={styles.promptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ) : conversation?.status === 'WAITING' ? (
      <View style={styles.waitingBanner}>
        <Text style={styles.waitingText}>
          Yêu cầu của bạn đã được ghi nhận. Lễ tân sẽ tham gia hội thoại trong
          giây lát.
        </Text>
      </View>
    ) : null;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <FontAwesome6
              color="#FFFFFF"
              iconStyle="solid"
              name="chevron-left"
              size={16}
            />
          </TouchableOpacity>

          <View style={styles.headerIcon}>
            <FontAwesome6
              color="#FFFFFF"
              iconStyle="solid"
              name="headset"
              size={16}
            />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Tư vấn</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text numberOfLines={1} style={styles.headerSubtitle}>
                {statusLabel(
                  conversation?.status,
                  conversation?.assignedTo?.fullName,
                )}
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.messagesContent}
          data={messages}
          keyExtractor={item => item.id}
          ref={listRef}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
        />

        <View
          style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}
        >
          <TextInput
            editable={!isClosed && !loading}
            onChangeText={setInput}
            placeholder={isClosed ? 'Hội thoại đã kết thúc' : 'Nhập tin nhắn...'}
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={input}
          />
          <TouchableOpacity
            activeOpacity={0.86}
            disabled={sending || isClosed || loading || !input.trim()}
            onPress={() => handleSend(input)}
            style={[
              styles.sendButton,
              (sending || isClosed || loading || !input.trim()) &&
                styles.sendButtonDisabled,
            ]}
          >
            <FontAwesome6
              color="#FFFFFF"
              iconStyle="solid"
              name="paper-plane"
              size={14}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 28,
  },
  container: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  emptyAvatar: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    marginBottom: 12,
    width: 64,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 280,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 12,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    elevation: 6,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
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
    width: 38,
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
  messageWrap: {
    alignSelf: 'flex-start',
    maxWidth: '94%',
  },
  messagesContent: {
    gap: 10,
    padding: 14,
    paddingBottom: 20,
  },
  patientBubble: {
    backgroundColor: '#0863c5',
    borderTopRightRadius: 5,
  },
  patientMessageWrap: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
  },
  patientText: {
    color: '#FFFFFF',
  },
  promptChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  promptText: {
    color: '#0863c5',
    fontSize: 11,
    fontWeight: '800',
  },
  promptWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
    marginTop: 14,
    maxWidth: 320,
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
  staffBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 5,
    borderWidth: 1,
  },
  staffText: {
    color: '#334155',
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
  systemText: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
  },
  systemWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  waitingBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  waitingText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
});

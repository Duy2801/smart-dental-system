import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Alert,
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

  const { conversation, loading, messages, send, sendAttachment, sending, error, start } =
    useSupportChat();
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<SupportMessage | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start().catch(() => {});
  }, [start]);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timeout);
  }, [messages]);

  const isClosed = conversation?.status === 'CLOSED';
  const isEmpty = !loading && messages.length === 0;
  const inputBarInset = { paddingBottom: keyboardVisible ? 10 : Math.max(insets.bottom, 10) };

  function handleSend(text: string) {
    const value = text.trim();
    if (!value || isClosed) return;
    setInput('');
    send(value, replyingTo?.id).then(() => setReplyingTo(null)).catch(() => setInput(value));
  }

  async function chooseAttachment() {
    try {
      const [file] = await pick({ type: [types.allFiles] });
      if (file.size && file.size > 4 * 1024 * 1024) {
        Alert.alert('Tệp quá lớn', 'Vui lòng chọn tệp không quá 4 MB.');
        return;
      }
      await sendAttachment({ uri: file.uri, name: file.name || 'tep-dinh-kem', type: file.type || 'application/octet-stream' }, replyingTo?.id);
      setReplyingTo(null);
    } catch (cause) {
      if (!isErrorWithCode(cause) || cause.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('Không gửi được tệp', 'Vui lòng thử lại.');
      }
    }
  }

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    if (item.senderType === 'SYSTEM') {
      return (
        <View style={styles.systemWrap}>
          <Text style={styles.systemText}>{item.content}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      );
    }
    const isPatient = item.senderType === 'PATIENT';
    return (
      <View style={[styles.messageWrap, isPatient && styles.patientMessageWrap]}>
        <View style={[styles.messageRow, isPatient && styles.patientMessageRow]}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => setActiveMessageId(current => current === item.id ? null : item.id)}
          style={[
            styles.messageBubble,
            isPatient ? styles.patientBubble : styles.staffBubble,
          ]}
        >
          {item.replyToId ? (
            <View style={styles.replyQuote}>
              <Text style={[styles.replyQuoteText, isPatient && styles.patientText]}>
                {item.replySenderType === 'PATIENT' ? 'Bệnh nhân' : 'Lễ tân'}: {item.replyPreview}
              </Text>
            </View>
          ) : null}
          {item.attachmentUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(item.attachmentUrl as string)}>
              {item.attachmentMime?.startsWith('image/') ? (
                <Image source={{ uri: item.attachmentUrl }} style={styles.attachmentImage} resizeMode="contain" />
              ) : (
                <View style={styles.attachmentRow}>
                  <FontAwesome6 color={isPatient ? '#FFFFFF' : '#0863c5'} iconStyle="solid" name="file" size={15} />
                  <Text style={[styles.messageText, isPatient ? styles.patientText : styles.staffText]}>{item.attachmentName || 'Tệp đính kèm'}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={[styles.messageText, isPatient ? styles.patientText : styles.staffText]}>{item.content}</Text>
          )}
        </TouchableOpacity>
        {activeMessageId === item.id ? (
          <TouchableOpacity
            onPress={() => { setReplyingTo(item); setActiveMessageId(null); }}
            style={styles.replyAction}
            accessibilityLabel="Trả lời tin nhắn"
          >
            <FontAwesome6 color="#0863c5" iconStyle="solid" name="reply" size={15} />
          </TouchableOpacity>
        ) : null}
        </View>
        <Text style={[styles.messageTime, isPatient && styles.patientMessageTime]}>
          {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderListHeader = () =>
    loading ? (
      <View style={styles.loadingState}>
        <ActivityIndicator color="#0863c5" />
        <Text style={styles.loadingText}>Đang tải hội thoại...</Text>
      </View>
    ) : isEmpty ? (
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
              color="#64748B"
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

        {error ? (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{error}</Text>
            {!conversation ? (
              <TouchableOpacity accessibilityRole="button" onPress={() => start().catch(() => {})}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {replyingTo ? <View style={styles.replyComposer}><FontAwesome6 color="#0863c5" iconStyle="solid" name="reply" size={14} /><View style={styles.replyComposerText}><Text style={styles.replyComposerTitle}>Đang trả lời {replyingTo.senderType === 'PATIENT' ? 'bệnh nhân' : 'lễ tân'}</Text><Text numberOfLines={1} style={styles.replyComposerPreview}>{replyingTo.content || replyingTo.attachmentName}</Text></View><TouchableOpacity accessibilityLabel="Bỏ trả lời" onPress={() => setReplyingTo(null)}><FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={16} /></TouchableOpacity></View> : null}
        <View
          style={[styles.inputBar, inputBarInset]}
        >
          <TouchableOpacity accessibilityLabel="Gửi ảnh hoặc file" disabled={sending || isClosed || loading} onPress={chooseAttachment} style={styles.attachmentButton}>
            <FontAwesome6 color="#0863c5" iconStyle="solid" name="paperclip" size={17} />
          </TouchableOpacity>
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
  replyAction: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, elevation: 2, height: 36, justifyContent: 'center', width: 36 },
  replyQuote: { backgroundColor: 'rgba(148,163,184,0.18)', borderLeftColor: '#93C5FD', borderLeftWidth: 2, borderRadius: 6, marginBottom: 6, padding: 6 },
  replyQuoteText: { color: '#334155', fontSize: 11 },
  replyComposer: { alignItems: 'center', backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0', borderTopWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  replyComposerText: { flex: 1 },
  replyComposerTitle: { color: '#0863c5', fontSize: 11, fontWeight: '700' },
  replyComposerPreview: { color: '#64748B', fontSize: 11, marginTop: 2 },
  attachmentButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 28,
  },
  attachmentImage: {
    borderRadius: 10,
    height: 160,
    width: 200,
  },
  attachmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    maxWidth: 230,
  },
  backBtn: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  container: {
    backgroundColor: '#F6FAF9',
    flex: 1,
  },
  emptyAvatar: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    marginBottom: 12,
    width: 72,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: '900',
  },
  errorRow: { alignItems: 'center', backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 7 },
  errorText: {
    color: '#B91C1C',
    flex: 1,
    fontSize: 11,
  },
  retryText: { color: '#0863c5', fontSize: 11, fontWeight: '800', marginLeft: 8 },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 13,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 13,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#0F172A',
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
    fontSize: 14,
    fontWeight: '600',
    height: 44,
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
    flexShrink: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  messageTime: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },
  messageWrap: {
    alignSelf: 'flex-start',
    maxWidth: '94%',
  },
  messageRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  patientMessageRow: {
    flexDirection: 'row-reverse',
  },
  messagesContent: {
    gap: 16,
    padding: 16,
    paddingBottom: 24,
  },
  loadingState: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  loadingText: { color: '#94A3B8', fontSize: 14 },
  patientBubble: {
    backgroundColor: '#0863c5',
    borderTopRightRadius: 5,
  },
  patientMessageWrap: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
  },
  patientMessageTime: {
    textAlign: 'right',
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
    fontSize: 12,
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
    height: 44,
    justifyContent: 'center',
    width: 44,
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

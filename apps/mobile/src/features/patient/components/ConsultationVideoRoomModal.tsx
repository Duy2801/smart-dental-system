import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { joinPatientConsultationRoom, type PatientConsultation, type PatientConsultationRoom } from '../api';

type Props = {
  consultation: PatientConsultation;
  patientName: string;
  onClose: () => void;
};

function buildJitsiUrl(rawUrl: string, patientName: string) {
  const base = rawUrl.split('#')[0];
  const displayName = encodeURIComponent(patientName || 'Bệnh nhân');
  const toolbar = encodeURIComponent(JSON.stringify(['microphone', 'camera', 'chat', 'tileview']));
  return `${base}#userInfo.displayName="${displayName}"&config.prejoinConfig.enabled=false&config.prejoinPageEnabled=false&config.toolbarButtons=${toolbar}&config.disableDeepLinking=true&config.hideConferenceSubject=true&config.readOnlyName=true`;
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  }
  return 'Không thể kết nối phòng tư vấn. Vui lòng thử lại.';
}

export function ConsultationVideoRoomModal({ consultation, patientName, onClose }: Props) {
  const [room, setRoom] = useState<PatientConsultationRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaAllowed, setMediaAllowed] = useState(Platform.OS !== 'android');
  const [webError, setWebError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let active = true;
    let fetching = false;
    const fetchRoom = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const result = await joinPatientConsultationRoom(consultation.id);
        if (active) {
          setRoom(previous => previous?.status === result.status && previous.meetingUrl === result.meetingUrl ? previous : result);
          setError(null);
        }
      } catch (fetchError) {
        if (active) setError(errorMessage(fetchError));
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    };
    fetchRoom();
    const timer = setInterval(fetchRoom, 2500);
    return () => { active = false; clearInterval(timer); };
  }, [consultation.id, retryNonce]);

  const requestMedia = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      setMediaAllowed(
        results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
        results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED,
      );
    } catch {
      setMediaAllowed(false);
    }
  };

  useEffect(() => {
    if (room?.status === 'IN_PROGRESS' && !mediaAllowed) requestMedia();
    // Only request when the doctor starts the call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status]);

  const isActive = room?.status === 'IN_PROGRESS' && room.meetingUrl;
  const isEnded = room && ['COMPLETED', 'CANCELLED', 'EXPIRED', 'DOCTOR_MISSED'].includes(room.status);

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <View className="flex-1 bg-slate-950 pt-12">
        <View className="flex-row items-center justify-between px-5 pb-4">
          <View className="flex-1 pr-4">
            <Text className="text-lg font-bold text-white">Phòng tư vấn video</Text>
            <Text className="mt-1 text-sm text-slate-300">{consultation.doctor}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} className="rounded-full bg-slate-800 px-4 py-2">
            <Text className="font-bold text-white">Đóng</Text>
          </TouchableOpacity>
        </View>

        {loading && !room ? (
          <View className="flex-1 items-center justify-center gap-3 px-6">
            <ActivityIndicator color="#FFFFFF" size="large" />
            <Text className="text-center text-slate-200">Đang kiểm tra phòng tư vấn...</Text>
          </View>
        ) : error && !room ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Text className="text-center text-white">{error}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); setError(null); setRetryNonce(value => value + 1); }} className="rounded-xl bg-blue-600 px-5 py-3">
              <Text className="font-bold text-white">Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : isEnded ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-lg font-bold text-white">Buổi tư vấn đã kết thúc hoặc đã bị hủy.</Text>
          </View>
        ) : isActive && !mediaAllowed ? (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <Text className="text-center text-white">Cho phép ứng dụng dùng camera và micro để tham gia cuộc gọi.</Text>
            <TouchableOpacity onPress={requestMedia} className="rounded-xl bg-blue-600 px-5 py-3">
              <Text className="font-bold text-white">Cấp quyền camera và micro</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(buildJitsiUrl(room.meetingUrl!, patientName))} className="px-5 py-3">
              <Text className="font-bold text-slate-200">Mở bằng trình duyệt</Text>
            </TouchableOpacity>
          </View>
        ) : isActive ? (
          <View className="flex-1">
            {webError ? (
              <View className="flex-1 items-center justify-center gap-4 px-6">
                <Text className="text-center text-white">Không tải được video trong ứng dụng.</Text>
                <TouchableOpacity onPress={() => Linking.openURL(buildJitsiUrl(room.meetingUrl!, patientName))} className="rounded-xl bg-blue-600 px-5 py-3">
                  <Text className="font-bold text-white">Mở bằng trình duyệt</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <WebView
                source={{ uri: buildJitsiUrl(room.meetingUrl!, patientName) }}
                allowsInlineMediaPlayback
                javaScriptEnabled
                mediaCapturePermissionGrantType="grant"
                mediaPlaybackRequiresUserAction={false}
                onError={() => setWebError(true)}
                className="flex-1"
              />
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <ActivityIndicator color="#FFFFFF" size="large" />
            <Text className="text-center text-lg font-bold text-white">Đang chờ bác sĩ bắt đầu</Text>
            <Text className="text-center text-sm text-slate-300">Phòng sẽ tự mở khi bác sĩ bắt đầu buổi tư vấn.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

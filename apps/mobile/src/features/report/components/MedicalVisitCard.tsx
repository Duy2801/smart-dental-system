import React from 'react';
import { FlatList, Image, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';
import { formatShortDate } from '../api';
import type { MedicalRecord } from '../types';

type Props = { record: MedicalRecord };

function recordImages(value: unknown) {
  let images = value;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { return []; }
  }
  if (!Array.isArray(images)) return [];
  return images.flatMap((image, index) => {
    if (typeof image === 'string') return [{ id: String(index), url: image, title: `Ảnh y khoa ${index + 1}` }];
    if (!image || typeof image !== 'object') return [];
    const item = image as Record<string, unknown>;
    const url = item.url ?? item.imageUrl ?? item.src;
    if (typeof url !== 'string' || !url.trim()) return [];
    return [{
      id: typeof item.id === 'string' ? item.id : String(index),
      url,
      title: typeof item.title === 'string' && item.title ? item.title : `Ảnh y khoa ${index + 1}`,
    }];
  });
}

export function MedicalVisitCard({ record }: Props) {
  const prescriptions = record.prescriptions ?? [];
  const images = recordImages(record.images);

  return (
    <View className="gap-4 pb-6">
      <Card mode="outlined" className="rounded-2xl border-slate-200 bg-white">
        <Card.Content className="gap-3 py-4">
          <Text className="text-xs font-bold uppercase text-blue-700">
            Bệnh án từ bác sĩ · {formatShortDate(record.createdAt)}
          </Text>
          <Text variant="titleLarge" className="font-bold text-slate-900">{record.service || 'Lần khám nha khoa'}</Text>
          <Text className="text-sm text-slate-600">Bác sĩ điều trị: {record.doctor || 'Đang cập nhật'}</Text>
          <Divider />
          <Detail label="Lý do khám / Triệu chứng" value={record.chiefComplaint} />
          <Detail label="Chẩn đoán" value={record.diagnosis} />
          <Detail label="Điều trị & dặn dò" value={record.treatmentNotes} />
          <Detail label="Ngày tái khám" value={record.followUpDate ? formatShortDate(record.followUpDate) : null} />
        </Card.Content>
      </Card>

      <Card mode="outlined" className="rounded-2xl border-slate-200 bg-white">
        <Card.Content className="gap-3 py-4">
          <Text variant="titleMedium" className="font-bold text-slate-900">Đơn thuốc bác sĩ ({prescriptions.length})</Text>
          {prescriptions.length === 0 ? (
            <Text className="text-sm text-slate-500">Chưa có đơn thuốc cho lần khám này.</Text>
          ) : prescriptions.map(prescription => (
            <View key={prescription.id} className="gap-2 rounded-xl bg-slate-50 p-3">
              {prescription.items.map((item, index) => (
                <View key={`${prescription.id}-${index}`} className="gap-1">
                  <Text className="font-bold text-slate-900">{item.medicineName}</Text>
                  <Text className="text-sm text-slate-600">
                    {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}
                  </Text>
                  {item.instruction ? <Text className="text-sm text-slate-600">{item.instruction}</Text> : null}
                </View>
              ))}
              {prescription.notes ? <Text className="text-sm text-slate-600">Dặn dò: {prescription.notes}</Text> : null}
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card mode="outlined" className="rounded-2xl border-slate-200 bg-white">
        <Card.Content className="gap-3 py-4">
          <Text variant="titleMedium" className="font-bold text-slate-900">Phim X-quang & ảnh lâm sàng ({images.length})</Text>
          {images.length === 0 ? (
            <Text className="text-sm text-slate-500">Chưa có hình ảnh cho lần khám này.</Text>
          ) : (
            <FlatList
              data={images}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => item.id ?? String(index)}
              renderItem={({ item }) => (
                <View className="mr-3 w-64 overflow-hidden rounded-xl border border-slate-200">
                  <Image source={{ uri: item.url }} className="h-40 w-64" resizeMode="cover" />
                  <Text className="p-3 text-sm font-semibold text-slate-700">{item.title}</Text>
                </View>
              )}
            />
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="gap-1 rounded-xl bg-slate-50 p-3">
      <Text className="text-xs font-bold uppercase text-blue-700">{label}</Text>
      <Text className="text-sm text-slate-800">{value || 'Chưa cập nhật'}</Text>
    </View>
  );
}

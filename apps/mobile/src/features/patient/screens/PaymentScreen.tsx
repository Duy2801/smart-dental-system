import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Button, Card, Chip, EmptyState, Screen, ScreenHeader, ScreenList } from '~src/components/ui';
import { formatVnd, getPatientInvoices, PatientInvoice } from '../api';

const statusText = (status: string) => {
  const value = status.toUpperCase();
  if (value === 'PAID' || value === 'SUCCESS') return 'Đã thanh toán';
  if (value === 'FAILED') return 'Thất bại';
  if (value === 'PARTIAL') return 'Thanh toán một phần';
  return 'Chờ thanh toán';
};

export default function PaymentScreen({ navigation }: any) {
  const invoicesQuery = useQuery({
    queryFn: getPatientInvoices,
    queryKey: ['patient', 'invoices'],
  });

  const totalDue = (invoicesQuery.data ?? []).reduce(
    (sum, item) => sum + Math.max(item.amount - item.paidAmount, 0),
    0,
  );

  const renderInvoice = ({ item }: { item: PatientInvoice }) => (
    <Card>
      <Card.Content>
        <View className="flex-row justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-[11px] font-extrabold uppercase text-muted">{item.code}</Text>
            <Text numberOfLines={2} className="mt-1 text-base font-black text-slate-950">
              {item.service}
            </Text>
          </View>
          <Chip
            label={statusText(item.status)}
            status={item.amount <= item.paidAmount ? 'completed' : 'pending'}
          />
        </View>
        <View className="mt-4 flex-row justify-between">
          <View>
            <Text className="text-[11px] font-bold text-muted">Tổng tiền</Text>
            <Text className="text-sm font-black text-slate-900">{formatVnd(item.amount)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[11px] font-bold text-muted">Còn lại</Text>
            <Text className="text-sm font-black text-primary">
              {formatVnd(Math.max(item.amount - item.paidAmount, 0))}
            </Text>
          </View>
        </View>
        {item.amount > item.paidAmount ? (
          <Button className="mt-4" onPress={() => undefined}>
            Thanh toán ngay
          </Button>
        ) : null}
      </Card.Content>
    </Card>
  );

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Thanh toán"
        onBack={navigation.goBack}
        title="Hóa đơn của tôi"
        subtitle="Theo dõi khoản cần thanh toán và lịch sử hóa đơn."
      />
      <View className="px-[18px] pt-3">
        <Card className="bg-blue-50">
          <Card.Content>
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
                <FontAwesome6 color="#0875D1" iconStyle="solid" name="wallet" size={20} />
              </View>
              <View>
                <Text className="text-[12px] font-bold text-muted">Cần thanh toán</Text>
                <Text className="text-2xl font-black text-primary">{formatVnd(totalDue)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
      {invoicesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0875D1" />
        </View>
      ) : (
        <ScreenList
          data={invoicesQuery.data ?? []}
          keyExtractor={item => item.id}
          ListEmptyComponent={<EmptyState icon="receipt" title="Chưa có hóa đơn" />}
          onRefresh={invoicesQuery.refetch}
          refreshing={invoicesQuery.isRefetching}
          renderItem={renderInvoice}
        />
      )}
    </Screen>
  );
}

import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

type StepConfig = {
  number: number;
  label: string;
};

const STEPS: StepConfig[] = [
  { number: 1, label: 'Người khám' },
  { number: 2, label: 'Dịch vụ' },
  { number: 3, label: 'Lịch khám' },
  { number: 4, label: 'Bác sĩ' },
];

type BookingStepperProps = {
  activeStep: number;
  completedSteps: boolean[];
  onSelectStep: (stepNumber: number) => void;
};

export function BookingStepper({
  activeStep,
  completedSteps,
  onSelectStep,
}: BookingStepperProps) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs mb-4">
      {/* 4 Steps Row with connectors */}
      <View className="flex-row items-center justify-between">
        {STEPS.map((step, idx) => {
          const stepNum = step.number;
          const isActive = activeStep === stepNum;
          const isCompleted = completedSteps[stepNum - 1];
          const isClickable =
            stepNum === 1 ||
            (stepNum === 2 && completedSteps[0]) ||
            (stepNum === 3 && completedSteps[0] && completedSteps[1]) ||
            (stepNum === 4 && completedSteps[0] && completedSteps[1] && completedSteps[2]);

          return (
            <React.Fragment key={step.number}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!isClickable}
                onPress={() => onSelectStep(stepNum)}
                style={styles.stepTouch}
              >
                <View
                  style={[
                    styles.stepBadge,
                    isActive && styles.stepBadgeActive,
                    isCompleted && !isActive && styles.stepBadgeCompleted,
                    !isActive && !isCompleted && styles.stepBadgeInactive,
                  ]}
                >
                  {isCompleted && !isActive ? (
                    <FontAwesome6
                      color="#FFFFFF"
                      iconStyle="solid"
                      name="check"
                      size={12}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        isActive
                          ? styles.stepNumberActive
                          : isCompleted
                          ? styles.stepNumberCompleted
                          : styles.stepNumberInactive,
                      ]}
                    >
                      0{step.number}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {idx < STEPS.length - 1 ? (
                <View style={styles.connectorContainer}>
                  <View
                    style={[
                      styles.connectorLine,
                      completedSteps[idx] && styles.connectorLineActive,
                    ]}
                  />
                </View>
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      {/* Active Step Status Bar */}
      <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
        <View className="flex-row items-center gap-2">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-[11px] font-black text-[#0058bc]">
              {activeStep}
            </Text>
          </View>
          <Text className="text-xs font-black text-slate-900 uppercase tracking-tight">
            {STEPS[activeStep - 1]?.label}
          </Text>
        </View>

        <View>
          {completedSteps[activeStep - 1] ? (
            <View className="flex-row items-center gap-1">
              <FontAwesome6 color="#059669" iconStyle="solid" name="check" size={10} />
              <Text className="text-[11px] font-bold text-emerald-600">
                Đã chọn
              </Text>
            </View>
          ) : (
            <Text className="text-[11px] font-bold text-[#0058bc]">
              Bước {activeStep}/4
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  connectorContainer: {
    flex: 1,
    height: 2.5,
    marginHorizontal: 4,
  },
  connectorLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: '100%',
    width: '100%',
  },
  connectorLineActive: {
    backgroundColor: '#10B981',
  },
  stepBadge: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepBadgeActive: {
    backgroundColor: '#0058bc',
    elevation: 3,
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  stepBadgeCompleted: {
    backgroundColor: '#10B981',
  },
  stepBadgeInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberCompleted: {
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    color: '#94A3B8',
  },
  stepTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_NAME } from '~src/constants/screenName';

type IconName =
  | 'calendar-days'
  | 'file-lines'
  | 'headset'
  | 'house'
  | 'robot'
  | 'table-cells-large'
  | 'user';

const ICON_MAP: Record<string, IconName> = {
  [SCREEN_NAME.HOME]: 'house',
  [SCREEN_NAME.FUNCTION]: 'calendar-days',
  [SCREEN_NAME.PATIENT_CONSULTATION]: 'headset',
  [SCREEN_NAME.PATIENT_SERVICES]: 'table-cells-large',
  [SCREEN_NAME.AI]: 'robot',
  [SCREEN_NAME.REPORT]: 'file-lines',
  [SCREEN_NAME.PERSONAL]: 'user',
};

const CustomTabBar = ({
  descriptors,
  navigation,
  state,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const currentParams = state.routes[state.index]?.params as
    | { hideTabBar?: boolean }
    | undefined;

  if (currentParams?.hideTabBar) return null;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          if ((options.tabBarItemStyle as any)?.display === 'none') {
            return null;
          }
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;
          const isFocused = state.index === index;
          const isCenter = route.name === SCREEN_NAME.PATIENT_CONSULTATION;

          const onPress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: 'tabPress',
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({
                name: route.name,
                params: route.params,
                merge: true,
              });
            }
          };

          if (isCenter) {
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                activeOpacity={0.88}
                key={route.key}
                onLongPress={() =>
                  navigation.emit({ target: route.key, type: 'tabLongPress' })
                }
                onPress={onPress}
                style={styles.centerTabItem}
              >
                <View
                  style={[
                    styles.centerButtonOuter,
                    isFocused && styles.centerButtonOuterFocused,
                  ]}
                >
                  <View
                    style={[
                      styles.centerButton,
                      isFocused && styles.centerButtonFocused,
                    ]}
                  >
                    <FontAwesome6
                      color="#FFFFFF"
                      iconStyle="solid"
                      name="headset"
                      size={21}
                    />
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.centerLabel,
                    isFocused && styles.activeCenterLabel,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              activeOpacity={0.82}
              key={route.key}
              onLongPress={() =>
                navigation.emit({ target: route.key, type: 'tabLongPress' })
              }
              onPress={onPress}
              style={styles.tabItem}
            >
              {isFocused ? <View style={styles.activeIndicator} /> : null}
              <View style={[styles.iconBox, isFocused && styles.activeIconBox]}>
                <FontAwesome6
                  color={isFocused ? '#0058bc' : '#94A3B8'}
                  iconStyle="solid"
                  name={(ICON_MAP[route.name] || 'house') as never}
                  size={18}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[styles.label, isFocused && styles.activeLabel]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activeCenterLabel: {
    color: '#0863C5',
    fontWeight: '800',
  },
  activeIconBox: {
    backgroundColor: '#EFF7FF',
  },
  activeIndicator: {
    backgroundColor: '#0863C5',
    borderRadius: 999,
    height: 3,
    position: 'absolute',
    top: 0,
    width: 30,
  },
  activeLabel: {
    color: '#0863C5',
    fontWeight: '800',
  },
  centerButton: {
    alignItems: 'center',
    backgroundColor: '#0058bc',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  centerButtonFocused: {
    backgroundColor: '#0863c5',
    transform: [{ scale: 1.05 }],
  },
  centerButtonOuter: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    elevation: 8,
    justifyContent: 'center',
    padding: 3,
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
  },
  centerButtonOuterFocused: {
    borderColor: '#BFDBFE',
    shadowColor: '#0863C5',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  centerLabel: {
    color: '#0058bc',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    marginTop: 2,
    maxWidth: '96%',
  },
  centerTabItem: {
    alignItems: 'center',
    flex: 1,
    height: 62,
    justifyContent: 'center',
    marginTop: -22,
    position: 'relative',
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 62,
    overflow: 'visible',
    paddingHorizontal: 4,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 38,
  },
  label: {
    color: '#98A2B3',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
    maxWidth: '96%',
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    height: 62,
    justifyContent: 'center',
    position: 'relative',
  },
  wrapper: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    overflow: 'visible',
  },
});

export default CustomTabBar;

import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_NAME } from '~src/constants/screenName';

type IconName =
  | 'chart-column'
  | 'house'
  | 'robot'
  | 'table-cells-large'
  | 'user';

const ICON_MAP: Record<string, IconName> = {
  [SCREEN_NAME.HOME]: 'house',
  [SCREEN_NAME.FUNCTION]: 'table-cells-large',
  [SCREEN_NAME.AI]: 'robot',
  [SCREEN_NAME.REPORT]: 'chart-column',
  [SCREEN_NAME.PERSONAL]: 'user',
};

const HORIZONTAL_MARGIN = 16;
const INNER_PADDING = 6;

const CustomTabBar = ({
  descriptors,
  navigation,
  state,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const tabWidth =
    (width - HORIZONTAL_MARGIN * 2 - INNER_PADDING * 2) / state.routes.length;
  const currentParams = state.routes[state.index]?.params as
    | { hideTabBar?: boolean }
    | undefined;

  useEffect(() => {
    translateX.value = withSpring(state.index * tabWidth, {
      damping: 18,
      stiffness: 180,
    });
  }, [state.index, tabWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: state.routes[state.index]?.name === SCREEN_NAME.AI ? 0 : 1,
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  if (currentParams?.hideTabBar) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.activePill, indicatorStyle]} />
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
              ? options.title
              : route.name;
          const isFocused = state.index === index;
          const isAI = route.name === SCREEN_NAME.AI;

          const onPress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: 'tabPress',
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              activeOpacity={0.8}
              key={route.key}
              onLongPress={() =>
                navigation.emit({ target: route.key, type: 'tabLongPress' })
              }
              onPress={onPress}
              style={[styles.tabItem, isAI && styles.aiTabItem]}
            >
              {isAI ? (
                <View
                  style={[
                    styles.aiButtonBorder,
                    isFocused && styles.aiButtonBorderFocused,
                  ]}
                >
                  <View style={styles.aiButton}>
                    <FontAwesome6
                      color="#FFFFFF"
                      iconStyle="solid"
                      name="robot"
                      size={23}
                    />
                  </View>
                </View>
              ) : (
                <FontAwesome6
                  color={isFocused ? '#FFFFFF' : '#667085'}
                  iconStyle="solid"
                  name={ICON_MAP[route.name] || 'house'}
                  size={18}
                />
              )}
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  isFocused && styles.activeLabel,
                  isAI && styles.aiLabel,
                ]}
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
  wrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: HORIZONTAL_MARGIN,
    paddingTop: 22,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E7ECF3',
    borderRadius: 22,
    borderWidth: 1,
    elevation: 10,
    flexDirection: 'row',
    height: 66,
    paddingHorizontal: INNER_PADDING,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  activePill: {
    backgroundColor: '#0875D1',
    borderRadius: 17,
    bottom: INNER_PADDING,
    left: INNER_PADDING,
    position: 'absolute',
    top: INNER_PADDING,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    height: 54,
    justifyContent: 'center',
    zIndex: 1,
  },
  aiTabItem: {
    overflow: 'visible',
  },
  aiButtonBorder: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E9FF',
    borderRadius: 34,
    borderWidth: 2,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    top: -22,
    width: 60,
  },
  aiButtonBorderFocused: {
    borderColor: '#87BEFF',
    elevation: 12,
    shadowColor: '#0875D1',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  aiButton: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 26,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  label: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '600',
    maxWidth: '92%',
  },
  aiLabel: {
    color: '#0875D1',
    fontWeight: '800',
    marginTop: 29,
  },
  activeLabel: { color: '#FFFFFF', fontWeight: '800' },
});

export default CustomTabBar;

import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Animated,
  Easing,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { HOME_ASSETS } from '~src/assets';
import { SCREEN_NAME } from '~src/constants/screenName';
import { RootState } from '~src/reducers/store';
import { getHomeRoute } from '~src/routes/roleRoutes';

const SplashScreen = () => {
  const navigation = useNavigation<any>();
  const { accessToken, isHydrated, role, user } = useSelector(
    (state: RootState) => state.login,
  );
  const isAuthenticated = Boolean(accessToken && user && role);

  // Animations
  const introFade = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(0.88)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const loadingProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Intro entrance
    Animated.parallel([
      Animated.timing(introFade, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(introScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    // Expanding ripple waves
    const rippleLoop = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );

    // Loading line progress
    const progressAnimation = Animated.timing(loadingProgress, {
      toValue: 1,
      duration: 2300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    });

    pulseLoop.start();
    rippleLoop.start();
    progressAnimation.start();

    const onboardingTimer = isHydrated
      ? setTimeout(() => {
          const nextScreen = isAuthenticated
            ? getHomeRoute(role!)
            : SCREEN_NAME.ONBOARDING;
          navigation.replace(nextScreen);
        }, 2500)
      : undefined;

    return () => {
      if (onboardingTimer) clearTimeout(onboardingTimer);
      pulseLoop.stop();
      rippleLoop.stop();
    };
  }, [
    introFade,
    introScale,
    isAuthenticated,
    isHydrated,
    loadingProgress,
    navigation,
    pulse,
    ripple,
    role,
  ]);

  // Interpolations
  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const ripple1Scale = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.6],
  });
  const ripple1Opacity = ripple.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.35, 0.18, 0],
  });

  const ripple2Scale = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.95],
  });
  const ripple2Opacity = ripple.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.25, 0.1, 0],
  });

  const progressBarWidth = loadingProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Ambient background glows */}
      <View style={styles.ambientTopGlow} />
      <View style={styles.ambientBottomGlow} />

      {/* Centered Main Brand Identity */}
      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.brandCluster,
            {
              opacity: introFade,
              transform: [{ scale: introScale }],
            },
          ]}
        >
          {/* Animated Halo & Ripple Waves */}
          <View style={styles.logoStage}>
            {/* Ripple Wave 2 (Outer) */}
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: ripple2Scale }],
                  opacity: ripple2Opacity,
                  borderColor: '#0875D1',
                },
              ]}
            />
            {/* Ripple Wave 1 (Inner) */}
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: ripple1Scale }],
                  opacity: ripple1Opacity,
                  borderColor: '#0D9488',
                },
              ]}
            />

            {/* Glowing Backdrop Circle */}
            <View style={styles.logoAura} />

            {/* Logo Circular Card with Pulse */}
            <Animated.View
              style={[
                styles.logoCard,
                {
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Image
                source={HOME_ASSETS.CLINIC_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Typography */}
          <View style={styles.textGroup}>
            <View style={styles.titleRow}>
              <Text style={styles.titleMain}>Smart Dental</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={styles.tagline}>
              Chăm sóc nụ cười thông minh & toàn diện
            </Text>
          </View>

          {/* Minimalist Loading Bar */}
          <View style={styles.loaderContainer}>
            <View style={styles.loadingTrack}>
              <Animated.View
                style={[
                  styles.loadingRunner,
                  {
                    width: progressBarWidth,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Elegant Minimal Footer */}
      <Animated.View style={[styles.footer, { opacity: introFade }]}>
        <Text style={styles.footerBrand}>SMART DENTAL SYSTEM</Text>
        <Text style={styles.footerSub}>Clinical AI Intelligence</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  ambientTopGlow: {
    position: 'absolute',
    top: -140,
    right: -100,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(8, 117, 209, 0.08)',
  },
  ambientBottomGlow: {
    position: 'absolute',
    bottom: -150,
    left: -120,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandCluster: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoStage: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  rippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
  },
  logoAura: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(8, 117, 209, 0.12)',
  },
  logoCard: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0875D1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(8, 117, 209, 0.12)',
  },
  logoImage: {
    width: 74,
    height: 74,
  },
  textGroup: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleMain: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  aiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
    backgroundColor: '#0875D1',
  },
  aiBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  loaderContainer: {
    marginTop: 36,
    alignItems: 'center',
  },
  loadingTrack: {
    width: 110,
    height: 3.5,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  loadingRunner: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0875D1',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 28,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: '#94A3B8',
    marginBottom: 4,
  },
  footerSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;

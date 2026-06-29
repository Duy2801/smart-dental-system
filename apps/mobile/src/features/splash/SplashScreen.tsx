import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import {
    Animated,
    Easing,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { SCREEN_NAME } from "~src/constants/screenName";

const SplashScreen = () => {
    const navigation = useNavigation<any>();
    const progress = useRef(new Animated.Value(0)).current;
    const { width } = useWindowDimensions();

    const trackWidth = Math.min(width * 0.68, 260);
    const runnerWidth = trackWidth * 0.34;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration: 1800,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        );
        const onboardingTimer = setTimeout(() => {
            navigation.replace(SCREEN_NAME.ONBOARDING);
        }, 2200);

        loop.start();

        return () => {
            clearTimeout(onboardingTimer);
            loop.stop();
        };
    }, [navigation, progress]);

    const runnerTranslateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-runnerWidth, trackWidth],
    });

    const runnerOpacity = progress.interpolate({
        inputRange: [0, 0.15, 0.85, 1],
        outputRange: [0, 1, 1, 0],
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F8FF" />

            <View style={styles.backgroundGlowTop} />
            <View style={styles.backgroundGlowBottom} />

            <View style={styles.content}>
                <View style={styles.logoRing}>
                    <View style={styles.logoCore}>
                        <View style={styles.logoShield}>
                            <View style={styles.logoTooth} />
                        </View>
                    </View>
                </View>

                <Text style={styles.brandTitle}>Nha Khoa AI</Text>
                <Text style={styles.brandSubtitle}>Chăm sóc nụ cười bằng công nghệ</Text>

                <View style={styles.connectionCard}>
                    <View style={styles.connectionHeader}>
                        <View style={styles.connectionDot} />
                        <Text style={styles.connectionText}>Đang kết nối hệ thống</Text>
                    </View>

                    <View style={[styles.track, { width: trackWidth }]}>
                        <View style={styles.trackBase} />
                        <Animated.View
                            style={[
                                styles.runner,
                                {
                                    width: runnerWidth,
                                    opacity: runnerOpacity,
                                    transform: [{ translateX: runnerTranslateX }],
                                },
                            ]}
                        />
                    </View>

                    <Text style={styles.connectionHint}>Khởi tạo bảo mật và đồng bộ dữ liệu...</Text>
                </View>

                <Text style={styles.footerLabel}>CLINICAL INTELLIGENCE</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F8FF",
    },
    backgroundGlowTop: {
        position: "absolute",
        top: -100,
        right: -90,
        width: 260,
        height: 260,
        borderRadius: 260,
        backgroundColor: "rgba(46, 110, 247, 0.12)",
    },
    backgroundGlowBottom: {
        position: "absolute",
        bottom: -120,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 300,
        backgroundColor: "rgba(35, 194, 181, 0.10)",
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 72,
        paddingHorizontal: 24,
    },
    logoRing: {
        width: 112,
        height: 112,
        borderRadius: 56,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(46, 110, 247, 0.12)",
        backgroundColor: "rgba(255, 255, 255, 0.72)",
    },
    logoCore: {
        width: 78,
        height: 78,
        borderRadius: 39,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2E6EF7",
        shadowColor: "#2E6EF7",
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
    },
    logoShield: {
        width: 40,
        height: 46,
        borderRadius: 12,
        borderWidth: 4,
        borderColor: "#FFFFFF",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.12)",
    },
    logoTooth: {
        width: 12,
        height: 16,
        borderRadius: 7,
        backgroundColor: "#FFFFFF",
        marginTop: 1,
    },
    brandTitle: {
        marginTop: 10,
        fontSize: 28,
        fontWeight: "800",
        color: "#154DBA",
        letterSpacing: 0.2,
    },
    brandSubtitle: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: "#5E6F91",
        textAlign: "center",
    },
    connectionCard: {
        width: "100%",
        maxWidth: 320,
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderRadius: 24,
        backgroundColor: "rgba(255, 255, 255, 0.82)",
        borderWidth: 1,
        borderColor: "rgba(21, 77, 186, 0.08)",
    },
    connectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    connectionDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginRight: 8,
        backgroundColor: "#23C2B5",
    },
    connectionText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#29456E",
    },
    track: {
        height: 14,
        borderRadius: 999,
        overflow: "hidden",
        alignSelf: "center",
        justifyContent: "center",
        backgroundColor: "rgba(46, 110, 247, 0.10)",
    },
    trackBase: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: 999,
        backgroundColor: "rgba(46, 110, 247, 0.10)",
    },
    runner: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 999,
        backgroundColor: "#2E6EF7",
        shadowColor: "#2E6EF7",
        shadowOpacity: 0.24,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    connectionHint: {
        marginTop: 12,
        fontSize: 12,
        lineHeight: 18,
        color: "#6E7E9E",
        textAlign: "center",
    },
    footerLabel: {
        marginTop: 24,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 2,
        color: "#6F88B6",
    },
});

export default SplashScreen;

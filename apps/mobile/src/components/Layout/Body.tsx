import {
    View,
    TouchableOpacity,
    Dimensions,
    Animated,
    ActivityIndicator,
    Platform,
    StatusBar,
    StyleProp,
    ViewStyle,
    Text,
    TextStyle,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIMARY_COLOR } from '~src/constants/color';

const width = Dimensions.get('window').width;

type BodyProps = {
    children: React.ReactNode;
    statusBarColor?: string;
    hideHeader?: boolean;
    footerBackgroundColor?: string;
    style?: StyleProp<ViewStyle>;
    headerLeft?: React.ReactNode;
    headerRight?: React.ReactNode | (({ navigation, route }: { navigation: any; route: any }) => React.ReactNode);
    title?: string;
    backgroundColor?: string;
    loading?: boolean;
    barStyle?: 'light-content' | 'dark-content' | 'default';
};

const Body = (props: BodyProps) => {
    const {
        statusBarColor = '#fff',
        hideHeader = true,
        footerBackgroundColor = '#fff',
        style = {},
        headerLeft,
        headerRight,
        title = '',
        backgroundColor = '#FFE7EA',
        children,
        loading = false,
        barStyle = 'dark-content',
    } = props;
    useEffect(() => {
        if (Platform.OS === 'android') {
            StatusBar.setTranslucent(true);
            StatusBar.setBackgroundColor('transparent');
        }
        StatusBar.setBarStyle(barStyle);
    }, [barStyle]);
    return (
        <View style={{ flex: 1, backgroundColor: statusBarColor }}>
            <SafeAreaView style={{ flex: 1, zIndex: 1 }} edges={['left', 'right']}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: footerBackgroundColor,
                    }}
                >
                    {!hideHeader && (
                        <Header
                            title={title}
                            backgroundColor={statusBarColor}
                            headerLeft={headerLeft}
                            headerRight={headerRight}
                        />
                    )}
                    <View style={[{ flex: 1, backgroundColor: backgroundColor }, style]}>{children}</View>
                </View>
                <Loading loading={loading} />
            </SafeAreaView>
        </View>
    );
};

export default Body;

type HeaderProps = {
    title?: string;
    backgroundColor?: string;
    headerLeft?: React.ReactNode | (({ navigation }: { navigation: any }) => React.ReactNode);
    headerRight?: React.ReactNode | (({ navigation, route }: { navigation: any; route: any }) => React.ReactNode);
    headerTitleStyle?: StyleProp<TextStyle>;
};

const Header = (props: HeaderProps) => {
    const { title, backgroundColor, headerLeft, headerRight, headerTitleStyle } = props;
    const navigation = useNavigation();
    const route = useRoute();

    const resolvedHeaderLeft =
        headerLeft !== undefined
            ? headerLeft
            : ({ navigation }: { navigation: any }) => (
                <TouchableOpacity style={{ paddingLeft: 10 }} onPress={() => navigation.goBack()}>
                    <FontAwesome6 name="angle-left" size={24} color="#000" iconStyle="solid" />
                </TouchableOpacity>
            );

    return (
        <View
            style={{
                backgroundColor,
                flexDirection: 'row',
                position: 'relative',
                height: 60,
                alignItems: 'flex-end',
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    position: 'absolute',
                    left: 10,
                    zIndex: 1,
                }}
            >
                {typeof resolvedHeaderLeft === 'function' ? resolvedHeaderLeft({ navigation }) : resolvedHeaderLeft}
            </View>
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <View style={{ maxWidth: width - 80 }}>
                    <Text
                        style={[{ fontSize: 18, fontWeight: '600', textAlign: 'center' }, headerTitleStyle]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', position: 'absolute', right: 0 }}>
                {typeof headerRight === 'function' ? headerRight({ navigation, route }) : headerRight}
            </View>
        </View>
    );
};

export function Loading({ loading = false }) {
    const loaded = useRef(false);
    const opacity = useRef(new Animated.Value(loading ? 1 : 0)).current;
    const [visible, setVisible] = useState(loading);

    useEffect(() => {
        if (loaded.current) {
            if (loading) {
                setVisible(true);
                opacity.setValue(0);
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else {
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
                setTimeout(() => {
                    setVisible(false);
                }, 300);
            }
        } else {
            loaded.current = true;
        }
    }, [loading]);

    if (!visible) {
        return <></>;
    }

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#00000030',
                justifyContent: 'center',
                opacity,
                zIndex: 99,
            }}
        >
            <ActivityIndicator animating size="large" color="#fff" />
        </Animated.View>
    );
}

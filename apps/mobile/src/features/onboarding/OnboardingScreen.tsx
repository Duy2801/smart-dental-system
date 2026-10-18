import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import ONBOARDING_SLIDES from './data';
import { SCREEN_NAME } from '~src/constants/screenName';
import React from 'react';
import { PRIMARY_COLOR, SECONDARY_COLOR } from '~src/constants/color';
import { StyleSheet } from 'react-native';
import Button from '~src/components/Button/Button';
import Body from '~src/components/Layout/Body';
import { useResponsive } from '~src/hooks/useResponsive';

const OnboardingScreen = () => {
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const navigation = useNavigation<any>();
  const { width, height, isShort, isSmall } = useResponsive();

  // Ảnh co theo cả chiều rộng lẫn chiều cao để máy nhỏ / màn thấp không đẩy thẻ chữ và nút ra khỏi màn hình
  const imageSize = Math.min(width - 48, 370, Math.round(height * (isShort ? 0.34 : 0.42)));

  const handleNext = () => {
    if (index < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    } else {
      navigation.navigate(SCREEN_NAME.PATIENT_LOGIN);
    }
  };

  return (
    <Body hideHeader>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          onMomentumScrollEnd={e => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(newIndex);
          }}
          renderItem={({ item }) => (
            <View style={[styles.page, { paddingTop: isShort ? 24 : 60, width }]}>
              <Image
                source={item.image}
                style={[styles.image, { borderRadius: imageSize * 0.135, height: imageSize, width: imageSize }]}
              />
              <View style={[styles.card, { marginTop: isShort ? 20 : 40, padding: isSmall ? 18 : 24 }]}>
                <Text style={[styles.title, isSmall ? styles.titleSmall : null]}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          )}
        />
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <Button title={ONBOARDING_SLIDES[index].button} onPress={handleNext} />
      </View>
    </Body>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: PRIMARY_COLOR,
    flex: 1,
  },
  page: {
    alignItems: 'center',
  },
  image: {
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 24,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_COLOR,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: SECONDARY_COLOR,
    width: 16,
  },
});

import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import ONBOARDING_SLIDES from './data';
import { SCREEN_NAME } from '~src/constants/screenName';
import React from 'react';
import { PRIMARY_COLOR, SECONDARY_COLOR } from '~src/constants/color';
import { Dimensions, StyleSheet } from 'react-native';
import Button from '~src/components/Button/Button';
import Body from '~src/components/Layout/Body';

const { width } = Dimensions.get('window');

const OnboardingScreen = () => {
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const navigation = useNavigation<any>();

  const handleNext = () => {
    if (index < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    } else {
      navigation.navigate(SCREEN_NAME.LOGIN);
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
            <View style={styles.page}>
              <Image source={item.image} style={styles.image} />
              <View style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
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
    width,
    alignItems: 'center',
    paddingTop: 60,
  },
  image: {
    width: 370,
    height: 370,
    resizeMode: 'contain',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  card: {
    backgroundColor: '#fff',
    marginTop: 40,
    padding: 24,
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

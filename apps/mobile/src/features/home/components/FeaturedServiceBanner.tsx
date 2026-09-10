import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import type { HomeServiceCard } from '../api';

const fallbackServiceImage = require('~src/assets/home/bannerservice.png');

type FeaturedServiceBannerProps = {
  onPress: (serviceName?: string) => void;
  services?: HomeServiceCard[];
};

export function FeaturedServiceBanner({
  onPress,
  services = [],
}: FeaturedServiceBannerProps) {
  const [activePage, setActivePage] = useState(0);

  // Group services into pairs (2 per slide page, just like web responsive)
  const totalPages = Math.ceil(Math.min(services.length, 6) / 2) || 1;

  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setActivePage(prev => (prev + 1) % totalPages);
    }, 6000);
    return () => clearInterval(interval);
  }, [totalPages]);

  const currentPair = services.slice(activePage * 2, activePage * 2 + 2);

  if (!services.length) return null;

  return (
    <View style={styles.wrapper}>
      {/* 2 Stacked Service Banners matching Web Responsive */}
      <View style={styles.cardsStack}>
        {currentPair.map(service => {
          const source = service.imageUrl
            ? { uri: service.imageUrl }
            : fallbackServiceImage;

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              key={service.id}
              onPress={() => onPress(service.name)}
              style={styles.cardContainer}
            >
              <ImageBackground
                imageStyle={styles.bgImage}
                source={source}
                style={styles.cardContent}
              >
                {/* Vibrant Gradient Background and Dark Bottom Shade */}
                <View style={styles.gradientOverlay} />
                <View style={styles.bottomShadowOverlay} />

                {/* Top Content */}
                <View style={styles.topContent}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>DỊCH VỤ NỔI BẬT</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.titleText}>
                    {service.name}
                  </Text>
                  <Text numberOfLines={2} style={styles.descText}>
                    {service.description}
                  </Text>
                </View>

                {/* Bottom Row */}
                <View style={styles.bottomRow}>
                  <Text style={styles.priceText}>{service.price}</Text>
                  <View style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Xem dịch vụ</Text>
                    <FontAwesome6
                      color="#0058bc"
                      iconStyle="solid"
                      name="chevron-right"
                      size={9}
                    />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pagination Dots */}
      {totalPages > 1 ? (
        <View style={styles.dotsRow}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <TouchableOpacity
              activeOpacity={0.7}
              key={`dot-${idx}`}
              onPress={() => setActivePage(idx)}
              style={[
                styles.dot,
                idx === activePage ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionBtnText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '900',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bgImage: {
    opacity: 0.35,
    resizeMode: 'cover',
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    zIndex: 10,
  },
  bottomShadowOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    bottom: 0,
    height: '55%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  cardContainer: {
    backgroundColor: '#0058bc',
    borderRadius: 20,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  cardContent: {
    justifyContent: 'space-between',
    minHeight: 148,
    padding: 14,
    position: 'relative',
  },
  cardsStack: {
    gap: 12,
  },
  descText: {
    color: '#DBEAFE',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  dot: {
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    height: 5,
    width: 6,
  },
  dotActive: {
    backgroundColor: '#0058bc',
    width: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 10,
  },
  gradientOverlay: {
    backgroundColor: '#0058bc',
    bottom: 0,
    left: 0,
    opacity: 0.75,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginTop: 6,
  },
  topContent: {
    zIndex: 10,
  },
  wrapper: {
    marginHorizontal: 16,
    marginTop: 14,
  },
});

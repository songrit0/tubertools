import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Image,
  Animated, Dimensions, Platform
} from 'react-native';
import { X, Eye } from 'lucide-react-native';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function SelectionPreviewModal({ visible, item, onClose, showCloseButton = true }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  if (!item) return null;

  const selector = item.character;
  const selected = item.selectedVTuber;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Close Button */}
          {showCloseButton && (
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X color="#fff" size={28} />
            </Pressable>
          )}

          <View style={styles.content}>
            {/* Selector Avatar */}
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarGlow, { backgroundColor: '#FF00A840' }]} />
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: selector?.imageUrl }} 
                  style={styles.avatar}
                  defaultSource={{ uri: 'https://via.placeholder.com/300' }}
                />
              </View>
            </View>

            {/* Middle Text Section */}
            <View style={styles.middleSection}>
              <View style={styles.textContainer}>
                {/* Background Shadow Text for Stroke Effect */}
                {/* <Text style={[styles.statusText, styles.textStroke]}>ได้เลือก</Text> */}
                <Text style={styles.statusText}>ได้เลือก</Text>
              </View>
            </View>

            {/* Selected Avatar */}
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarGlow, { backgroundColor: '#00D1FF40' }]} />
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: selected?.imageUrl }} 
                  style={styles.avatar}
                  defaultSource={{ uri: 'https://via.placeholder.com/300' }}
                />
              </View>
            </View>
          </View>

          {/* Names */}
          {/* <View style={styles.namesRow}>
            <Text style={styles.displayName}>{selector?.name || 'Unknown'}</Text>
            <View style={styles.nameSpacer} />
            <Text style={styles.displayName}>{selected?.name || 'Unknown'}</Text>
          </View> */}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    maxWidth: 900,
    alignItems: 'center',
    padding: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: -40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    width: '100%',
  },
  avatarWrapper: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  avatarBorder: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: '#fff',
    backgroundColor: '#222',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  middleSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 2,
    ...Platform.select({
      ios: {
        textShadowColor: '#ff0000',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
      android: {
        textShadowColor: '#ff0000',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
      web: {
        textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000',
      }
    }),
  },
  textStroke: {
    position: 'absolute',
    color: '#ff0000',
    top: 2,
    left: 2,
    zIndex: -1,
    opacity: 0.8,
  },
  namesRow: {
    flexDirection: 'row',
    marginTop: 40,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 100,
  },
  displayName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 200,
  },
  nameSpacer: {
    width: 100,
  }
});

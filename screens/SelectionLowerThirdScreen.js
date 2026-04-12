import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { subscribeToActivePreview, clearActivePreview } from '../services/vtuberDatabaseService';
import SelectionPreviewModal from '../components/SelectionPreviewModal';

export default function SelectionLowerThirdScreen() {
  const [activeItem, setActiveItem] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to remote preview triggers
    const unsubscribe = subscribeToActivePreview((data) => {
      if (data && data.status === 'active') {
        setActiveItem(data);
        setIsVisible(true);

        // Auto-dismiss after 10 seconds
          // const timer = setTimeout(async () => {
          //   setIsVisible(false);
          //   // Wait for fade out animation before clearing from DB
          //   setTimeout(async () => {
          //     try {
          //       await clearActivePreview();
          //     } catch (e) {
          //       console.error('Failed to clear active preview:', e);
          //     }
          //   }, 500);
          // }, 10000);

        // return () => clearTimeout(timer);
        return;
      } else {
        setIsVisible(false);
        setActiveItem(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* 
          This screen is intended to be completely empty by default.
          It only shows the SelectionPreviewModal when triggered remotely 
          from the SelectionLogScreen (WHO SELECTED WHOM).
      */}
      <SelectionPreviewModal
        visible={isVisible}
        item={activeItem}
        showCloseButton={false}
        onClose={async () => {
          setIsVisible(false);
          await clearActivePreview();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent background for OBS overlay
  },
});

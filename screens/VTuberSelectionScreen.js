import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Image, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import SelectionModal from '../components/SelectionModal';
import { subscribeToVtubers, addCharacterInUse, subscribeToVtubersInUse } from '../services/vtuberDatabaseService';

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function VTuberSelectionScreen({ route, navigation }) {
  const responsive = useResponsive();
  const { gameId } = route.params || {};
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const orderRef = useRef(null);

  const numColumns = responsive.width >= 1200 ? 6
    : responsive.width >= 900 ? 5
    : responsive.width >= 600 ? 4
    : 3;

  useEffect(() => {
    // Real-time listener for characters
    const unsubscribeCharacters = subscribeToVtubers((vtubersData) => {
      if (!orderRef.current) {
        const shuffled = shuffleArray(vtubersData);
        orderRef.current = shuffled.map(v => v.id);
        setCharacters(shuffled);
      } else {
        const ordered = orderRef.current
          .map(id => vtubersData.find(v => v.id === id))
          .filter(Boolean);
        setCharacters(ordered);
      }
      setIsLoading(false);
    });

    // Real-time listener for characters in use
    const unsubscribeInUse = subscribeToVtubersInUse((inUseIds) => {
      setVtubersInUse(inUseIds);
      console.log('👁️ Characters in use:', inUseIds);
    });

    return () => {
      unsubscribeCharacters();
      unsubscribeInUse();
    };
  }, []);

  const handleSelect = (character) => {
    console.log('📍 handleSelect:', character.name, '| In use:', vtubersInUse);
    if (vtubersInUse.includes(character.id)) {
      console.log('❌ Character already in use:', character.name);
      return;
    }
    setSelectedCharacter(character);
    setModalVisible(true);
  };

  const confirmSelection = () => {
    if (selectedCharacter?.id) {
      console.log('✅ Confirming character:', selectedCharacter.id);
      addCharacterInUse(selectedCharacter.id);
    }
    setModalVisible(false);
    navigation.navigate('SelectVTuber', { gameId, character: selectedCharacter });
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const renderCharacter = ({ item }) => {
    const isInUse = vtubersInUse.includes(item.id);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          isInUse && styles.cardDisabled,
          !isInUse && pressed && styles.cardPressed,
        ]}
        onPress={() => handleSelect(item)}
        disabled={isInUse}
      >
        <View style={[styles.avatarWrapper, isInUse && styles.avatarDisabled]}>
          <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
        </View>
        <Text style={[styles.nameText, isInUse && styles.nameDisabled]} numberOfLines={1}>
          {item.name}
        </Text>
        {isInUse && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>เลือกแล้ว</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={Colors.text} size={20} />
            <Text style={styles.backText}>กลับ</Text>
          </Pressable>
          <Text style={styles.navTitle}>WHO ARE YOU?</Text>
          <View style={{ width: 70 }} />
        </View>
      </View>

      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>เลือกตัวละครของคุณ</Text>
        <Text style={styles.pageSubtitle}>คุณเป็นใครใน 12VTuber?</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      ) : (
        <FlatList
          data={characters}
          renderItem={renderCharacter}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ไม่พบตัวละคร</Text>
          }
        />
      )}

      <SelectionModal
        visible={modalVisible}
        vtuber={selectedCharacter}
        onConfirm={confirmSelection}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  navbar: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#181818',
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#242424',
    minWidth: 70,
  },
  backText: {
    color: Colors.text,
    fontSize: 13,
  },
  navTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  pageTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  grid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },

  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardPressed: {
    backgroundColor: '#242424',
    borderColor: Colors.accent,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: Colors.cardBg,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  nameText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },

  cardDisabled: {
    opacity: 0.5,
    borderColor: '#333',
  },
  avatarDisabled: {
    borderColor: '#555',
  },
  nameDisabled: {
    color: Colors.textSecondary,
  },
  selectedBadge: {
    marginTop: 6,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

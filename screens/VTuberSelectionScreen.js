import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Image, ActivityIndicator, SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import { shuffleArray } from '../utils/arrayUtils';
import SelectionModal from '../components/SelectionModal';
import { subscribeToVtubers, addCharacterInUse, subscribeToVtubersInUse } from '../services/vtuberDatabaseService';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

export default function VTuberSelectionScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const { user, isAdmin, role } = useAuth();
  const { gameId } = route.params || {};

  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const orderRef = useRef(null);

  const numColumns = width >= 1200 ? 6 : width >= 900 ? 5 : width >= 640 ? 4 : 3;

  useEffect(() => {
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

    const unsubscribeInUse = subscribeToVtubersInUse((inUseIds) => {
      setVtubersInUse(inUseIds);
    });

    return () => {
      unsubscribeCharacters();
      unsubscribeInUse();
    };
  }, []);

  const handleSelect = (character) => {
    if (vtubersInUse.includes(character.id)) return;
    setSelectedCharacter(character);
    setModalVisible(true);
  };

  const confirmSelection = () => {
    if (selectedCharacter?.id) {
      addCharacterInUse(selectedCharacter.id);
    }
    setModalVisible(false);
    navigation.navigate('SelectVTuber', { gameId, character: selectedCharacter });
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
          {item.imageUrl
            ? <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
            : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>{(item.name || '?')[0]}</Text>
              </View>
            )
          }
        </View>
        <Text style={[styles.nameText, isInUse && styles.nameDisabled]} numberOfLines={2}>
          {item.name}
        </Text>
        {isInUse && (
          <View style={styles.inUseBadge}>
            <Text style={styles.inUseBadgeText}>เลือกแล้ว</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <Sidebar navigation={navigation} active="games" user={user} isAdmin={isAdmin} role={role} />

      <View style={styles.main}>
        <TopBar crumbs={['Games', '12VTuber', 'เลือกตัวละคร']} live navigation={navigation} />

        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>คุณเป็นใคร?</Text>
            <Text style={styles.pageSubtitle}>เลือกตัวละครของคุณใน 12VTuber Draft Pick</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {vtubersInUse.length} / {characters.length} เลือกแล้ว
            </Text>
          </View>
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
            columnWrapperStyle={styles.gridRow}
            ListEmptyComponent={
              <Text style={styles.emptyText}>ไม่พบตัวละคร</Text>
            }
          />
        )}
      </View>

      <SelectionModal
        visible={modalVisible}
        vtuber={selectedCharacter}
        onConfirm={confirmSelection}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bg0,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    color: Colors.fg0,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    color: Colors.fg2,
    fontSize: 13,
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  countText: {
    color: Colors.fg2,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },

  grid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },

  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 6,
  },
  cardPressed: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.accent + '88',
  },
  cardDisabled: {
    opacity: 0.45,
  },

  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: Colors.bg3,
    borderWidth: 2,
    borderColor: Colors.borderDefault,
  },
  avatarDisabled: {
    borderColor: Colors.borderSubtle,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: Colors.fg1,
    fontSize: 24,
    fontWeight: '700',
  },

  nameText: {
    color: Colors.fg0,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  nameDisabled: {
    color: Colors.fg3,
  },

  inUseBadge: {
    backgroundColor: Colors.redSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.red + '40',
  },
  inUseBadgeText: {
    color: Colors.red,
    fontSize: 9,
    fontWeight: '700',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.fg2,
    fontSize: 14,
  },
  emptyText: {
    color: Colors.fg2,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});

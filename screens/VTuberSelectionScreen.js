import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import SelectionModal from '../components/SelectionModal';
import { fetchVtubersFromDatabase } from '../services/vtuberDatabaseService';

export default function VTuberSelectionScreen({ route, navigation }) {
    const responsive = useResponsive();
    const { gameId } = route.params || {};
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [characters, setCharacters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCharacters();
    }, []);

    const loadCharacters = async () => {
        setIsLoading(true);
        try {
            const data = await fetchVtubersFromDatabase();
            setCharacters(data);
        } catch (error) {
            console.error('Error loading characters:', error);
            setCharacters([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (character) => {
        setSelectedCharacter(character);
        setModalVisible(true);
    };

    const confirmSelection = () => {
        setModalVisible(false);
        navigation.navigate('SelectVTuber', { gameId, character: selectedCharacter });
    };

    const renderCharacter = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
            <View style={styles.avatarCircle}>
                <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
            </View>
            <Text style={styles.nameText}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={Colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>WHO ARE YOU?</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.titleArea}>
                <Text style={styles.title}>WHO ARE YOU?</Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading Characters...</Text>
                </View>
            ) : (
                <FlatList
                    data={characters}
                    renderItem={renderCharacter}
                    keyExtractor={item => item.id}
                    numColumns={responsive.isTablet || responsive.isWeb ? (responsive.width > 1200 ? 4 : 3) : 2}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.row}
                    key={responsive.isTablet || responsive.isWeb ? (responsive.width > 1200 ? 4 : 3) : 2}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No Characters available</Text>
                        </View>
                    }
                />
            )}

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
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    titleArea: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    title: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    grid: {
        paddingHorizontal: 30,
        paddingBottom: 20,
        maxWidth: 1400,
        alignSelf: 'center',
        width: '100%',
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    card: {
        width: '45%',
        aspectRatio: 0.8,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.cardBg,
        padding: 5,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 45,
    },
    nameText: {
        color: Colors.text,
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.text,
        fontSize: 16,
        marginTop: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: Colors.text,
        fontSize: 16,
    },
});

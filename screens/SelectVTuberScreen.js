import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, X } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { fetchVtubersFromDatabase, saveUserSelection, fetchUserSelections } from '../services/vtuberDatabaseService';

export default function SelectVTuberScreen({ route, navigation }) {
    const responsive = useResponsive();
    const { gameId, character } = route.params || {};
    const [selectedVTuber, setSelectedVTuber] = useState(null);
    const [vtubers, setVtubers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        checkExistingSelection();
        loadVtubers();
    }, []);

    const checkExistingSelection = async () => {
        try {
            const selections = await fetchUserSelections();
            // Check if current game/character has already been selected
            const existingSelection = selections.find(
                sel => sel.gameId === gameId && sel.character?.id === character?.id
            );

            if (existingSelection) {
                // User already selected, redirect to result page
                navigation.replace('ResultSelection', {
                    gameId,
                    character,
                    selectedVTuber: existingSelection.selectedVTuber,
                    selectionId: existingSelection.selectionId,
                    alreadySelected: true
                });
            }
        } catch (error) {
            console.error('Error checking existing selection:', error);
        }
    };

    const loadVtubers = async () => {
        setIsLoading(true);
        try {
            const data = await fetchVtubersFromDatabase();
            setVtubers(data);
        } catch (error) {
            console.error('Error loading vtubers:', error);
            setVtubers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectVTuber = (vtuber) => {
        setSelectedVTuber(vtuber);
        setShowConfirmModal(true);
    };

    const handleConfirmSelection = async () => {
        if (!selectedVTuber) {
            Alert.alert('Error', 'Please select a VTuber');
            return;
        }

        setIsSaving(true);
        try {
            const selectionData = {
                gameId: gameId || 'unknown',
                character: {
                    id: character?.id,
                    name: character?.name,
                    imageUrl: character?.imageUrl,
                },
                selectedVTuber: {
                    id: selectedVTuber.id,
                    name: selectedVTuber.name,
                    imageUrl: selectedVTuber.imageUrl,
                },
            };

            const result = await saveUserSelection(selectionData);

            if (result.success) {
                setShowConfirmModal(false);
                navigation.navigate('ResultSelection', {
                    gameId,
                    character,
                    selectedVTuber,
                    selectionId: result.selectionId
                });
            } else {
                Alert.alert('Error', 'Failed to save selection');
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseModal = () => {
        setShowConfirmModal(false);
        setSelectedVTuber(null);
    };

    const renderVTuber = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelectVTuber(item)}
        >
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
                <Text style={styles.headerTitle}>SELECT VTUBER</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.characterInfo}>
                <Text style={styles.infoLabel}>Playing as:</Text>
                <View style={styles.characterCard}>
                    <Image source={{ uri: character?.imageUrl }} style={styles.characterAvatar} />
                    <Text style={styles.characterName}>{character?.name}</Text>
                </View>
            </View>

            <View style={styles.titleArea}>
                <Text style={styles.title}>SELECT VTUBER</Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading VTubers...</Text>
                </View>
            ) : (
                <FlatList
                    data={vtubers}
                    renderItem={renderVTuber}
                    keyExtractor={item => item.id}
                    numColumns={responsive.isTablet || responsive.isWeb ? (responsive.width > 1200 ? 4 : 3) : 2}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.row}
                    key={responsive.isTablet || responsive.isWeb ? (responsive.width > 1200 ? 4 : 3) : 2}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No VTubers available</Text>
                        </View>
                    }
                />
            )}

            {/* Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                animationType="fade"
                transparent={true}
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Close Button */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleCloseModal}
                        >
                            <X color={Colors.text} size={24} />
                        </TouchableOpacity>

                        {/* Title */}
                        <Text style={styles.modalTitle}>Confirm Selection</Text>

                        {/* Character Section */}
                        <View style={styles.modalSection}>
                            <Text style={styles.modalLabel}>PLAYING AS</Text>
                            <View style={styles.modalCharacterCard}>
                                <Image
                                    source={{ uri: character?.imageUrl }}
                                    style={styles.modalAvatar}
                                />
                                <Text style={styles.modalCharacterName}>{character?.name}</Text>
                            </View>
                        </View>

                        {/* Arrow */}
                        <View style={styles.arrowContainer}>
                            <Text style={styles.arrow}>↓</Text>
                        </View>

                        {/* VTuber Section */}
                        <View style={styles.modalSection}>
                            <Text style={styles.modalLabel}>SELECT</Text>
                            <View style={styles.modalCharacterCard}>
                                <Image
                                    source={{ uri: selectedVTuber?.imageUrl }}
                                    style={styles.modalAvatar}
                                />
                                <Text style={styles.modalCharacterName}>{selectedVTuber?.name}</Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalCancelButton, isSaving && styles.disabledButton]}
                                onPress={handleCloseModal}
                                disabled={isSaving}
                            >
                                <Text style={styles.modalButtonText}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalConfirmButton, isSaving && styles.disabledButton]}
                                onPress={handleConfirmSelection}
                                disabled={isSaving}
                            >
                                <Text style={styles.modalButtonText}>
                                    {isSaving ? 'CONFIRMING...' : 'CONFIRM'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    characterInfo: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        marginHorizontal: 10,
        borderRadius: 8,
    },
    infoLabel: {
        color: Colors.cardBg,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    characterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    characterAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: Colors.text,
    },
    characterName: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
    },
    titleArea: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    title: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    grid: {
        paddingHorizontal: 30,
        paddingBottom: 100,
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
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        padding: 8,
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
        overflow: 'hidden',
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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 12,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    modalSection: {
        marginBottom: 16,
    },
    modalLabel: {
        color: Colors.cardBg,
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    modalCharacterCard: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.cardBg,
    },
    modalAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: Colors.text,
    },
    modalCharacterName: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
    },
    arrowContainer: {
        alignItems: 'center',
        marginVertical: 12,
    },
    arrow: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: Colors.cardBg,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.text,
    },
    modalConfirmButton: {
        flex: 1,
        backgroundColor: '#FF6B9D',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: Colors.text,
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    disabledButton: {
        opacity: 0.5,
    },
});

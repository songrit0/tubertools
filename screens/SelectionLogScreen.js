import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Image,
} from 'react-native';
import { ChevronLeft, Trash2, RefreshCw } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { fetchUserSelections, deleteAllUserSelections, subscribeToUserSelections } from '../services/vtuberDatabaseService';

export default function SelectionLogScreen({ navigation }) {
    const responsive = useResponsive();
    const [selections, setSelections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        // Set up real-time listener
        const unsubscribe = subscribeToUserSelections((data) => {
            setSelections(data);
            setIsLoading(false);
        });

        // Initial load
        loadSelections();

        // Cleanup listener on unmount
        return () => {
            unsubscribe();
        };
    }, []);

    const loadSelections = async () => {
        setIsLoading(true);
        try {
            const data = await fetchUserSelections();
            setSelections(data);
        } catch (error) {
            console.error('Error loading selections:', error);
            setSelections([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearRound = async () => {
        console.log('handleClearRound called');
        console.log('Selections to delete:', selections.length);

        // Use window.confirm for web compatibility
        const confirmed = window.confirm(
            `End Round?\n\nThis will delete all ${selections.length} selection(s) and reset for a new round.`
        );

        if (!confirmed) {
            console.log('User cancelled');
            return;
        }

        console.log('User confirmed - starting delete');
        setIsClearing(true);

        try {
            console.log('Calling deleteAllUserSelections...');
            const result = await deleteAllUserSelections();

            console.log('Delete result:', result);

            if (result.success) {
                console.log('Delete success! Clearing local selections');
                setSelections([]);

                // Show success message
                const message = `Success ✓\n\nRound ended. All ${selections.length} selection(s) cleared.\nUsers can now make new selections.`;
                window.alert(message);

                console.log('Reloading selections');
                await loadSelections();
            } else {
                console.error('Delete failed:', result.error);
                window.alert(`Failed to clear selections:\n${result.error}`);
            }
        } catch (error) {
            console.error('Exception during delete:', error);
            window.alert(`Error: ${error.message}`);
        } finally {
            setIsClearing(false);
        }
    };

    const formatDate = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return timestamp;
        }
    };

    const renderSelectionItem = ({ item, index }) => (
        <View style={styles.selectionCard}>
            <View style={styles.cardNumber}>
                <Text style={styles.cardNumberText}>{index + 1}</Text>
            </View>

            <View style={styles.cardContent}>
                {/* Game ID */}
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Game:</Text>
                    <Text style={styles.value}>{item.gameId}</Text>
                </View>

                {/* Character Playing As */}
                <View style={styles.characterRow}>
                    <View style={styles.characterSection}>
                        <Text style={styles.label}>Playing As:</Text>
                        <View style={styles.characterInfo}>
                            {item.character?.name && (
                                <>
                                    <Text style={styles.characterName}>{item.character.name}</Text>
                                    <Text style={styles.characterId}>(ID: {item.character.id})</Text>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Arrow */}
                    <Text style={styles.arrow}>→</Text>

                    {/* Selected VTuber */}
                    <View style={styles.characterSection}>
                        <Text style={styles.label}>Selected:</Text>
                        <View style={styles.characterInfo}>
                            {item.selectedVTuber?.name && (
                                <>
                                    <Text style={styles.characterName}>{item.selectedVTuber.name}</Text>
                                    <Text style={styles.characterId}>(ID: {item.selectedVTuber.id})</Text>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Timestamp */}
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Time:</Text>
                    <Text style={styles.timeValue}>{formatDate(item.timestamp)}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={Colors.text} size={28} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>WHO SELECTED WHOM</Text>
                    <View style={styles.realtimeIndicator}>
                        <View style={styles.realtimeDot} />
                        <Text style={styles.realtimeText}>LIVE</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={loadSelections} disabled={isLoading}>
                    <RefreshCw color={Colors.text} size={24} />
                </TouchableOpacity>
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Selections</Text>
                    <Text style={styles.statValue}>{selections.length}</Text>
                </View>
            </View>

            {/* Container for list and button */}
            <View style={styles.contentWrapper}>
                {/* Selections List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading selections...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={selections}
                        renderItem={renderSelectionItem}
                        keyExtractor={(item, index) => `${item.selectionId}_${index}`}
                        contentContainerStyle={styles.listContent}
                        scrollEnabled={true}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No selections yet</Text>
                                <Text style={styles.emptySubtext}>Users will make selections here</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* End Round Button - Always at bottom */}
            <View style={styles.actionSection}>
                <TouchableOpacity
                    style={[styles.endRoundButton, isClearing && styles.disabledButton]}
                    onPress={() => {
                        console.log('Button pressed!');
                        handleClearRound();
                    }}
                    disabled={isClearing}
                    activeOpacity={0.7}
                >
                    <Trash2 color={Colors.text} size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>
                        {isClearing ? 'Clearing...' : 'END ROUND & CLEAR ALL'}
                    </Text>
                </TouchableOpacity>
            </View>
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
        borderBottomWidth: 1,
        borderBottomColor: Colors.surface,
    },
    headerTitleContainer: {
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    realtimeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    realtimeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1DB954',
    },
    realtimeText: {
        color: '#1DB954',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
    },
    statsSection: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    statCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B9D',
    },
    statLabel: {
        color: Colors.cardBg,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        maxWidth: 1400,
        alignSelf: 'center',
        width: '100%',
    },
    selectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        gap: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#1DB954',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF6B9D',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 40,
    },
    cardNumberText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    cardContent: {
        flex: 1,
    },
    infoRow: {
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        color: Colors.cardBg,
        fontSize: 11,
        fontWeight: '600',
    },
    value: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: '600',
    },
    timeValue: {
        color: Colors.cardBg,
        fontSize: 11,
    },
    characterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    characterSection: {
        flex: 1,
    },
    characterInfo: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginTop: 4,
        borderWidth: 1,
        borderColor: Colors.cardBg,
    },
    characterName: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    characterId: {
        color: Colors.cardBg,
        fontSize: 10,
        marginTop: 2,
    },
    arrow: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
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
        minHeight: 200,
    },
    emptyText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        color: Colors.cardBg,
        fontSize: 13,
    },
    actionSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 30,
        borderTopWidth: 2,
        borderTopColor: Colors.surface,
        backgroundColor: Colors.background,
        zIndex: 100,
    },
    endRoundButton: {
        backgroundColor: '#FF4444',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 12,
        minHeight: 56,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
});

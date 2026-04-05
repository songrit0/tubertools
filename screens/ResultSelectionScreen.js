import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { subscribeToUserSelections } from '../services/vtuberDatabaseService';

export default function ResultSelectionScreen({ route, navigation }) {
    const responsive = useResponsive();
    const { gameId, character, selectedVTuber, alreadySelected } = route.params || {};
    const [currentSelection, setCurrentSelection] = useState(selectedVTuber);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Set up real-time listener for this user's selection
        console.log('Setting up real-time listener for selection');
        const unsubscribe = subscribeToUserSelections((selections) => {
            console.log('Selections updated, total:', selections.length);
            // Find the selection for this game and character
            const mySelection = selections.find(
                sel => sel.gameId === gameId && sel.character?.id === character?.id
            );

            if (mySelection) {
                console.log('Found my selection:', mySelection.selectedVTuber?.name);
                setCurrentSelection(mySelection.selectedVTuber);
            } else {
                console.log('My selection was deleted! Redirecting to SELECT VTUBER');
                // Selection was deleted (round ended), redirect back to SelectVTuber
                setTimeout(() => {
                    console.log('Navigating back to SelectVTuber');
                    navigation.replace('SelectVTuber', { gameId, character });
                }, 500);
            }
        });

        return () => {
            console.log('Cleaning up listener');
            unsubscribe();
        };
    }, [gameId, character?.id, navigation]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerSection}>
                    <Text style={styles.successTitle}>
                        {alreadySelected ? 'ALREADY SELECTED' : 'SELECTION COMPLETE!'}
                    </Text>
                    <Text style={[styles.successSubtitle, alreadySelected && styles.alreadySelectedSubtitle]}>
                        {alreadySelected ? '✓✓' : '✓'}
                    </Text>
                </View>

                {/* Character Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>PLAYING AS</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: character?.imageUrl }}
                                style={styles.avatar}
                            />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.name}>{character?.name}</Text>
                            <Text style={styles.id}>ID: {character?.id}</Text>
                        </View>
                    </View>
                </View>

                {/* Arrow Down */}
                <View style={styles.arrowSection}>
                    <Text style={styles.arrow}>↓</Text>
                </View>

                {/* Selected VTuber Section */}
                <View style={styles.section}>
                    <View style={styles.labelWithIndicator}>
                        <Text style={styles.sectionLabel}>SELECTED VTUBER</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: currentSelection?.imageUrl }}
                                style={styles.avatar}
                            />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.name}>{currentSelection?.name}</Text>
                            <Text style={styles.id}>ID: {currentSelection?.id}</Text>
                        </View>
                    </View>
                </View>


            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    successTitle: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    successSubtitle: {
        color: '#1DB954',
        fontSize: 48,
        fontWeight: 'bold',
    },
    alreadySelectedSubtitle: {
        color: '#0099FF',
    },
    section: {
        marginBottom: 20,
    },
    labelWithIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionLabel: {
        color: Colors.cardBg,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 0,
        paddingHorizontal: 0,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1DB954',
    },
    liveText: {
        color: '#1DB954',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    infoCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.text,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    infoContent: {
        flex: 1,
    },
    name: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    id: {
        color: Colors.cardBg,
        fontSize: 11,
    },
    arrowSection: {
        alignItems: 'center',
        marginVertical: 16,
    },
    arrow: {
        color: Colors.text,
        fontSize: 32,
        fontWeight: 'bold',
    },
    gameIdSection: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: Colors.cardBg,
    },
    gameIdLabel: {
        color: Colors.cardBg,
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    gameIdValue: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    buttonGroup: {
        gap: 12,
        marginTop: 20,
    },
    playButton: {
        backgroundColor: '#1DB954',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    selectAgainButton: {
        backgroundColor: '#FF6B9D',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    homeButton: {
        backgroundColor: Colors.surface,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FF6B9D',
    },
    buttonText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

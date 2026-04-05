import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';

export default function VTuberDetailScreen({ route, navigation }) {
    const { mainVTuber, character } = route.params || {};

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={Colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PROFILE</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                {/* Main VTuber Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SELECTED PLAYER</Text>
                    <View style={styles.profileCard}>
                        <View style={styles.largeAvatarContainer}>
                            <Image
                                source={{ uri: mainVTuber?.imageUrl }}
                                style={styles.largeAvatar}
                            />
                        </View>
                        <Text style={styles.vtuberName}>{mainVTuber?.name}</Text>
                        <Text style={styles.vtuberid}>ID: {mainVTuber?.id}</Text>
                    </View>
                </View>

                {/* Character Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>YOUR CHARACTER</Text>
                    <View style={styles.profileCard}>
                        <View style={styles.largeAvatarContainer}>
                            <Image
                                source={{ uri: character?.imageUrl }}
                                style={styles.largeAvatar}
                            />
                        </View>
                        <Text style={styles.characterName}>{character?.name}</Text>
                        <Text style={styles.characterId}>ID: {character?.id}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('GameBoard', { mainVTuber, character })}
                    >
                        <Text style={styles.buttonText}>START GAME</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.buttonText}>CHANGE CHARACTER</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.tertiaryButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.buttonText}>SELECT DIFFERENT PLAYER</Text>
                    </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surface,
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    contentInner: {
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    largeAvatarContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 3,
        borderColor: Colors.text,
    },
    largeAvatar: {
        width: '100%',
        height: '100%',
    },
    vtuberName: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    vtuberid: {
        color: Colors.cardBg,
        fontSize: 12,
    },
    characterName: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    characterId: {
        color: Colors.cardBg,
        fontSize: 12,
    },
    buttonSection: {
        gap: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    primaryButton: {
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
    secondaryButton: {
        backgroundColor: Colors.surface,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FF6B9D',
    },
    tertiaryButton: {
        backgroundColor: Colors.cardBg,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

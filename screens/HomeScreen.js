import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Settings, User } from 'lucide-react-native';
import { Colors } from '../theme/colors';

const PLAYERS = Array.from({ length: 12 }, (_, i) => ({ id: `PLAYER ${i + 1}`, label: `PLAYER ${i + 1}` }));

export default function HomeScreen({ navigation }) {
    const renderPlayerItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.playerCard}
            onPress={() => navigation.navigate('VTuberSelection', { playerId: item.id })}
        >
            <View style={styles.iconCircle}>
                <User color={Colors.surface} size={24} />
            </View>
            <Text style={styles.playerLabel}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileBadge}>
                    <User color={Colors.text} size={24} />
                    <Text style={styles.profileName}>USERNAME</Text>
                </View>
                <Settings color={Colors.text} size={24} />
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>SELECT PLAYER</Text>
            </View>

            <FlatList
                data={PLAYERS}
                renderItem={renderPlayerItem}
                keyExtractor={item => item.id}
                numColumns={3}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={styles.row}
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
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    profileName: {
        color: Colors.text,
        marginLeft: 10,
        fontWeight: 'bold',
    },
    titleContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    title: {
        color: Colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    gridContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    playerCard: {
        backgroundColor: Colors.surface,
        width: '30%',
        aspectRatio: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.text,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    playerLabel: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
});

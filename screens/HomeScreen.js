import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Settings, User, Database } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';

const GAMES = Array.from({ length: 12 }, (_, i) => ({
    id: `GAME_${i + 1}`,
    label: `GAME ${i + 1}`,
}));

export default function HomeScreen({ navigation }) {
    const responsive = useResponsive();
    const renderGameItem = ({ item }) => (
        <TouchableOpacity
            style={styles.gameCard}
            onPress={() => navigation.navigate('VTuberSelection', { gameId: item.id })}
        >
            <View style={styles.iconCircle}>
                <Text style={styles.gameNumber}>{item.label.split('_')[1]}</Text>
            </View>
            <Text style={styles.gameLabel}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileBadge}>
                    <User color={Colors.text} size={24} />
                    <Text style={styles.profileName}>USERNAME</Text>
                </View>
                <View style={styles.iconContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('AdminData')}>
                        <Database color={Colors.text} size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('SelectionLog')}>
                        <Settings color={Colors.text} size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title}>12VTuber</Text>
            </View>

            <FlatList
                data={GAMES}
                renderItem={renderGameItem}
                keyExtractor={item => item.id}
                numColumns={responsive.isTablet || responsive.isWeb ? (responsive.width > 1200 ? 6 : 4) : 3}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={styles.row}
                key={responsive.isTablet || responsive.isWeb ? (responsive.width > 1200 ? 6 : 4) : 3}
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
    iconContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    titleContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    title: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        maxWidth: 1200,
        alignSelf: 'center',
    },
    gridContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxWidth: 1400,
        alignSelf: 'center',
        width: '100%',
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    gameCard: {
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
    gameNumber: {
        color: Colors.background,
        fontSize: 20,
        fontWeight: 'bold',
    },
    gameLabel: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { vtuberData } from '../data/vtuberData';
import EliminableCard from '../components/EliminableCard';

export default function GameBoardScreen({ route, navigation }) {
    const { playerId, myIdentity } = route.params;
    const [eliminatedIds, setEliminatedIds] = useState([]);

    const toggleElimination = (id) => {
        setEliminatedIds(prev => 
            prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
        );
    };

    const resetGame = () => {
        setEliminatedIds([]);
    };

    const renderEliminable = ({ item }) => (
        <EliminableCard 
            vtuber={item} 
            eliminated={eliminatedIds.includes(item.id)} 
            onPress={() => toggleElimination(item.id)} 
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={Colors.text} size={28} />
                </TouchableOpacity>
                
                <View style={styles.identityContainer}>
                    <View style={styles.miniAvatar}>
                        <Image source={{ uri: myIdentity.imageUrl }} style={styles.miniImage} />
                    </View>
                    <Text style={styles.headerTitle}>{playerId}</Text>
                </View>

                <TouchableOpacity onPress={resetGame}>
                    <RotateCcw color={Colors.text} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.titleArea}>
                <Text style={styles.title}>CHOOSE</Text>
            </View>

            <FlatList
                data={vtuberData}
                renderItem={renderEliminable}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
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
        paddingVertical: 10,
    },
    identityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    miniAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.cardBg,
        marginRight: 8,
        overflow: 'hidden',
    },
    miniImage: {
        width: '100%',
        height: '100%',
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    titleArea: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    title: {
        color: Colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    grid: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
    },
});

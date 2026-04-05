import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { vtuberData } from '../data/vtuberData';
import SelectionModal from '../components/SelectionModal';

export default function VTuberSelectionScreen({ route, navigation }) {
    const { playerId } = route.params;
    const [selectedVTuber, setSelectedVTuber] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelect = (vtuber) => {
        setSelectedVTuber(vtuber);
        setModalVisible(true);
    };

    const confirmSelection = () => {
        setModalVisible(false);
        navigation.navigate('GameBoard', { playerId, myIdentity: selectedVTuber });
    };

    const renderVTuber = ({ item }) => (
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
                <Text style={styles.headerTitle}>{playerId}</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.titleArea}>
                <Text style={styles.title}>WHO ARE YOU?</Text>
            </View>

            <FlatList
                data={vtuberData}
                renderItem={renderVTuber}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.row}
            />

            <SelectionModal 
                visible={modalVisible}
                vtuber={selectedVTuber}
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
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 20,
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
});

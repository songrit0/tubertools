import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import MenuCard from '../components/MenuCard';

export default function DifficultyScreen({ navigation }) {
    const handleSelect = (mode) => {
        navigation.navigate('Quiz', { difficulty: mode });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={Colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SELECT DIFFICULTY</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <MenuCard 
                    title="EASY" 
                    color={Colors.easy} 
                    height={100}
                    onPress={() => handleSelect('easy')} 
                />
                <MenuCard 
                    title="NORMAL" 
                    color={Colors.normal} 
                    height={100}
                    onPress={() => handleSelect('normal')} 
                />
                <MenuCard 
                    title="HARD" 
                    color={Colors.hard} 
                    height={100}
                    onPress={() => handleSelect('hard')} 
                />
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
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 40,
        justifyContent: 'center',
    },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, Trophy, Settings, User } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import MenuCard from '../components/MenuCard';

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.profileBadge}>
                    <User color={Colors.text} size={24} />
                    <Text style={styles.profileName}>USERNAME</Text>
                </View>
                <Settings color={Colors.text} size={24} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.welcomeText}>WELCOME TO THE QUIZ!</Text>
                
                <MenuCard 
                    title="WHAT IS THIS PICTURE?" 
                    icon={Image} 
                    color={Colors.surface} 
                    height={200}
                    onPress={() => navigation.navigate('Difficulty')} 
                />
                
                <MenuCard 
                    title="SCOREBOARD" 
                    icon={Trophy} 
                    color={Colors.surface} 
                    height={150}
                    onPress={() => navigation.navigate('Result')} // Placeholder for scoreboard
                />
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
        fontWeight: '600',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 30,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
});

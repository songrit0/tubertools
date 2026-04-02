import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';

export default function MenuCard({ onPress, title, icon: Icon, color = Colors.surface, height = 150 }) {
    return (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: color, height }]} 
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                {Icon && <Icon size={48} color={Colors.text} />}
            </View>
            <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
});

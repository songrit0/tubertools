import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { XCircle } from 'lucide-react-native';
import { Colors } from '../theme/colors';

export default function EliminableCard({ vtuber, eliminated, onPress }) {
    return (
        <TouchableOpacity 
            style={[styles.card, eliminated && styles.cardEliminated]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.avatarCircle}>
                <Image 
                    source={{ uri: vtuber.imageUrl }} 
                    style={[styles.avatar, eliminated && styles.avatarEliminated]} 
                />
                {eliminated && (
                    <View style={styles.crossOverlay}>
                        <XCircle color={Colors.eliminated} size={80} strokeWidth={3} />
                    </View>
                )}
            </View>
            <Text style={[styles.nameText, eliminated && styles.textEliminated]}>
                {vtuber.name}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '48%',
        aspectRatio: 0.9,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        alignItems: 'center',
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardEliminated: {
        opacity: 0.6,
        backgroundColor: '#1E1E1E',
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.cardBg,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    avatarEliminated: {
        tintColor: 'gray',
    },
    crossOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameText: {
        color: Colors.text,
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    textEliminated: {
        textDecorationLine: 'line-through',
        color: Colors.textSecondary,
    },
});

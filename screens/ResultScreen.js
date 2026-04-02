import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Home, RefreshCw } from 'lucide-react-native';
import { Colors } from '../theme/colors';

export default function ResultScreen({ route, navigation }) {
    const { score, total, difficulty } = route.params;

    const getFeedback = () => {
        const percentage = (score / total) * 100;
        if (percentage === 100) return 'EXCELLENT!';
        if (percentage >= 50) return 'GOOD JOB!';
        return 'KEEP TRYING!';
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Trophy size={120} color={Colors.accent} />
                <Text style={styles.feedbackText}>{getFeedback()}</Text>
                
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                    <Text style={styles.scoreValue}>{score}/{total}</Text>
                    <Text style={styles.difficultyLabel}>{difficulty.toUpperCase()} MODE</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.button, styles.primaryButton]} 
                        onPress={() => navigation.replace('Quiz', { difficulty })}
                    >
                        <RefreshCw color={Colors.text} size={24} />
                        <Text style={styles.buttonText}>TRY AGAIN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.secondaryButton]} 
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Home color={Colors.text} size={24} />
                        <Text style={styles.buttonText}>MAIN MENU</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    feedbackText: {
        color: Colors.text,
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 20,
    },
    scoreCard: {
        backgroundColor: Colors.surface,
        width: '100%',
        padding: 30,
        borderRadius: 30,
        alignItems: 'center',
        marginVertical: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    scoreLabel: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    scoreValue: {
        color: Colors.accent,
        fontSize: 64,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    difficultyLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        padding: 18,
        borderRadius: 20,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    primaryButton: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.accent,
    },
    secondaryButton: {
        backgroundColor: Colors.surface,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 15,
    },
});

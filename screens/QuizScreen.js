import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronRight } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { quizData } from '../data/quizData';

export default function QuizScreen({ route, navigation }) {
    const { difficulty } = route.params;
    const questions = quizData[difficulty] || [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const currentQuestion = questions[currentIndex];

    // If no questions found
    if (!currentQuestion) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No questions found for this difficulty.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>GO BACK</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const handleOptionSelect = (option) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);

        if (option === currentQuestion.correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            // End of quiz
            navigation.replace('Result', { score, total: questions.length, difficulty });
        }
    };

    const getOptionStyle = (option) => {
        if (!isAnswered) {
            return selectedOption === option ? styles.optionSelected : styles.optionNormal;
        }

        if (option === currentQuestion.correctAnswer) {
            return styles.optionCorrect;
        }

        if (selectedOption === option && option !== currentQuestion.correctAnswer) {
            return styles.optionIncorrect;
        }

        return styles.optionNormal;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X color={Colors.text} size={28} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                </View>
                <Text style={styles.headerTitle}>{currentIndex + 1}/{questions.length}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.imageCard}>
                    <Image 
                        source={{ uri: currentQuestion.imageUrl }} 
                        style={styles.image} 
                        resizeMode="cover"
                    />
                </View>
                
                <Text style={styles.questionText}>{currentQuestion.question}</Text>

                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity 
                            key={index}
                            style={[styles.optionButton, getOptionStyle(option)]}
                            onPress={() => handleOptionSelect(option)}
                            disabled={isAnswered}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {isAnswered && (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>
                            {currentIndex + 1 === questions.length ? 'FINISH' : 'NEXT'}
                        </Text>
                        <ChevronRight color={Colors.text} size={24} />
                    </TouchableOpacity>
                )}
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
    progressContainer: {
        flex: 1,
        height: 6,
        backgroundColor: Colors.surface,
        marginHorizontal: 20,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.easy,
    },
    headerTitle: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    imageCard: {
        width: '100%',
        height: 250,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    questionText: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },
    optionsContainer: {
        width: '100%',
    },
    optionButton: {
        width: '100%',
        padding: 18,
        borderRadius: 15,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 2,
    },
    optionNormal: {
        backgroundColor: Colors.surface,
        borderColor: Colors.surface,
    },
    optionSelected: {
        backgroundColor: Colors.surface,
        borderColor: Colors.accent,
    },
    optionCorrect: {
        backgroundColor: Colors.correct,
        borderColor: Colors.correct,
    },
    optionIncorrect: {
        backgroundColor: Colors.incorrect,
        borderColor: Colors.incorrect,
    },
    optionText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
        alignSelf: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    nextButtonText: {
        color: Colors.text,
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
    errorText: {
        color: Colors.text,
        textAlign: 'center',
        marginTop: 100,
        fontSize: 18,
    },
    backButton: {
        alignSelf: 'center',
        marginTop: 20,
        padding: 10,
    },
    backButtonText: {
        color: Colors.accent,
        fontWeight: 'bold',
    }
});

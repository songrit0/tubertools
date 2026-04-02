import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Gamepad2 } from 'lucide-react-native';
import { Colors } from '../theme/colors';

export default function SplashScreen({ navigation }) {
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                navigation.replace('Home');
            }, 1000);
        });
    }, [navigation, fadeAnim]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
                <Gamepad2 size={100} color={Colors.accent} />
                <Text style={styles.title}>WHAT'S ARE THESE</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 20,
        textAlign: 'center',
    },
});

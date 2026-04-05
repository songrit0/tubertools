import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

export default function ResponsiveContainer({ children, style, maxWidth = 1400 }) {
    const responsive = useResponsive();

    const containerStyle = [
        styles.container,
        {
            maxWidth: responsive.isWeb ? maxWidth : '100%',
            alignSelf: 'center',
            width: '100%',
        },
        style,
    ];

    return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

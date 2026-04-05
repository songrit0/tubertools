import { Platform, StyleSheet } from 'react-native';

// Web-specific styles helper
export const createWebStyles = (baseStyles) => {
    if (Platform.OS === 'web') {
        return StyleSheet.create({
            ...baseStyles,
            // Override styles for web if needed
            ...Object.keys(baseStyles).reduce((acc, key) => {
                acc[key] = {
                    ...baseStyles[key],
                    // Add web-specific properties
                    ...(typeof window !== 'undefined' && {
                        // Ensure proper box model for web
                        boxSizing: 'border-box',
                    }),
                };
                return acc;
            }, {}),
        });
    }
    return StyleSheet.create(baseStyles);
};

// Responsive value helper
export const responsiveValue = (mobileValue, webValue) => {
    return Platform.OS === 'web' ? webValue : mobileValue;
};

// Media query breakpoints
export const BREAKPOINTS = {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    largeDesktop: 1400,
};

// Responsive padding
export const responsivePadding = (width) => {
    if (width >= BREAKPOINTS.largeDesktop) return 80;
    if (width >= BREAKPOINTS.desktop) return 60;
    if (width >= BREAKPOINTS.tablet) return 40;
    return 20;
};

// Responsive gap
export const responsiveGap = (width) => {
    if (width >= BREAKPOINTS.desktop) return 20;
    if (width >= BREAKPOINTS.tablet) return 15;
    return 10;
};

// Responsive font size
export const responsiveFontSize = (width, baseSize) => {
    if (width >= BREAKPOINTS.largeDesktop) return baseSize * 1.2;
    if (width >= BREAKPOINTS.desktop) return baseSize * 1.1;
    if (width >= BREAKPOINTS.tablet) return baseSize * 1.05;
    return baseSize;
};

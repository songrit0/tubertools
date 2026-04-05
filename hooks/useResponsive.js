import { useState, useEffect } from 'react';
import { Dimensions, useWindowDimensions } from 'react-native';

export const useResponsive = () => {
    const windowDimensions = useWindowDimensions();
    const [isWeb, setIsWeb] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const width = windowDimensions.width;
        const height = windowDimensions.height;

        // Detect if web
        const isWebPlatform = typeof window !== 'undefined';
        setIsWeb(isWebPlatform);

        // Responsive breakpoints
        if (isWebPlatform) {
            // Web
            if (width < 768) {
                setIsMobile(true);
                setIsTablet(false);
            } else if (width < 1024) {
                setIsMobile(false);
                setIsTablet(true);
            } else {
                setIsMobile(false);
                setIsTablet(false);
            }
        } else {
            // Native
            if (height > width) {
                // Portrait
                setIsMobile(true);
                setIsTablet(false);
            } else {
                // Landscape
                setIsMobile(false);
                setIsTablet(true);
            }
        }
    }, [windowDimensions.width, windowDimensions.height]);

    return {
        width: windowDimensions.width,
        height: windowDimensions.height,
        isWeb,
        isMobile,
        isTablet,
        isCompact: windowDimensions.width < 600,
    };
};

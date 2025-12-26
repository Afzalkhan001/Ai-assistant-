import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { useNavVisibility } from '../contexts/NavVisibilityContext';
import { haptics } from '../utils/haptics';

// Tab configuration
const TABS = [
    { name: 'index', icon: 'chatbubble', label: 'Chat' },
    { name: 'tasks', icon: 'flash', label: 'Flow' },
    { name: 'checkin', icon: 'sunny', label: 'Check-in' },
    { name: 'settings', icon: 'settings', label: 'Settings' },
];

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { isVisible, showNav } = useNavVisibility();

    // Smooth visibility animation
    const visibility = useSharedValue(1);

    useEffect(() => {
        visibility.value = withSpring(isVisible ? 1 : 0, {
            damping: 25,
            stiffness: 200,
            mass: 0.8,
        });
    }, [isVisible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: visibility.value,
        transform: [
            {
                translateY: interpolate(
                    visibility.value,
                    [0, 1],
                    [80, 0],
                    Extrapolation.CLAMP
                )
            },
        ],
    }));

    return (
        <Animated.View style={[
            styles.container,
            { bottom: Math.max(insets.bottom, 20) },
            containerStyle
        ]}>
            <BlurView intensity={60} tint="dark" style={styles.blur}>
                <View style={styles.content}>
                    {TABS.map((tab) => {
                        const routeIndex = state.routes.findIndex(r => r.name === tab.name);
                        if (routeIndex === -1) return null;

                        const route = state.routes[routeIndex];
                        const isFocused = state.index === routeIndex;

                        const onPress = () => {
                            if (!isFocused) {
                                haptics.tabChanged(); // Selection haptic
                                navigation.navigate(route.name);
                            }
                            showNav();
                        };

                        return (
                            <TouchableOpacity
                                key={tab.name}
                                onPress={onPress}
                                style={styles.tab}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                                    {isFocused ? (
                                        <LinearGradient
                                            colors={['#f59e0b', '#d97706']}
                                            style={styles.iconGradient}
                                        >
                                            <Ionicons name={tab.icon as any} size={20} color="#fff" />
                                        </LinearGradient>
                                    ) : (
                                        <Ionicons name={`${tab.icon}-outline` as any} size={20} color="#71717a" />
                                    )}
                                </View>
                                <Text style={[styles.label, isFocused && styles.labelActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    blur: {
        backgroundColor: 'rgba(18,18,20,0.9)',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    iconGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: '#52525b',
        marginTop: 4,
    },
    labelActive: {
        color: '#f59e0b',
        fontWeight: '600',
    },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolate,
    Extrapolation,
    useSharedValue,
    useEffect as useReanimatedEffect
} from 'react-native-reanimated';
import { useNavVisibility } from '../contexts/NavVisibilityContext';
import { haptics } from '../utils/haptics';

const { width } = Dimensions.get('window');

// Define exactly which tabs to show
const TABS = [
    { name: 'index', icon: 'chatbubble', label: 'Chat' },
    { name: 'tasks', icon: 'flash', label: 'Flow' },
    { name: 'checkin', icon: 'sunny', label: 'Check-in' },
    { name: 'settings', icon: 'settings', label: 'Settings' },
];

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { isVisible } = useNavVisibility();

    // Animation value for visibility
    const visibilityAnim = useSharedValue(isVisible ? 1 : 0);

    // Update animation when visibility changes
    React.useEffect(() => {
        visibilityAnim.value = withSpring(isVisible ? 1 : 0, {
            damping: 20,
            stiffness: 300,
        });
    }, [isVisible]);

    // Animated styles for the container
    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            opacity: visibilityAnim.value,
            transform: [
                {
                    translateY: interpolate(
                        visibilityAnim.value,
                        [0, 1],
                        [100, 0],
                        Extrapolation.CLAMP
                    )
                },
                {
                    scale: interpolate(
                        visibilityAnim.value,
                        [0, 1],
                        [0.9, 1],
                        Extrapolation.CLAMP
                    )
                }
            ],
        };
    });

    return (
        <Animated.View style={[styles.container, { bottom: Math.max(insets.bottom, 16) }, animatedContainerStyle]}>
            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                <View style={styles.contentContainer}>
                    {TABS.map((tab) => {
                        const routeIndex = state.routes.findIndex(r => r.name === tab.name);
                        if (routeIndex === -1) return null;

                        const route = state.routes[routeIndex];
                        const isFocused = state.index === routeIndex;

                        const onPress = () => {
                            haptics.selectionChanged();

                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={tab.name}
                                onPress={onPress}
                                style={styles.tabItem}
                                activeOpacity={0.7}
                            >
                                <Animated.View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
                                    {isFocused ? (
                                        <LinearGradient
                                            colors={['#f59e0b', '#d97706']}
                                            style={styles.iconGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Ionicons
                                                name={tab.icon as any}
                                                size={22}
                                                color="#fff"
                                            />
                                        </LinearGradient>
                                    ) : (
                                        <View style={styles.iconInner}>
                                            <Ionicons
                                                name={tab.icon as any}
                                                size={22}
                                                color="#71717a"
                                            />
                                        </View>
                                    )}
                                </Animated.View>
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
        left: 24,
        right: 24,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    blurContainer: {
        width: '100%',
        backgroundColor: 'rgba(15,15,18,0.85)',
    },
    contentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    iconContainerActive: {
        borderColor: 'rgba(245,158,11,0.4)',
        shadowColor: "#f59e0b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
        transform: [{ scale: 1.05 }],
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
    },
    iconInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        color: '#52525b',
        marginTop: 6,
        letterSpacing: 0.3,
    },
    labelActive: {
        color: '#f59e0b',
        fontWeight: '700',
    },
});

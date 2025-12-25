import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container}>
            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                <View style={styles.contentContainer}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        // Filter out hidden routes (login, signup)
                        if (options.href === null) return null;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const iconName =
                            route.name === 'index' ? 'chatbubble' :
                                route.name === 'tasks' ? 'flash' :
                                    route.name === 'checkin' ? 'sunny' :
                                        'settings';

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                style={styles.tabItem}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
                                    {isFocused && (
                                        <LinearGradient
                                            colors={['#f59e0b', '#d97706']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    )}
                                    <View style={[styles.iconInner, isFocused && { backgroundColor: 'transparent' }]}>
                                        <Ionicons
                                            name={iconName as any}
                                            size={20}
                                            color={isFocused ? '#fff' : '#71717a'}
                                        />
                                    </View>
                                </View>
                                {isFocused && (
                                    <Text style={styles.label}>{options.title}</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        width: width - 48,
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    blurContainer: {
        width: '100%',
        backgroundColor: 'rgba(20,20,23,0.7)',
    },
    contentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12, // Reduced padding to fit labels
        paddingVertical: 12,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1, // Distribute space evenly
        gap: 4,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    iconContainerActive: {
        borderColor: 'rgba(245,158,11,0.5)',
        shadowColor: "#f59e0b",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        transform: [{ translateY: -4 }], // 3D pop effect
    },
    iconInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#f59e0b',
        marginTop: 4,
        letterSpacing: 0.5,
    },
});

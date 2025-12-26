import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
    { name: 'index', icon: 'chatbubble', label: 'Chat' },
    { name: 'tasks', icon: 'flash', label: 'Flow' },
    { name: 'checkin', icon: 'sunny', label: 'Check-in' },
    { name: 'settings', icon: 'settings', label: 'Settings' },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { bottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.bar}>
                {TABS.map((tab) => {
                    const routeIndex = state.routes.findIndex(r => r.name === tab.name);
                    if (routeIndex === -1) return null;

                    const route = state.routes[routeIndex];
                    const isFocused = state.index === routeIndex;

                    const onPress = () => {
                        if (!isFocused) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            onPress={onPress}
                            style={styles.tab}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                {isFocused ? (
                                    <LinearGradient
                                        colors={['#f59e0b', '#d97706']}
                                        style={styles.iconActive}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
    },
    bar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(18,18,20,0.95)',
        borderRadius: 28,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconActive: {
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
        marginTop: 2,
    },
    labelActive: {
        color: '#f59e0b',
        fontWeight: '600',
    },
});

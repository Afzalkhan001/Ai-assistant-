import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';

export default function TabLayout() {
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.background,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                    letterSpacing: 0.5,
                },
                tabBarStyle: {
                    backgroundColor: Colors.background,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: 70,
                    paddingBottom: 12,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Chat',
                    headerTitle: () => (
                        <View style={styles.headerContainer}>
                            <Image
                                source={require('../assets/images/icon.png')}
                                style={styles.logo}
                            />
                            <View>
                                <Text style={styles.headerTitle}>AERA</Text>
                                <Text style={styles.headerSubtitle}>Your companion</Text>
                            </View>
                        </View>
                    ),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Flow',
                    headerTitle: 'Your Commitments',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="flash" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="checkin"
                options={{
                    title: 'Check-in',
                    headerTitle: 'Daily Check-in',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="sunny" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    headerTitle: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={22} color={color} />
                    ),
                }}
            />
            {/* Hidden screens */}
            <Tabs.Screen
                name="login"
                options={{
                    href: null,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="signup"
                options={{
                    href: null,
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logo: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    headerTitle: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    headerSubtitle: {
        color: Colors.textMuted,
        fontSize: 10,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

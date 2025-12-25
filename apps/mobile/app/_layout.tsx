import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import CustomTabBar from '../components/CustomTabBar';

export default function TabLayout() {
    const router = useRouter();

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
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
                tabBarHideOnKeyboard: true,
                headerShown: false, // We use custom headers in screens usually, or simple ones here
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Chat',
                    headerShown: false, // Chat has its own absolute header
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Flow',
                    headerShown: true,
                    headerTitle: 'Your Commitments',
                }}
            />
            <Tabs.Screen
                name="checkin"
                options={{
                    title: 'Check-in',
                    headerShown: true,
                    headerTitle: 'Daily Check-in',
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    headerShown: true,
                    headerTitle: 'Settings',
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

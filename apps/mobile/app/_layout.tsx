import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#0f172a',
                },
                headerTintColor: '#f8fafc',
                tabBarStyle: {
                    backgroundColor: '#0f172a',
                    borderTopColor: '#1e293b',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#f97316',
                tabBarInactiveTintColor: '#64748b',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Tasks',
                    headerTitle: 'My Commitments',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="checkbox-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chat',
                    headerTitle: 'AI Companion',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="checkin"
                options={{
                    title: 'Check-in',
                    headerTitle: 'Daily Check-in',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="sunny-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

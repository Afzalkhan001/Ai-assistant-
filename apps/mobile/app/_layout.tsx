import { Tabs } from 'expo-router';
import { Colors } from '../constants';
import CustomTabBar from '../components/CustomTabBar';

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.background,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Chat',
                    headerShown: false,
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
            <Tabs.Screen
                name="login"
                options={{ href: null, headerShown: false }}
            />
            <Tabs.Screen
                name="signup"
                options={{ href: null, headerShown: false }}
            />
        </Tabs>
    );
}

import { Tabs } from 'expo-router';
import { Home, User, Calendar } from 'lucide-react-native';
import { colors, borderRadii, spacing } from '../../src/constants/theme';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = 220;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.secondary },
        tabBarActiveTintColor: colors.secondary, // Icon color when active (black)
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Home size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Calendar size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <User size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    marginHorizontal: 90, // Squeezes it perfectly from both sides, implicitly centering and reducing width
    backgroundColor: colors.cardDark, // Dark gray floating bar
    borderRadius: 36, // Strict pill shape
    height: 72,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1, // Override React Navigation default
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    // Critical fixes to stop React Nav from injecting layout-breaking safe area padding
    // Critical fixes to stop React Nav from injecting layout-breaking safe area padding
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 8,
  },
  tabBarItem: {
    height: 72, // Match tabBar height
    paddingTop: 14, 
    paddingBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: colors.accent,
  },
});

import { Tabs } from 'expo-router';
import { Home, User, Calendar, FileText } from 'lucide-react-native';
import { borderRadii, spacing, useThemeColors } from '../../src/constants/theme';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';

const TAB_BAR_WIDTH = 220;

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const styles = getStyles(colors, width);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.secondary },
        tabBarActiveTintColor: colors.chartGreen, // Subtle white instead of neon
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
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <FileText size={24} color={color} />
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
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const getStyles = (colors: any, screenWidth: number) => StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    marginHorizontal: (screenWidth - TAB_BAR_WIDTH) / 2,
    backgroundColor: '#141414', // Deep dark to match other cards
    borderRadius: 36, // Strict pill shape
    height: 72,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', // Glass border
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    paddingBottom: 0,
    paddingTop: 0,
    paddingHorizontal: 12,
  },
  tabBarItem: {
    height: 72,
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
    // Optional: add a subtle tint if desired, but transparent keeps it sleek
    backgroundColor: 'transparent',
  },
});

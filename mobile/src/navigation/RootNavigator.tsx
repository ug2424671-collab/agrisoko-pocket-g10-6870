import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AboutScreen } from '../screens/AboutScreen';
import { AskScreen } from '../screens/AskScreen';
import { DirectoryScreen } from '../screens/DirectoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MemberProfileScreen } from '../screens/MemberProfileScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { SourceBadge } from '../components/SourceBadge';
import { GROUP_CODE } from '../config';
import { useTeam } from '../context/TeamContext';
import { colors, spacing } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof TabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Ask: { active: 'search', inactive: 'search-outline' },
  Directory: { active: 'people', inactive: 'people-outline' },
  Result: { active: 'sparkles', inactive: 'sparkles-outline' },
};

function HeaderStatus() {
  const { isOnline, isCheckingNetwork, answer, directorySource } = useTeam();
  const label = isCheckingNetwork
    ? 'Checking connection…'
    : isOnline
      ? 'Online'
      : 'Offline';
  const source = answer?.source ?? directorySource;

  return (
    <View style={styles.headerRow}>
      <View
        accessible
        accessibilityLabel={`Connection status: ${label}`}
        style={[styles.statusChip, isOnline ? styles.statusOnline : styles.statusOffline]}
      >
        <Text style={styles.statusText}>{label}</Text>
      </View>
      <SourceBadge source={source} style={styles.badge} />
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerRight: () => <HeaderStatus />,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: colors.onPrimary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const names = ICONS[route.name];
          return <Ionicons name={focused ? names.active : names.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: `AgriSoko Pocket ${GROUP_CODE}`, tabBarLabel: 'Home' }}
      />
      <Tab.Screen name="Ask" component={AskScreen} options={{ title: 'Ask the team', tabBarLabel: 'Ask' }} />
      <Tab.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{ title: 'Team directory', tabBarLabel: 'Team' }}
      />
      <Tab.Screen name="Result" component={ResultScreen} options={{ title: 'AI result', tabBarLabel: 'Result' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="MemberProfile"
        component={MemberProfileScreen}
        options={({ route }) => ({
          title: route.params?.fallbackName ?? 'Member profile',
          headerStyle: styles.header,
          headerTintColor: colors.onPrimary,
          headerTitleStyle: styles.headerTitle,
        })}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About and evidence',
          headerStyle: styles.header,
          headerTintColor: colors.onPrimary,
          headerTitleStyle: styles.headerTitle,
        }}
      />
    </Stack.Navigator>
  );
}

export function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
  },
  headerTitle: {
    color: colors.onPrimary,
    fontSize: 17,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    maxWidth: '70%',
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
  },
  statusOnline: {
    backgroundColor: colors.success,
  },
  statusOffline: {
    backgroundColor: colors.danger,
  },
  statusText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    maxWidth: 150,
  },
  tabLabel: {
    fontSize: 12,
  },
  action: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionPressed: {
    opacity: 0.8,
  },
  actionLabel: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
});

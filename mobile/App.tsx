import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';

import { RootNavigator } from './src/navigation/RootNavigator';
import { TeamProvider } from './src/context/TeamContext';
import { colors } from './src/theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <TeamProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </TeamProvider>
    </SafeAreaProvider>
  );
}

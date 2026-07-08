import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '@store';
import { ThemeProvider, useTheme } from '@theme';
import { RootNavigator } from '@navigation';
import { syncGeofences } from '@services';
import { useAppSelector } from '@hooks';

const ThemedApp: React.FC = () => {
  const theme = useTheme();

  useEffect(() => {
    syncGeofences().catch(() => undefined);
  }, []);

  return (
    <>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <RootNavigator />
    </>
  );
};

const AppWithTheme: React.FC = () => {
  const preference = useAppSelector(state => state.settings.themePreference);
  return (
    <ThemeProvider preference={preference}>
      <ThemedApp />
    </ThemeProvider>
  );
};

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppWithTheme />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = { root: { flex: 1 } };

export default App;

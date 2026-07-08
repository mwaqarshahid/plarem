import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store, setOnboarded } from '@store';
import { ThemeProvider, useTheme } from '@theme';
import { RootNavigator } from '@navigation';
import { syncGeofences, warmUpLocation } from '@services';
import { useAppDispatch, useAppSelector } from '@hooks';
import { AppAlertProvider, PermissionsOnboarding } from '@components';

const ThemedApp: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const onboarded = useAppSelector(state => state.settings.onboarded);

  useEffect(() => {
    syncGeofences().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (onboarded) {
      warmUpLocation().catch(() => undefined);
    }
  }, [onboarded]);

  return (
    <>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <RootNavigator />
      <AppAlertProvider />
      {!onboarded ? (
        <PermissionsOnboarding onComplete={() => dispatch(setOnboarded(true))} />
      ) : null}
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

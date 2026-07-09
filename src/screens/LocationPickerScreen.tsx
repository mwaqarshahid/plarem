import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme';
import { Button, Chip, Icon, TextField } from '@components';
import {
  getCachedLocation,
  getCurrentPosition,
  getCurrentPositionFast,
  PlaceSuggestion,
  requestForegroundLocation,
  reverseGeocode,
  searchPlaces,
  setCachedLocation,
  warmUpLocation,
} from '@services';
import type { Coordinates } from '@services';
import { DEFAULT_MAP_REGION, DEFAULT_RADIUS_METERS, GOOGLE_MAPS_API_KEY, RADIUS_PRESETS } from '@constants';
import { ReminderLocation } from '@types';
import { showAlert } from '@utils/alert';
import type { RootStackScreenProps } from '@navigation/types';

const MAP_DELTA = 0.02;

const MAP_CONTROL_BACKDROP = {
  light: '#e5e3df',
  dark: '#242f3e',
} as const;

const mapControlBlockerStyle = (top: number, dark: boolean): ViewStyle => ({
  top: top + 8,
  backgroundColor: dark ? MAP_CONTROL_BACKDROP.dark : MAP_CONTROL_BACKDROP.light,
});

const regionFrom = (latitude: number, longitude: number): Region => ({
  latitude,
  longitude,
  latitudeDelta: MAP_DELTA,
  longitudeDelta: MAP_DELTA,
});

const resolveStartRegion = (initial?: ReminderLocation): Region => {
  if (initial) {
    return regionFrom(initial.latitude, initial.longitude);
  }
  const cached = getCachedLocation();
  if (cached) {
    return regionFrom(cached.latitude, cached.longitude);
  }
  return DEFAULT_MAP_REGION;
};

export const LocationPickerScreen: React.FC<RootStackScreenProps<'LocationPicker'>> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const initial = route.params?.initial;
  const [selection, setSelection] = useState<ReminderLocation | undefined>(initial);
  const [mapRegion] = useState<Region>(() => resolveStartRegion(initial));
  const [radius, setRadius] = useState(route.params?.initialRadius ?? DEFAULT_RADIUS_METERS);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [centeringMap, setCenteringMap] = useState(!initial && !getCachedLocation());
  const userLocationRef = useRef<Coordinates | undefined>(getCachedLocation());

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      showAlert(
        'Google Maps API key missing',
        'Copy .env.example to .env, add GOOGLE_MAPS_API_KEY, then run npm run android to rebuild.',
      );
    }
  }, []);

  const animateTo = useCallback((latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion(regionFrom(latitude, longitude), 400);
  }, []);

  const selectCoordinate = useCallback(
    async (latitude: number, longitude: number, placeName?: string, address?: string) => {
      const fallbackAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setSelection({
        latitude,
        longitude,
        address: address ?? fallbackAddress,
        placeName,
      });
      animateTo(latitude, longitude);

      if (address) {
        return;
      }

      setResolving(true);
      try {
        const resolved = await reverseGeocode(latitude, longitude);
        setSelection({ latitude, longitude, address: resolved, placeName });
      } finally {
        setResolving(false);
      }
    },
    [animateTo],
  );

  // Refine map center in the background using a warmed/cached fix.
  useEffect(() => {
    if (initial) {
      return;
    }
    let cancelled = false;
    (async () => {
      const position = (await warmUpLocation()) ?? getCachedLocation();
      if (cancelled || !position) {
        setCenteringMap(false);
        return;
      }
      userLocationRef.current = position;
      setCachedLocation(position);
      animateTo(position.latitude, position.longitude);
      setCenteringMap(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [animateTo, initial]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setSuggestions(await searchPlaces(term, selection ?? undefined));
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const useCurrentLocation = async (): Promise<void> => {
    const state = await requestForegroundLocation();
    if (state !== 'granted') {
      showAlert(
        'Location permission required',
        'Allow location access to use your current position, or tap the map to drop a pin.',
      );
      return;
    }
    setLocating(true);
    try {
      const position =
        (await getCurrentPositionFast().catch(() => getCurrentPosition(true)).catch(() => undefined)) ??
        userLocationRef.current ??
        getCachedLocation();
      if (!position) {
        throw new Error('Location unavailable');
      }
      userLocationRef.current = position;
      setCachedLocation(position);
      await selectCoordinate(position.latitude, position.longitude);
    } catch {
      showAlert(
        'Location unavailable',
        'Could not determine your current position. Tap the map to drop a pin instead.',
      );
    } finally {
      setLocating(false);
    }
  };

  const confirm = (): void => {
    if (!selection) {
      return;
    }
    navigation.popTo(
      'ReminderForm',
      { pickedLocation: selection, pickedRadius: radius },
      { merge: true },
    );
  };

  return (
    <View
      testID="location-picker-screen"
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        testID="location-picker-map"
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={mapRegion}
        userInterfaceStyle={theme.dark ? 'dark' : 'light'}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        showsCompass={false}
        zoomControlEnabled={false}
        rotateEnabled={false}
        mapPadding={{ top: insets.top + 72, right: 16, bottom: 260, left: 16 }}
        onPress={event => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          selectCoordinate(latitude, longitude);
        }}
        onPoiClick={event => {
          const { coordinate, name } = event.nativeEvent;
          selectCoordinate(coordinate.latitude, coordinate.longitude, name);
        }}>
        {selection ? (
          <>
            <Marker
              coordinate={{ latitude: selection.latitude, longitude: selection.longitude }}
              draggable
              onDragEnd={event => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                selectCoordinate(latitude, longitude);
              }}
            />
            <Circle
              center={{ latitude: selection.latitude, longitude: selection.longitude }}
              radius={radius}
              strokeColor={theme.colors.primary}
              fillColor={theme.dark ? 'rgba(155,163,255,0.18)' : 'rgba(79,91,232,0.15)'}
              strokeWidth={2}
            />
          </>
        ) : null}
      </MapView>

      {centeringMap ? (
        <View
          pointerEvents="none"
          style={[
            styles.centeringBadge,
            {
              top: insets.top + 64,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.pill,
            },
          ]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[theme.typography.labelSmall, { color: theme.colors.onSurfaceVariant }]}>
            Centering on your location…
          </Text>
        </View>
      ) : null}

      <View
        pointerEvents="auto"
        style={[styles.mapControlBlocker, mapControlBlockerStyle(insets.top, theme.dark)]}
      />

      <View pointerEvents="box-none" style={[styles.searchOverlay, { top: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <Pressable
            testID="location-picker-back"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={[
              styles.roundButton,
              { backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill },
            ]}>
            <Icon name="arrow-left" size={22} color={theme.colors.onSurface} />
          </Pressable>
          <View style={styles.searchField}>
            <TextField
              testID="location-picker-search"
              placeholder="Search address or place"
              value={query}
              onChangeText={setQuery}
              style={{ backgroundColor: theme.colors.surface }}
            />
          </View>
        </View>

        {searching || suggestions.length > 0 ? (
          <View
            style={[
              styles.suggestions,
              { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg },
            ]}>
            {searching ? (
              <ActivityIndicator style={styles.searchSpinner} color={theme.colors.primary} />
            ) : (
              <FlatList
                data={suggestions}
                keyboardShouldPersistTaps="handled"
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <Pressable
                    testID={`location-picker-suggestion-${index}`}
                    style={styles.suggestionRow}
                    onPress={() => {
                      Keyboard.dismiss();
                      setQuery('');
                      setSuggestions([]);
                      selectCoordinate(
                        item.latitude,
                        item.longitude,
                        item.primaryText,
                        item.secondaryText,
                      );
                    }}>
                    <Icon name="map-marker-outline" size={20} color={theme.colors.primary} />
                    <View style={styles.suggestionText}>
                      <Text
                        numberOfLines={1}
                        style={[theme.typography.titleMedium, { color: theme.colors.onSurface }]}>
                        {item.primaryText}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          theme.typography.bodySmall,
                          { color: theme.colors.onSurfaceVariant },
                        ]}>
                        {item.secondaryText}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            paddingBottom: insets.bottom + 16,
          },
        ]}>
        <View style={styles.selectionRow}>
          <Icon name="map-marker" size={22} color={theme.colors.primary} />
          <Text
            numberOfLines={2}
            style={[theme.typography.bodyMedium, styles.selectionText, { color: theme.colors.onSurface }]}>
            {resolving
              ? 'Resolving address…'
              : selection
                ? selection.placeName
                  ? `${selection.placeName} — ${selection.address}`
                  : selection.address
                : 'Tap the map, search or use your current location.'}
          </Text>
        </View>

        <View style={styles.radiusRow}>
          {RADIUS_PRESETS.map(preset => (
            <Chip
              key={preset}
              label={preset >= 1000 ? `${preset / 1000} km` : `${preset} m`}
              selected={radius === preset}
              onPress={() => setRadius(preset)}
            />
          ))}
        </View>

        <View style={styles.actionsRow}>
          <Button
            testID="location-picker-current"
            label="Current location"
            icon="crosshairs-gps"
            variant="secondary"
            onPress={useCurrentLocation}
            loading={locating}
            style={styles.actionButton}
          />
          <Button
            testID="location-picker-confirm"
            label="Confirm"
            icon="check"
            onPress={confirm}
            disabled={!selection}
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeringBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 2,
    elevation: 4,
  },
  searchOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 2,
  },
  mapControlBlocker: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    zIndex: 1,
    elevation: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  searchField: {
    flex: 1,
  },
  suggestions: {
    maxHeight: 280,
    elevation: 4,
    overflow: 'hidden',
  },
  searchSpinner: {
    paddingVertical: 20,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionText: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    gap: 16,
    elevation: 12,
    zIndex: 2,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectionText: {
    flex: 1,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

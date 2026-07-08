import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { ReminderLocation } from '@types';

export type MainTabParamList = {
  Home: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  ReminderForm:
    | {
        reminderId?: string;
        /** Set when returning from the LocationPicker screen. */
        pickedLocation?: ReminderLocation;
        pickedRadius?: number;
      }
    | undefined;
  ReminderDetails: { reminderId: string };
  LocationPicker: {
    /** Existing selection to preload the map with. */
    initial?: ReminderLocation;
    initialRadius?: number;
  };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

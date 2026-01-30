import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Admin: undefined;
  ClassSelection: undefined;
  Dashboard: undefined;
  Dungeon: undefined;
  Home: undefined;
  Inventory: undefined;
  Login: undefined;
  Shop: undefined;
  Signup: undefined;
  Social: undefined;
  Training: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
import type { NavigatorScreenParams } from '@react-navigation/native';

/** Typed navigation parameters: every screen receives exactly what it needs. */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  MemberProfile: { memberId: string; fallbackName?: string };
  About: undefined;
};

export type TabParamList = {
  Home: undefined;
  Ask: { prefill?: string } | undefined;
  Directory: undefined;
  Result: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AboutScreen } from "../screens/AboutScreen";
import { SongDetailScreen } from "../screens/SongDetailScreen";
import { SongListScreen } from "../screens/SongListScreen";
import { useTheme } from "../theme/ThemeContext";

export type RootStackParamList = {
  SongList: undefined;
  SongDetail: { songId: number };
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { resolved, colors, mode, toggleLightDark } = useTheme();
  const insets = useSafeAreaInsets();

  const navTheme: NavTheme = useMemo(() => {
    const base = resolved === "dark" ? NavDarkTheme : NavDefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [resolved, colors]);

  const themeIcon = mode === "light" ? ("moon" as const) : ("sunny" as const);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName="SongList"
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: "600", fontSize: 17 },
            contentStyle: { flex: 1, backgroundColor: colors.background },
            ...(Platform.OS === "android"
              ? {
                  statusBarStyle: resolved === "dark" ? "light" : "dark",
                }
              : {
                  fullScreenGestureShadowEnabled: false,
                }),
          }}
        >
        <Stack.Screen
          name="SongList"
          component={SongListScreen}
          options={({ navigation }) => ({
            title: "Praise Myanmar Hymnal",
            headerLargeTitle: false,
            headerRight: () => (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingRight: insets.right || 8 }}>
                <Pressable
                  onPress={() => navigation.navigate("About")}
                  accessibilityRole="button"
                  accessibilityLabel="Open about page"
                  hitSlop={12}
                  style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
                >
                  <Ionicons name="information-circle-outline" size={23} color={colors.accent} />
                </Pressable>
                <Pressable
                  onPress={toggleLightDark}
                  accessibilityRole="button"
                  accessibilityLabel={
                    mode === "light"
                      ? "Light theme. Tap for dark theme."
                      : "Dark theme. Tap for light theme."
                  }
                  hitSlop={12}
                  style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
                >
                  <Ionicons name={themeIcon} size={22} color={colors.accent} />
                </Pressable>
              </View>
            ),
          })}
        />
        <Stack.Screen
          name="SongDetail"
          component={SongDetailScreen}
          options={{
            title: "",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            title: "About",
            headerBackTitle: "Back",
          }}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

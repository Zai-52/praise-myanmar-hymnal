import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDatabase } from "../context/DatabaseContext";
import { fetchSongById, setFavorite } from "../db/database";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import {
  MYANMAR_FONT_MEDIUM,
  MYANMAR_FONT_REGULAR,
  MYANMAR_FONT_SEMIBOLD,
  MYANMAR_TEXT_PADDING_TOP,
  myanmarTextProps,
} from "../theme/typography";

type Props = NativeStackScreenProps<RootStackParamList, "SongDetail">;

export function SongDetailScreen({ route, navigation }: Props) {
  const { songId } = route.params;
  const { db, ready } = useDatabase();
  const { colors, mode, toggleLightDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [favorite, setFavoriteState] = useState(false);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof fetchSongById>>>(null);

  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const data = await fetchSongById(db, songId);
      if (!cancelled) {
        setPayload(data);
        if (data) setFavoriteState(!!data.song.is_favorite);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, songId]);

  const toggleFavorite = useCallback(async () => {
    if (!db) return;
    const next = !favorite;
    setFavoriteState(next);
    await setFavorite(db, songId, next);
  }, [db, songId, favorite]);

  useLayoutEffect(() => {
    const themeIcon = mode === "light" ? ("moon" as const) : ("sunny" as const);
    navigation.setOptions({
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingRight: insets.right || 8,
          }}
        >
          <Pressable
            onPress={() => void toggleFavorite()}
            accessibilityRole="button"
            accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"}
            hitSlop={12}
            style={{
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={24}
              color={favorite ? colors.heart : colors.heartOutline}
            />
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
            style={{
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name={themeIcon} size={22} color={colors.accent} />
          </Pressable>
        </View>
      ),
    });
  }, [
    navigation,
    favorite,
    mode,
    toggleFavorite,
    toggleLightDark,
    colors.accent,
    colors.heart,
    colors.heartOutline,
    insets.right,
  ]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!ready || !db) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!payload) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24 }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: MYANMAR_FONT_REGULAR }}>
          This song could not be loaded.
        </Text>
      </View>
    );
  }

  const { song, paragraphs, references } = payload;

  const refs = references.map((ref) => {
    const normalizedKey = ref.key.trim().toUpperCase();
    const label =
      normalizedKey.length === 2
        ? `${normalizedKey[0]}.${normalizedKey[1]}.`
        : `${normalizedKey}.`;
    return { label, value: ref.value };
  });

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text {...myanmarTextProps} style={styles.titleMy}>
        {song.song_number_raw}။ {song.title_my}
      </Text>
      <Text style={styles.titleEn}>{song.title_en}</Text>

      {refs.length > 0 ? (
        <View style={styles.refRow}>
          {refs.map((r) => (
            <View key={r.label} style={styles.chip}>
              <Text style={styles.chipLabel}>{r.label}</Text>
              <Text style={styles.chipValue}>{r.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {paragraphs.map((p) => (
        <View key={p.id} style={styles.block}>
          <Text {...myanmarTextProps} style={styles.body}>
            {p.body_text}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "android" ? 12 : 10,
      paddingBottom: 40,
    },
    titleMy: {
      fontSize: 21,
      lineHeight: 34,
      paddingTop: MYANMAR_TEXT_PADDING_TOP,
      color: colors.textPrimary,
      fontFamily: MYANMAR_FONT_SEMIBOLD,
    },
    titleEn: {
      marginTop: 6,
      fontSize: 16,
      lineHeight: 24,
      paddingTop: Platform.OS === "android" ? 2 : 1,
      color: colors.textSecondary,
      fontFamily: MYANMAR_FONT_MEDIUM,
    },
    refRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 16,
      marginBottom: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 6,
    },
    chipLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: MYANMAR_FONT_MEDIUM,
    },
    chipValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: MYANMAR_FONT_MEDIUM,
    },
    block: {
      marginTop: 20,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    body: {
      fontSize: 17,
      lineHeight: 32,
      paddingTop: MYANMAR_TEXT_PADDING_TOP,
      color: colors.textPrimary,
      fontFamily: MYANMAR_FONT_REGULAR,
    },
  });
}

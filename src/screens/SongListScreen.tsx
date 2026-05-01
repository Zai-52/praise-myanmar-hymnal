import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../context/DatabaseContext";
import { fetchAllSongs } from "../db/database";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import {
  MYANMAR_FONT_MEDIUM,
  MYANMAR_FONT_REGULAR,
  MYANMAR_TEXT_PADDING_TOP,
  myanmarTextProps,
} from "../theme/typography";
import type { SongRow } from "../types/hymn";
import { songMatchesQuery } from "../utils/filterSongs";

type Nav = NativeStackNavigationProp<RootStackParamList, "SongList">;

export function SongListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { db, ready, error } = useDatabase();
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 220);

  const load = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const rows = await fetchAllSongs(db);
      setSongs(
        rows.map((r) => ({
          ...r,
          is_favorite: r.is_favorite ? 1 : 0,
        })) as SongRow[]
      );
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filtered = useMemo(() => {
    return songs.filter((s) => songMatchesQuery(s, debouncedQuery));
  }, [songs, debouncedQuery]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (error) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={["left", "right", "bottom"]}>
        <Text style={styles.errorText}>{error.message}</Text>
      </SafeAreaView>
    );
  }

  if (!ready || !db) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={["left", "right", "bottom"]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={colors.placeholder} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by number or title…"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search hymns"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={22} color={colors.placeholder} />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("SongDetail", { songId: item.id })}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${item.song_number_raw}။ ${item.title_my}, ${item.title_en}`}
            >
              <View style={styles.rowText}>
                <Text {...myanmarTextProps} style={styles.titleMy} numberOfLines={3}>
                  {item.song_number_raw}။ {item.title_my}
                </Text>
                <Text style={styles.sub} numberOfLines={2}>
                  {item.title_en}
                </Text>
              </View>
              {item.is_favorite ? (
                <Ionicons name="heart" size={20} color={colors.heart} style={styles.rowHeart} />
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No songs match your search.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorText: {
      color: colors.heart,
      fontFamily: MYANMAR_FONT_REGULAR,
      textAlign: "center",
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 16,
      paddingHorizontal: 12,
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    searchIcon: { marginRight: 8 },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      fontFamily: MYANMAR_FONT_REGULAR,
      paddingVertical: Platform.OS === "ios" ? 10 : 8,
    },
    clearBtn: { padding: 4 },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 10,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    rowPressed: { opacity: 0.92 },
    rowText: { flex: 1, paddingRight: 8 },
    titleMy: {
      fontSize: 17,
      lineHeight: 30,
      paddingTop: MYANMAR_TEXT_PADDING_TOP,
      color: colors.textPrimary,
      fontFamily: MYANMAR_FONT_MEDIUM,
    },
    sub: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 22,
      paddingTop: Platform.OS === "android" ? 2 : 1,
      color: colors.textSecondary,
      fontFamily: MYANMAR_FONT_REGULAR,
    },
    rowHeart: { marginLeft: 4 },
    empty: {
      textAlign: "center",
      marginTop: 48,
      color: colors.textSecondary,
      fontFamily: MYANMAR_FONT_REGULAR,
    },
  });
}

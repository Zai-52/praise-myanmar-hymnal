import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { MYANMAR_FONT_MEDIUM, MYANMAR_FONT_REGULAR, myanmarTextProps } from "../theme/typography";

const GITHUB_URL = "https://github.com/Zai-52/praise-myanmar-hymnal";
const FEEDBACK_EMAILS = ["zawyehtet7928@gmail.com", "yyar70386@gmail.com"];

export function AboutScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const openGithub = useCallback(async () => {
    await Linking.openURL(GITHUB_URL);
  }, []);

  const openMail = useCallback(async (email: string) => {
    await Linking.openURL(`mailto:${email}`);
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Purpose</Text>
        <Text style={styles.bodyText}>
          This app is designed to help brothers and sisters easily search for and sing hymns digitally.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Copyright & Source</Text>
        <Text style={styles.bodyText}>The developers do not own the lyrics. This project is for ministry and educational purposes only.</Text>
        <Text {...myanmarTextProps} style={styles.sourceText}>
          Source: "မြန်မာနိုင်ငံ ညီအစ်ကို အသင်းတော်များ မိတ်သဟာ အဖွဲ့ချုပ် - ချီးမွမ်းဓမ္မသီချင်း (၂၀၀) ပုဒ်" book.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Development Team</Text>
        <Text style={styles.bodyText}>Developers: Zaw Ye Htet & Yar Yar</Text>
        <Text style={styles.bodyText}>Data Digitalization: Aung Myo Oo</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <Text style={styles.bodyText}>Version: 1.0.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Open Source & Contact</Text>
        <Pressable
          onPress={() => void openGithub()}
          accessibilityRole="button"
          accessibilityLabel="Open GitHub link"
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <Ionicons name="logo-github" size={20} color={colors.accent} />
          <Text style={styles.linkText}>GitHub: [https://github.com/Zai-52/praise-myanmar-hymnal]</Text>
        </Pressable>
        {FEEDBACK_EMAILS.map((email) => (
          <Pressable
            key={email}
            onPress={() => void openMail(email)}
            accessibilityRole="button"
            accessibilityLabel={`Email ${email}`}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          >
            <Ionicons name="mail-outline" size={20} color={colors.accent} />
            <Text style={styles.linkText}>{email}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 18,
      gap: 14,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.textPrimary,
      fontFamily: MYANMAR_FONT_MEDIUM,
    },
    bodyText: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.textSecondary,
      fontFamily: MYANMAR_FONT_REGULAR,
    },
    sourceText: {
      fontSize: 15,
      lineHeight: 25,
      color: colors.textSecondary,
      fontFamily: MYANMAR_FONT_REGULAR,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 4,
    },
    linkText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 23,
      color: colors.accent,
      fontFamily: MYANMAR_FONT_REGULAR,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}

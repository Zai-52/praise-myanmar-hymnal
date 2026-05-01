import { Platform } from "react-native";

/** Loaded via @expo-google-fonts/noto-sans-myanmar */
export const MYANMAR_FONT_REGULAR = "NotoSansMyanmar_400Regular";
export const MYANMAR_FONT_MEDIUM = "NotoSansMyanmar_500Medium";
export const MYANMAR_FONT_SEMIBOLD = "NotoSansMyanmar_600SemiBold";

/** Android font padding often clips Myanmar ascenders; pair with generous lineHeight. */
export const myanmarTextProps: { includeFontPadding?: boolean } =
  Platform.OS === "android" ? { includeFontPadding: false } : {};

/** Extra top inset so stacked marks and tall glyphs are not clipped. */
export const MYANMAR_TEXT_PADDING_TOP = Platform.OS === "android" ? 4 : 2;

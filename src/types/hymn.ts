export type HymnReferenceValue = string | number | null;

export type HymnJsonCore = {
  songNumber: string;
  titleMyanmar: string;
  titleEnglish: string;
  paragraphs: string[];
};

export type HymnJson = HymnJsonCore & {
  [referenceKey: string]: HymnReferenceValue | string[] | undefined;
};

export type SongRow = {
  id: number;
  song_number_raw: string;
  song_number_sort: number;
  title_my: string;
  title_en: string;
  zbc: number | null;
  mbc: number | null;
  ss: number | null;
  is_favorite: 0 | 1;
};

export type SongReferenceRow = {
  key: string;
  value: string | number;
};

export type SongParagraphRow = {
  id: number;
  song_id: number;
  sort_order: number;
  body_text: string;
};

export type ThemeMode = "light" | "dark";

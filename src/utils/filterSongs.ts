import type { SongRow } from "../types/hymn";
import { myanmarDigitsToAscii, normalizeMyTitle } from "./digits";

type Row = SongRow;

export function songMatchesQuery(song: Row, rawQuery: string): boolean {
  const q = rawQuery.trim();
  if (!q) return true;

  const qDigits = myanmarDigitsToAscii(q).replace(/\D/g, "");
  const numStr = String(song.song_number_sort);
  const rawDigits = myanmarDigitsToAscii(song.song_number_raw).replace(/\D/g, "");
  const numberHit =
    qDigits.length > 0 && (numStr.includes(qDigits) || rawDigits.includes(qDigits));

  const titleMy = normalizeMyTitle(song.title_my);
  const qMy = normalizeMyTitle(q);
  const titleMyHit = titleMy.includes(qMy);

  const titleEnHit = song.title_en.toLowerCase().includes(q.toLowerCase());

  return numberHit || titleMyHit || titleEnHit;
}

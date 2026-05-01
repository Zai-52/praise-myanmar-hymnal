# Praise Myanmar Hymnal — Product & Technical Specification

## 1. Purpose & scope

**Praise Myanmar Hymnal** is an **offline-first** mobile application built with **React Native**. It lets users browse and search Myanmar hymn lyrics by song number and by title in **Myanmar** and **English**, read full lyrics with **3–5 dynamic verse blocks** per song, mark songs as **favorites**, and use the app in **light or dark** mode with a **clean, modern** interface.

### In scope (v1)

- Local **SQLite** database populated from **bundled JSON** on first launch (and on schema/data version upgrades).
- **Home / list** shows **all songs by default**; a search field **filters** the list in real time. Users are **not** required to press a search button to see songs.
- **Search** matches: song number (Myanmar and Arabic digits), Myanmar title, English title (case-insensitive).
- **Song detail**: Myanmar and English titles, reference numbers (**ZBC**, **MBC**, **S.S.**) for display only, and ordered lyric paragraphs.
- **Favorites**: toggle via a **heart** control; persisted in SQLite.
- **Theming**: light/dark; respect system appearance with optional in-app override; accessible, readable typography for Myanmar script.

### Out of scope (v1)

- Cloud sync, backup, or accounts.
- Editing lyrics or user-supplied hymn data (beyond future app updates replacing bundled JSON).
- Audio playback or sheet music.
- Full-text search inside lyric bodies (optional future enhancement).

---

## 2. Product identity & naming

| Use | Value |
|-----|--------|
| User-facing name | **Praise Myanmar Hymnal** |
| Navigation title, splash, store listing display name | **Praise Myanmar Hymnal** |
| Technical slug (Expo/React Native) | e.g. `praise-myanmar-hymnal` (URL-safe, lowercase, hyphens) |

Implementers should set `app.json` / `app.config` `name` (or equivalent) to the display name and `slug` to the technical identifier. The slug may differ from the full display name.

---

## 3. Personas & key flows

### Primary persona

A user who wants quick access to hymn lyrics on a phone **without internet**, in church or study, using either Myanmar or English titles and hymn numbers.

### Key flows

1. **Browse** — Open app → see full scrollable list → scroll to a song → tap → read lyrics.
2. **Filter** — Type in search → list narrows by number or title → tap result → detail.
3. **Favorite** — On detail (recommended primary location), tap heart → song saved; tap again to remove. Optionally show a favorite indicator on list rows (recommended).
4. **Theme** — Open settings or header control → choose light / dark / system → preference persists across launches.

---

## 4. Functional requirements

### 4.1 Song list (default view)

- On launch, load all songs from SQLite sorted by **`song_number_sort`** (numeric order after normalizing Myanmar digits to Arabic for sorting and storage).
- Display each row with at least: **Myanmar title** (primary), **English title** and/or **song number** as secondary text.
- Use a **virtualized list** (e.g. `FlatList`) for performance with large catalogs.
- **Empty query**: show the full list (no “search first” gate).

### 4.2 Search / filter

- **No mandatory Search button**: filtering occurs as the user types (with light **debounce** optional, e.g. 150–300 ms, to reduce work).
- **Song number**: match whether the user types **Myanmar digits** (e.g. ၇၇) or **Arabic** (e.g. 77). Normalize both query and stored values for comparison (see §6.2).
- **Myanmar title**: substring match (normalization policy: Unicode NFC; no Zawgyi conversion in v1 unless data is standardized later).
- **English title**: case-insensitive substring match.
- **ZBC, MBC, S.S.**: **not** used in v1 search; shown on detail only.

### 4.3 Song detail

- Show: song number (as in source, e.g. Myanmar numerals if that is `song_number_raw`), **title Myanmar**, **title English**, a compact row or chips for **ZBC**, **MBC**, **S.S.** (nullable if missing).
- Lyrics: render **3–5 paragraphs** as separate blocks in `sort_order`, with comfortable line height and padding. Each block’s `body_text` may include multiple lines (e.g. verse label, body, **ထပ်ဆို** / refrain lines) as a single stored string with newlines.
- **Heart** toggles favorite state; state reflects immediately and persists.

### 4.4 Favorites

- Persist favorites locally (SQLite `favorites` table).
- Uniqueness: one row per `song_id`.
- Optional v1 enhancement: filter tab or toggle “Favorites only” on the list (not required unless product owner adds it).

### 4.5 Theme

- Modes: **light**, **dark**, **follow system** (recommended triad).
- Persist last choice in app storage (e.g. AsyncStorage or a small `settings` table).
- Use semantic colors (background, surface, primary text, secondary text, accent) so components stay theme-agnostic.

---

## 5. Data model (SQLite)

### 5.1 Tables

**`songs`**

| Column | Type | Notes |
|--------|------|--------|
| `id` | INTEGER PRIMARY KEY | Surrogate key |
| `song_number_raw` | TEXT | Display form (e.g. Myanmar digits ၇၇) |
| `song_number_sort` | INTEGER | Arabic-digit equivalent for ordering/filter |
| `title_my` | TEXT | Myanmar title |
| `title_en` | TEXT | English title |
| `zbc` | INTEGER NULL | Display only |
| `mbc` | INTEGER NULL | Display only |
| `ss` | INTEGER NULL | S.S. reference; display only |
| `created_at` | TEXT ISO8601 | Optional audit |
| `source_version` | INTEGER NULL | Optional; ties row to bundled data version |

**`song_paragraphs`**

| Column | Type | Notes |
|--------|------|--------|
| `id` | INTEGER PRIMARY KEY | |
| `song_id` | INTEGER NOT NULL | FK → `songs.id` |
| `sort_order` | INTEGER NOT NULL | 0-based or 1-based; consistent app-wide |
| `body_text` | TEXT | Full block including newlines and ထပ်ဆို lines |
| `label` | TEXT NULL | Optional future: e.g. “verse”, “refrain” |

Constraint: typically **3–5** rows per song; enforce in content pipeline, not necessarily with a DB CHECK unless desired.

**`favorites`**

| Column | Type | Notes |
|--------|------|--------|
| `song_id` | INTEGER PRIMARY KEY | FK → `songs.id` |
| `favorited_at` | TEXT ISO8601 | When marked favorite |

### 5.2 Indexes

- `songs(song_number_sort)`
- Optional: `songs(title_my)`, `songs(title_en)` if queries are slow; or introduce **FTS5** later for advanced search.

### 5.3 Migrations & seeding

- Maintain an app-level **`schema_version`** (or use SQLite `PRAGMA user_version`).
- **First run** (empty DB): read bundled JSON, insert all `songs` and `song_paragraphs`.
- **Version bump**: if bundled JSON or schema changes, either full re-seed from JSON (simplest for read-only hymn data) or incremental migration (if you add user data beyond favorites—favorites must be preserved or re-keyed carefully).

---

## 6. Bundled JSON schema

### 6.1 File location

Place under app assets, e.g. `assets/hymns.json` (exact path is an **open item** until the repo contains the full catalog).

### 6.2 Document shape

Top-level: **array of hymn objects**.

```json
{
  "songNumber": "၇၇",
  "titleMyanmar": "လာလိုသူတိုင်းလာနိုင်ခြင်း",
  "titleEnglish": "Whosoever will!",
  "zbc": 237,
  "mbc": 157,
  "ss": 389,
  "paragraphs": [
    "၁။ ကြားရသောသူတိုင်း၊ ...",
    "ထပ်ဆို - လာလိုသောသူတိုင်း၊ ...",
    "၂။ လာလိုသောသူတိုင်း၊ ..."
  ]
}
```

Rules:

- **`paragraphs`**: array of **3–5** strings; each string is one UI block (may contain internal newlines).
- **`zbc`, `mbc`, `ss`**: optional `null` if unknown.
- **`songNumber`**: string; migration computes **`song_number_sort`** by converting Myanmar digits `၀–၉` to `0–9` and parsing integer (define behavior for non-numeric suffixes if any appear in real data).

### 6.3 Myanmar digit normalization (reference)

For matching and sorting, map Unicode Myanmar digits to ASCII digits before integer parse or string comparison for the “number” field. English titles use Latin case folding for search.

---

## 7. UI / UX specification

### 7.1 Branding

Primary chrome (header title, splash if any): **Praise Myanmar Hymnal**. Optional tagline/subtitle can be added later.

### 7.2 Visual design

- **Clean, modern**: generous whitespace, clear hierarchy, card or inset rows optional; avoid clutter.
- **List**: prominent Myanmar title; secondary line with English title and/or number; optional small heart or star **indicator** (filled/outline) if favorited.
- **Detail**: stacked layout—number, Myanmar title (larger), English title (secondary), reference line (**ZBC** · **MBC** · **S.S.**), then paragraphs with spacing between blocks.
- **Search**: persistent field at top of list (or accessible one tap away) with clear placeholder, e.g. “Search by number or title…”.

### 7.3 Favorites control

- **Heart icon** on **song detail** (required).
- **List row** indicator or secondary heart (optional but recommended for scanability).

### 7.4 Accessibility

- Minimum **44×44 pt** touch targets for heart and theme controls.
- Support **dynamic type** / font scaling where the platform allows; test Myanmar script at larger sizes.
- Sufficient contrast in light and dark themes (WCAG-oriented targets).

---

## 8. Technical stack

| Layer | Recommendation |
|--------|------------------|
| Framework | **React Native** |
| Tooling | **Expo** (recommended) for streamlined builds and **`expo-sqlite`** |
| Database | **SQLite** via `expo-sqlite` (or `react-native-quick-sqlite` / bare RN if not using Expo) |
| Local preferences | **AsyncStorage** or SQLite `settings` for theme mode |
| Navigation | React Navigation (stack: list → detail) |

The spec does not require Expo; bare React Native with a SQLite module is acceptable if the team prefers it.

---

## 9. Myanmar text & fonts

- **Encoding**: **Unicode (UTF-8)** for all JSON and DB text.
- **Fonts**: Use a Myanmar-capable font (e.g. **Noto Sans Myanmar** bundled with the app, or a verified system font on target devices). Verify rendering on both Android and iOS.
- **Zawgyi**: v1 assumes **Unicode** source data only; Zawgyi conversion is out of scope unless the catalog is migrated.

---

## 10. Architecture (high level)

```mermaid
flowchart LR
  bundledJSON[BundledJSON]
  migrate[MigrateToSQLite]
  sqlite[(SQLite)]
  ui[ListAndDetailUI]
  bundledJSON --> migrate --> sqlite
  sqlite --> ui
```

- **Startup**: open DB → run migrations → if seed needed, load JSON and insert → navigate to list.
- **List screen**: query all songs (or filtered SQL `WHERE` clause matching normalized number/titles).
- **Detail screen**: query song + paragraphs by `id`; query favorite existence; heart toggles insert/delete in `favorites`.

---

## 11. Testing & acceptance criteria

| # | Criterion |
|---|-----------|
| 1 | Fresh install: bundled JSON loads; `songs` and `song_paragraphs` counts match source. |
| 2 | List shows all songs sorted by `song_number_sort` without typing in search. |
| 3 | Filter by Arabic song number and Myanmar song number both find the same hymn. |
| 4 | Filter by Myanmar title and English title (case variants) returns expected rows. |
| 5 | Detail shows ZBC/MBC/S.S. when present; omits or hides labels gracefully when null. |
| 6 | Songs with **3** and **5** paragraphs render all blocks with correct order. |
| 7 | Favorite toggle persists after force-close and relaunch. |
| 8 | Theme choice persists after relaunch; system mode follows OS when selected. |

---

## 12. Open items

- Final **hymn count** and exact **`assets/...` path** for JSON in the repository.
- **List sort**: strictly by `song_number_sort` only, or optional **favorites-first** / pinned section.
- Optional **tagline** under the app name for marketing.
- Optional v1 **“Favorites only”** filter on the list screen.

---

## 13. Example source record (reference)

The following illustrates one hymn as provided by the product owner; paragraph count and line breaks live inside each `paragraphs[]` entry.

- **Song number**: ၇၇  
- **Song title Myanmar**: လာလိုသူတိုင်းလာနိုင်ခြင်း  
- **Song title English**: Whosoever will!  
- **ZBC**: 237 · **MBC**: 157 · **S.S.**: 389  
- **Body**: multiple stanzas including **ထပ်ဆို** lines, modeled as 3–5 paragraph strings in JSON.

---

*Document version: 1.0 — aligned with the Praise Myanmar Hymnal specification plan (bundled JSON → SQLite, refs display-only, browse-before-search).*

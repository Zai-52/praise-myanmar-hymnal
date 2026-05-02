# Praise Myanmar Hymnal

A mobile hymn app built with Expo + React Native for searching and reading Myanmar hymns digitally.

## Purpose

This app helps brothers and sisters quickly find hymns and sing from a digital hymn book.

## About

- **Copyright**: The developers do not own the lyrics.This project is for ministry and educational purposes only.
- **Source**: "မြန်မာနိုင်ငံ ညီအစ်ကို အသင်းတော်များ မိတ်သဟာ အဖွဲ့ချုပ် - ချီးမွမ်းဓမ္မသီချင်း (၂၀၀) ပုဒ်" book
- **Developers**: Zaw Ye Htet and Yar Yar
- **Data Digitalization**: Aung Myo Oo
- **App Version**: 1.0.0

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation (Native Stack)
- **Database**: SQLite (`expo-sqlite`)
- **UI**: React Native core components + Expo Vector Icons
- **Fonts**: Noto Sans Myanmar (via `@expo-google-fonts/noto-sans-myanmar`)

## Features

- Search hymns by number and title
- Song detail page with hymn paragraphs
- Dynamic hymn references from JSON keys (e.g. `zbh`, `mhh`, `ss`, `am`, etc.)
- Favorite/unfavorite hymns
- Light/Dark theme toggle
- About page with source, credits, and contact

## Project Structure

- `assets/hymns.json` - hymn source data
- `src/db/database.ts` - SQLite schema, seed, and queries
- `src/screens/` - app screens (list, detail, about)
- `src/context/DatabaseContext.tsx` - database initialization
- `scripts/bump-version.js` - auto bump DB seed version when JSON changes

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start the app

```bash
npx expo start
```

Then run on device/emulator from Expo CLI options.

## Hymn Data Workflow (JSON + SQLite)

When you update hymn data, do this:

### 1) Edit JSON

Update `assets/hymns.json`.

Notes:

- JSON must be valid
- Use `null` for empty values (not blank)
- Reference keys are dynamic and can be any key name

Example:

```json
{
  "songNumber": "၂၀၀",
  "titleMyanmar": "Example",
  "titleEnglish": "Example",
  "zbh": 341,
  "mhh": 260,
  "ss": 508,
  "paragraphs": ["..."]
}
```

### 2) Bump data version (auto)

Run:

```bash
node scripts/bump-version.js
```

What it does:

- Detects `assets/hymns.json` content changes
- Increments `BUNDLED_DATA_VERSION` in `src/db/database.ts`
- Saves hash in `.last_json_hash` to avoid unnecessary bumps

### 3) Restart app

Restart the app so DB re-seeding runs with the new data version.

## Reuse and Customize

You are free to use this project as a base for your own app.

Feel free to:

- copy the structure and adapt it for your project
- change UI, navigation, theme, and features
- replace or extend hymn/data format in `assets/hymns.json`
- modify SQLite schema and queries to fit your requirements
- use this code for personal, ministry, educational.

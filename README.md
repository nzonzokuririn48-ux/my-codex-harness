# Shogi App

A minimal local shogi app built with React, TypeScript, and Vite.

## Features

- 9x9 shogi board with local two-player play
- Standard movement, captures, promotion, hands, and drops
- Check detection, self-check prevention, and basic checkmate detection
- Move history, move export, and single-step undo
- Local save/restore flow with continue or new game choice
- Mobile-friendly UI and installable PWA support

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

This is the best way to verify the production app, including service worker and manifest behavior.

## PWA

The app includes a web app manifest, service worker, and installable app metadata for mobile and desktop browsers that support PWA installation.

## Current Limitations

- No AI opponent or network multiplayer
- No formal KIF or CSA notation export yet
- No repetition, impasse, or draw rules
- No advanced shogi end-state handling beyond the current check/checkmate and king-capture flow

## Tech Stack

- React
- TypeScript
- Vite
- Vitest

# ⚗️ Alchemist's Haven
> **A Gamified Potion Brewing RPG & Productivity Web Application**  
> *Transform your real-world tasks and focus sessions into rare alchemical reagents, brew mythical potions in your retro 2D pixel brewery, and fulfill customer quests for gold and prestige.*

## 🌟 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Game Engine & Brewery Realm](#-game-engine--brewery-realm)
- [System Architecture & Data Schema](#-system-architecture--data-schema)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Security & Token Versioning](#-security--token-versioning)
- [License](#-license)

  ## 📖 Overview
**Alchemist's Haven** bridges the gap between daily productivity and retro RPG gaming. Real-life daily habits, todo quests, and deep-focus Pomodoro sessions directly fuel your alchemist apprentice's journey in a Pokemon Red-style top-down pixel RPG canvas world.
```
Real-World Tasks & Focus ──▶ Verification Queue ──▶ Reagents Dispatched to Mailbox
                                                                  │
                                                                  ▼
Prestige Shop & Badges ◀── Gold & Rare Herbs ◀── Fulfill Quests ◀── Cauldron Brewing
```
---
## ✨ Key Features
### 📋 1. Task Management & Streak Engine
- **Daily Rituals Pool**: Pick and configure daily tasks from an expandable pool (Meditation, Exercise, Reading, Hydration, Deep Work) with custom quotas.
- **Todo Quests & Itinerary**: Add ad-hoc tasks for the day/week with fixed anti-cheat XP reward scaling. Every completed todo task is automatically chronicled in your **Grand Alchemical Itinerary**.
- **Daily Streak Multiplier**: Maintaining daily streaks amplifies your earned XP by up to **3.0x** (`1.0 + (streak * 0.1)x`).
### 🛡️ 2. Asynchronous Proof Verification Queue
- Submitting task completion proofs (with reflection notes and image uploads) dispatches tasks to an asynchronous background queue worker.
- Evaluates submissions, updates streaks, checks level progression, unlocks achievement badges, and delivers reagents directly to the in-game Mailbox.
### 🎮 3. Pokemon Red-Style 2D Pixel RPG Engine
- **60 FPS HTML5 Canvas Engine**: Top-down 2D grid world featuring wooden plank flooring, bubbling cauldron hearth, customer counter, bookshelf grimoires, and an outdoor lush herb garden.
- **Retro Visuals & Audio**: 4-directional animated Alchemist character sprite (WASD / Arrow keys + click support), CRT scanline shader, and 8-bit sound effects synthesized via the Web Audio API.

## 💻 Tech Stack
### Frontend
- **Framework**: React 18 (Vite + TypeScript)
- **Styling**: Tailwind CSS, Glassmorphism design tokens, Google Fonts (*Cinzel*, *Press Start 2P*, *Inter*)
- **Game Engine**: Custom HTML5 2D Canvas Tilemap & Sprite Engine (60 FPS)
- **Audio**: Web Audio API 8-bit Sound Synthesizer (Zero asset loading dependencies)
- **Icons & Effects**: Lucide React, Canvas Confetti
### Backend
- **Runtime**: Node.js & Express (TypeScript)
- **Database & ORM**: Prisma ORM with SQLite (compatible with PostgreSQL)
- **Authentication**: JWT with **Token Versioning** & bcryptjs
- **File Uploads**: Multer (Avatars and task proofs)
- **Email Dispatch**: Nodemailer (Google App Password / SMTP with console fallback)

## 📁 Project Directory Structure
```
alchemist-haven/
├── client/                      # Frontend React + Canvas Application
│   ├── src/
│   │   ├── api/                 # Axios client with JWT interceptor
│   │   ├── components/          # Top navigation bar with stats & audio toggle
│   │   ├── context/             # AuthContext (user, gameData, session sync)
│   │   ├── game/                # 2D Retro Canvas Game Engine (RetroCanvasGame.tsx)
│   │   ├── pages/               # Auth, Dashboard, Profile & Shop, Itinerary
│   │   ├── utils/               # 8-bit Web Audio Synthesizer (audio.ts)
│   │   ├── App.tsx              # Root tab router & auth guard
│   │   ├── index.css            # Custom theme styles & scanlines
│   │   └── main.tsx             # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                      # Backend Node.js & Express API
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma relational schema
│   │   └── dev.db               # SQLite database
│   ├── src/
│   │   ├── controllers/         # Auth, Task, and Game controllers
│   │   ├── middleware/          # JWT auth validation & Multer upload
│   │   ├── routes/              # Express API route declarations
│   │   ├── services/            # Queue worker & Nodemailer service
│   │   ├── prisma/              # Singleton client & database seed script
│   │   ├── test-e2e.ts          # 20-step automated E2E integration test suite
│   │   └── index.ts             # Express server entry point
│   ├── uploads/                 # Storage for user avatars & task proofs
│   ├── tsconfig.json
│   └── package.json
│
├── requrements.md               # Original project requirements
└── README.md                    # Project documentation

## 🔒 Security & Token Versioning
To ensure robust session management and instant revocation of compromised credentials:
1. Every user record contains a `tokenVersion` integer in the database.
2. The user's `tokenVersion` is cryptographically signed inside the JWT payload upon login.
3. Every authenticated request checks that the JWT's `tokenVersion` matches the database.
4. When a password is reset or a session is revoked, `tokenVersion` is incremented, **instantly invalidating all previous tokens across all devices**.
---
## 📜 License
Distributed under the **MIT License**. Feel free to customize and expand upon this codebase for your own gamified productivity apps!



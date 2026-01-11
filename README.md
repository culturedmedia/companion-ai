# CompanionAI 🦊

A voice-first personal assistant app with an adorable AI companion. Built with React Native + Expo.

![CompanionAI Banner](./assets/banner.png)

## Features

### 🎤 Voice-First Experience
- Add tasks by speaking naturally
- Ask questions about your schedule
- Your companion understands context and responds with personality

### 🐾 Choose Your Companion
8 adorable animals with unique personalities:
- 🦊 Fox (Clever)
- 🦉 Owl (Wise)
- 🐱 Cat (Independent)
- 🐰 Bunny (Gentle)
- 🐉 Dragon (Powerful)
- 🦎 Axolotl (Chill)
- 🐼 Red Panda (Playful)
- 🐧 Penguin (Loyal)

### ✅ Smart Task Management
- Auto-categorization (Work, Personal, Health, Finance, Errands, Social)
- Priorities and due dates
- Recurring tasks
- Calendar view

### 🎮 Gamification
- Earn coins and XP
- Unlock achievements
- Build daily streaks
- Customize your companion

## Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Backend**: Supabase (Auth, Database, Storage)
- **Voice**: OpenAI Whisper API
- **Navigation**: React Navigation
- **Styling**: StyleSheet + Custom Theme

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for physical device testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/companion-ai.git
cd companion-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Add your credentials to `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

5. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Enable Email auth in Authentication settings

6. Start the development server:
```bash
npx expo start
```

### Running on Device

**iOS (Physical Device)**:
1. Install Expo Go from App Store
2. Scan QR code from terminal
3. Or enter URL manually: `exp://YOUR_IP:8081`

**Android (Physical Device)**:
1. Install Expo Go from Play Store
2. Scan QR code from terminal

**iOS Simulator**:
```bash
npx expo start --ios
```

**Android Emulator**:
```bash
npx expo start --android
```

## Project Structure

```
companion-ai/
├── assets/                 # Images, fonts, sounds
├── src/
│   ├── components/
│   │   ├── companion/     # Companion-related components
│   │   ├── tasks/         # Task-related components
│   │   ├── ui/            # Reusable UI components
│   │   └── voice/         # Voice input components
│   ├── lib/
│   │   └── supabase.ts    # Supabase client
│   ├── navigation/        # React Navigation setup
│   ├── screens/           # App screens
│   ├── services/          # Business logic services
│   ├── stores/            # Zustand stores
│   ├── theme/             # Colors, typography, spacing
│   └── types/             # TypeScript types
├── supabase/
│   └── schema.sql         # Database schema
├── .github/
│   └── workflows/         # CI/CD pipelines
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
└── package.json
```

## Available Scripts

```bash
# Start development server
npm start

# Start with cache clear
npm start -- --clear

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# TypeScript check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform all
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `EXPO_PUBLIC_OPENAI_API_KEY` | Your OpenAI API key for Whisper |

## Database Schema

See `supabase/schema.sql` for the complete database schema including:
- Profiles
- Companions
- Tasks & Subtasks
- Wallets & Transactions
- Achievements
- Streaks
- Inventory & Shop Items
- Purchases & Subscriptions

## Deployment

### Development Build
```bash
eas build --profile development --platform all
```

### Preview Build (Internal Testing)
```bash
eas build --profile preview --platform all
```

### Production Build
```bash
eas build --profile production --platform all
```

### Submit to App Stores
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@companionai.app
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/companion-ai/issues)
- 📖 Docs: [Documentation](https://docs.companionai.app)

## Acknowledgments

- [Expo](https://expo.dev) for the amazing development platform
- [Supabase](https://supabase.com) for the backend infrastructure
- [OpenAI](https://openai.com) for the Whisper API
- All our beta testers and early adopters! 💜

---

Made with ❤️ by the CompanionAI Team

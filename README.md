# CompanionAI 🦊

A voice-first personal assistant app with whimsical animal companions. Built with React Native + Expo.

## Features

### 🎤 Voice-First Interaction
- Add tasks by speaking naturally: "Add task to call mom tomorrow"
- Query your tasks: "What do I need to do today?"
- Complete tasks: "Mark grocery shopping as done"
- Get focus suggestions: "What should I focus on?"

### 🐾 Choose Your Companion
Pick from 8 unique whimsical animals, each with their own personality:
- 🦊 **Fox** - Clever & Resourceful
- 🦉 **Owl** - Wise & Observant
- 🐱 **Cat** - Independent & Cozy
- 🐰 **Bunny** - Gentle & Encouraging
- 🐉 **Dragon** - Powerful & Protective
- 🦎 **Axolotl** - Chill & Adaptable
- 🐼 **Red Panda** - Playful & Curious
- 🐧 **Penguin** - Loyal & Determined

### 📋 Smart Task Management
- Auto-categorization based on keywords
- Priority levels (High, Medium, Low)
- Due dates and times
- Recurring tasks
- Calendar view

### 🎮 Gamification
- Earn coins for completing tasks
- Level up your companion
- Shop for cosmetics and boosts
- Unlock achievements
- Maintain streaks

### 💬 Proactive Companion
Your companion asks questions and provides encouragement:
- Morning check-ins
- Focus suggestions
- Task completion celebrations
- Personalized messages based on personality

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
```bash
cd companion-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Copy your project URL and anon key

4. Configure environment:
Create a `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npx expo start
```

## Project Structure

```
companion-ai/
├── App.tsx                 # Main app entry
├── src/
│   ├── components/
│   │   ├── companion/      # Companion avatar & chat
│   │   ├── tasks/          # Task cards & modals
│   │   ├── ui/             # Reusable UI components
│   │   └── voice/          # Voice input button
│   ├── lib/
│   │   └── supabase.ts     # Supabase client
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── screens/
│   │   ├── AuthScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── ShopScreen.tsx
│   │   └── TasksScreen.tsx
│   ├── services/
│   │   └── voiceService.ts # Voice intent parsing
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── companionStore.ts
│   │   ├── taskStore.ts
│   │   └── walletStore.ts
│   ├── theme/
│   │   └── index.ts        # Colors, spacing, typography
│   └── types/
│       └── index.ts        # TypeScript types
└── supabase/
    └── schema.sql          # Database schema
```

## Voice Commands

### Adding Tasks
- "Add task to [task description]"
- "Remind me to [task description]"
- "I need to [task description] by [date/time]"

### Querying Tasks
- "What are my tasks for today?"
- "Show me my work tasks"
- "What didn't I finish last week?"

### Completing Tasks
- "Complete [task name]"
- "Mark [task name] as done"
- "I finished [task name]"

### Focus & Planning
- "What should I focus on today?"
- "Help me prioritize"
- "What's most important?"

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: StyleSheet + expo-linear-gradient
- **Voice**: expo-av (recording) + external STT service

## Integrating Speech-to-Text

The app records audio using `expo-av`. To enable actual voice recognition, integrate with one of these services:

### Option 1: OpenAI Whisper API
```typescript
const transcribe = async (audioUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  });
  formData.append('model', 'whisper-1');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });
  
  const { text } = await response.json();
  return text;
};
```

### Option 2: Google Cloud Speech-to-Text
### Option 3: AWS Transcribe
### Option 4: Azure Speech Services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ for productivity and whimsy

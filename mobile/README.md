# ReelMotion Mobile

Expo app for iOS and Android. Wraps the ReelMotion web app with native auth via Clerk.

## Setup

1. `cd mobile`
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Clerk publishable key
4. `npx expo prebuild` — generates the native iOS/Android folders
5. Open `ios/ReelMotion.xcworkspace` in Xcode, or `android/` in Android Studio

## Running

```bash
npm run ios      # Xcode simulator
npm run android  # Android emulator
```

## Key fix: Google OAuth

Google blocks OAuth inside WebViews. This app fixes it two ways:
- Native sign-in screen uses `@clerk/clerk-expo` + `expo-web-browser`, which opens Google
  in Chrome Custom Tabs (Android) or SFSafariViewController (iOS) — both are Google-approved.
- The main WebView also sets a Chrome user-agent as a fallback safety net.

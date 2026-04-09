# After Hours

React Native / Expo prototype for your party game app.

## What this is

This project is an Expo app, not a XAMPP app.

It uses:

- React Native
- Expo
- Node.js / npm

It does not use:

- XAMPP
- Apache
- PHP
- MySQL

## Main files

- `App.js`
  The main app UI and game logic.

- `package.json`
  App dependencies and run scripts.

- `app.json`
  Expo app configuration.

- `assets/pointing-finger.png`
  Your real finger pointer image used in the player chooser.

- `index.html`, `styles.css`, `script.js`
  Older browser prototype files kept only as reference.

## Features already built

- Home screen
- Step-by-step Play flow
- Category selection
- Player setup
- Rotation mode
- Random Select mode
- Suspenseful finger spinner that rotates several times before choosing
- Outcome wheel
- Custom pack creator
- Browse packs screen

## Before you run it later

Make sure these are installed:

- Node.js
- npm

To check:

```powershell
node -v
npm -v
```

If those commands fail, reinstall Node.js and reopen your terminal.

## How to run the app

Open a terminal inside:

```powershell
C:\Users\frant\Documents\Playground\APP Idea
```

Then run:

```powershell
npm install
npm start
```

That starts the Expo dev server.

## Ways to open the app

### Option 1: Phone with Expo Go

1. Install Expo Go on your phone.
2. Run `npm start`.
3. Scan the QR code shown by Expo.

### Option 2: Browser

Run:

```powershell
npx expo start --web
```

If Expo gives you a localhost URL, open it in your browser.

Example:

```text
http://localhost:8083
```

### Option 3: Android emulator

Run:

```powershell
npm run android
```

You need Android Studio / emulator set up first.

### Option 4: iPhone simulator

Run:

```powershell
npm run ios
```

This usually requires macOS.

## Important note about this computer

On this machine, `node` and `npm` were installed but not available directly in the shell PATH at first.

The working Node path was:

```text
C:\Program Files\nodejs\node.exe
```

The working npm path was:

```text
C:\Program Files\nodejs\npm.cmd
```

If normal commands do not work, you can use:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\expo\bin\cli' start
```

## If a port is already busy

Expo may tell you a port is already in use.

You can start it on another port like this:

```powershell
npx expo start --web --port 8083
```

or

```powershell
& 'C:\Program Files\nodejs\node.exe' '.\node_modules\expo\bin\cli' start --web --port 8083
```

## If Expo asks to create a folder in your user directory

Expo may need to create:

```text
C:\Users\frant\.expo
```

That is normal. It stores Expo user/dev settings.

## Good next upgrades

- Add local storage so packs persist after app restarts
- Improve the wheel visuals
- Add sounds and haptics
- Add a real backend for public packs
- Add moderation/reporting for community content

## Quick restart checklist

1. Open terminal in `C:\Users\frant\Documents\Playground\APP Idea`
2. Run `npm install` if dependencies are missing
3. Run `npm start`
4. Use Expo Go, browser, or emulator to open it

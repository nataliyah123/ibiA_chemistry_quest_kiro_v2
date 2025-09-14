# ChemQuest Video Generator

An AI agent that automatically generates tutorial videos of ChemQuest gameplay by controlling a browser and recording the screen.

## 🎉 Important Discovery

**ChemQuest is Already Fully Implemented!** 

The ChemQuest application is already built with extensive UI components including:
- ✅ Login/Authentication system (`client/src/components/auth/`)
- ✅ Character progression system (`CharacterProfile.tsx`, `LevelUpModal.tsx`, `XPAnimation.tsx`)
- ✅ 20+ Game components (`client/src/components/games/`)
- ✅ 6 Realm systems (`client/src/components/realms/`)
- ✅ Analytics dashboard (`client/src/components/analytics/`)
- ✅ Educator dashboard (`client/src/components/educatorDashboard/`)
- ✅ Content management system (`client/src/components/contentManagement/`)

## 🔧 Fixed Technical Issues

### Issue 1: `page.startScreencast is not a function`
**Problem:** The original code tried to use `page.startScreencast()` which doesn't exist in Puppeteer.

**Solution:** Created multiple approaches:
1. **Fixed CDP Version** (`demo-video-generator.js`) - Uses Chrome DevTools Protocol correctly
2. **Simple Screenshot Version** (`simple-demo-generator.js`) - Uses standard Puppeteer screenshots
3. **Live Demo Version** (`chemquest-live-demo.js`) - Works with the actual ChemQuest app

### Issue 2: Port Mismatch
**Problem:** Video generator was targeting `localhost:5173` but Docker runs on `localhost:3000`.

**Solution:** Updated all scripts to use the correct Docker port (3000) and added multiple script options.

## 🚀 Quick Start

### Prerequisites
1. Make sure ChemQuest is running (see setup options below)
2. Install dependencies: `npm install`

### Generate Video Options

**Option 1: Narrated Demo with Voice & Captions (NEW!)**
```bash
npm run demo:narrated
```
Creates a 2-minute demo with professional voice narration and captions.

**Option 2: Live Demo with Real ChemQuest (Recommended)**
```bash
npm run demo:live
```
Records the actual ChemQuest application with all implemented features for exactly 2 minutes.

**Option 3: Simple Screenshot Demo**
```bash
npm run demo:simple
```
Uses basic screenshot recording - more reliable but lower quality.

**Option 4: Advanced CDP Recording**
```bash
npm run demo
```
Uses Chrome DevTools Protocol for high-quality recording.

**Option 5: Original Generator (if ChemQuest is running)**
```bash
npm run generate:docker
```

## 🔧 Setup ChemQuest Application

### Docker Development (Port 3000) - Recommended
```bash
# From project root
docker-compose -f docker-compose.dev.yml up

# Generate video
cd scripts/video-generator
npm run demo:live
```

### Local Vite Development (Port 5173)
```bash
# Start ChemQuest locally
cd client
npm run dev

# Generate video (update port in script if needed)
cd ../scripts/video-generator
npm run demo:live
```

## 📁 Output

Videos are saved to: `../../videos/final/`

**Narrated Demo Output:**
- `chemquest-narrated-demo.mp4` - Professional demo with voice and captions
- **Duration:** Exactly 2 minutes
- **Resolution:** 1920x1080
- **Format:** MP4 (web-optimized)
- **Frame Rate:** 30fps
- **Features:** Voice narration, embedded captions, synchronized gameplay

**Live Demo Output:**
- `chemquest-live-demo.mp4` - Records actual ChemQuest interface
- **Duration:** Exactly 2 minutes
- Same specs as above

**Simple Demo Output:**
- `chemquest-demo-tutorial.mp4` - Screenshot-based recording
- Same specs as above

## 🎮 What the Video Generator Captures

### With Narrated Demo (`demo:narrated`):
1. **AI Agent Gameplay** - Watch AI solve equations and play games
2. **Professional Voice Narration** - Automated text-to-speech
3. **Embedded Captions** - Synchronized subtitles
4. **Realistic Interactions** - AI cursor, typing, clicking
5. **Educational Commentary** - Explains features as they're demonstrated
6. **Complete 2-minute Experience** - Perfect for presentations

### With Live ChemQuest App (`demo:live`):
1. **Real Login System** - Actual authentication forms
2. **Character Progression** - Live XP, levels, achievements
3. **Game Components** - All 20+ implemented games
4. **Realm Navigation** - 6 different learning realms
5. **Analytics Dashboard** - Real performance data
6. **Interactive Elements** - Buttons, forms, animations

### With Demo Mode (`demo:simple`):
1. **Simulated Interface** - Creates demo HTML page
2. **Interaction Simulation** - Mimics user actions
3. **Fallback Option** - Works when ChemQuest isn't running

## 🐛 Troubleshooting

### "page.startScreencast is not a function"
✅ **FIXED** - Use the new demo scripts instead:
- `npm run demo:live` (recommended)
- `npm run demo:simple` (fallback)

### "Failed to load ChemQuest application"
- Make sure ChemQuest is running: `docker-compose -f docker-compose.dev.yml up`
- Check if accessible in browser: http://localhost:3000
- Use `npm run test:docker` to verify connectivity

### "Navigation failed"
- Verify correct port (3000 for Docker, 5173 for Vite)
- Check Docker containers: `docker ps`
- Try the simple demo: `npm run demo:simple`

### "FFmpeg error"
- FFmpeg is automatically installed with @ffmpeg-installer/ffmpeg
- On some systems, restart terminal after installation

## 🎯 Available Scripts

| Script | Purpose | ChemQuest Required | Features |
|--------|---------|-------------------|----------|
| `npm run demo:narrated` | Professional demo with voice | ❌ No | 🎙️ Voice, 📝 Captions, ⏱️ 2min |
| `npm run demo:live` | Record real ChemQuest app | ✅ Yes | 🎮 Real gameplay, ⏱️ 2min |
| `npm run demo:simple` | Screenshot-based demo | ❌ No | 📸 Screenshots, 🔄 Reliable |
| `npm run demo` | CDP-based recording | ❌ No | 🎥 High quality |
| `npm run generate:docker` | Original generator | ✅ Yes | 🎮 Full gameplay |
| `npm run test:docker` | Test connection | ✅ Yes | 🔍 Diagnostics |

## 🔍 ChemQuest Components Available for Recording

### Authentication
- `LoginForm.tsx` - User login interface
- `RegisterForm.tsx` - New user registration
- `ForgotPasswordForm.tsx` - Password recovery

### Character System
- `CharacterProfile.tsx` - Player profile display
- `CharacterProgressionDemo.tsx` - Level progression
- `LevelUpModal.tsx` - Level up celebrations
- `XPAnimation.tsx` - Experience point animations

### Games (20+ Available)
- `EquationDuels.tsx` - Chemical equation balancing
- `FlashcardMatch.tsx` - Memory matching games
- `MoleDungeonCrawler.tsx` - Adventure-style chemistry
- `AlchemistsGrimoire.tsx` - Recipe discovery
- And 16+ more games!

### Realms (6 Learning Areas)
- `MathmageTrialsRealm.tsx` - Mathematical chemistry
- `ForestOfIsomersRealm.tsx` - Molecular structures
- `VirtualApprenticeRealm.tsx` - Guided learning
- And 3+ more realms!

## 📋 Requirements

- Node.js 16+
- Chrome/Chromium (installed automatically with Puppeteer)
- ChemQuest application running (for live demos)
- ~2GB free disk space for video processing

## 🎯 Port Reference

| Setup | Port | Test Command | Demo Command |
|-------|------|--------------|--------------|
| Docker Dev | 3000 | `npm run test:docker` | `npm run demo:live` |
| Vite Local | 5173 | `npm run test:vite` | Update script port |
| Docker Prod | 80 | Manual test | Update script port |

## 📝 Logs

Detailed logs are saved to `video-generation.log` for debugging purposes.

## 🚀 Next Steps

### For Professional Narrated Demo (Recommended):
1. **Test TTS**: `npm run test:tts` (verify voice generation works)
2. **Generate Demo**: `npm run demo:narrated`
3. **View Result**: Check `../../videos/final/chemquest-narrated-demo.mp4`

### For Live ChemQuest Demo:
1. **Start ChemQuest**: `docker-compose -f docker-compose.dev.yml up`
2. **Test Connection**: `npm run test:docker`
3. **Generate Video**: `npm run demo:live`
4. **View Result**: Check `../../videos/final/chemquest-live-demo.mp4`

## 🎬 What You'll Get

The enhanced video generator now creates professional-quality demos featuring:
- 🤖 **AI Agent Gameplay** - Watch AI solve chemistry problems
- 🎙️ **Voice Narration** - Professional commentary (if TTS works)
- 📝 **Captions** - Always included for accessibility
- ⚔️ **Equation Balancing** - AI demonstrates step-by-step solving
- 🃏 **Flashcard Matching** - AI plays memory games
- 📊 **Real-time Analytics** - Progress tracking demonstration
- ⏱️ **Exactly 2 Minutes** - Perfect for presentations and demos
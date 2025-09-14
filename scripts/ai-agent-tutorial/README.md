# ChemQuest AI Tutorial Video Generator

Automatically generates a professional 2-minute tutorial video showcasing ChemQuest: Alchemist Academy gameplay using an AI agent.

## 🎯 What It Creates

**Video Output Location:**
- **Primary Output:** `./videos/output/chemquest-gameplay-tutorial.mp4`
- **Working Files:** `./videos/temp/` (screenshots, audio clips, intermediate files)
- **Final Delivery:** `./videos/final/chemquest-tutorial-2min.mp4` (compressed for web)

## 🎬 2-Minute Video Structure

| Time | Segment | Content |
|------|---------|---------|
| 0:00-0:15 | Intro | ChemQuest logo + "Welcome to ChemQuest: Alchemist Academy" |
| 0:15-0:25 | Character Creation | Quick character setup and dashboard overview |
| 0:25-0:50 | Mathmage Trials | Equation Duels gameplay demonstration |
| 0:50-1:15 | Memory Labyrinth | Flashcard Match game |
| 1:15-1:40 | Virtual Apprentice | Step-by-Step Simulator |
| 1:40-1:55 | Progress & Rewards | XP gain, level up, badge unlock |
| 1:55-2:00 | Outro | "Start your chemistry adventure today!" |

## 🛠️ Technical Approach

### Tools Stack
- **Puppeteer:** Browser automation and game interaction
- **FFmpeg:** Screen recording and video processing
- **Node.js:** Orchestration script
- **Text-to-Speech:** Automated narration

### AI Agent Logic
```javascript
// Simplified workflow
1. Launch ChemQuest in headless Chrome
2. Auto-register demo user
3. Navigate through realms with realistic delays
4. Solve challenges using pre-programmed solutions
5. Capture smooth mouse movements and clicks
6. Record at 1080p/30fps for 2 minutes exactly
```

### Recording Strategy
- **Screen Resolution:** 1920x1080 (standard HD)
- **Frame Rate:** 30fps (smooth but manageable file size)
- **Audio:** Generated narration explaining each game mechanic
- **Transitions:** Quick fade effects between realm switches

## 📁 File Management

```
./videos/
├── temp/
│   ├── screenshots/
│   ├── audio-clips/
│   └── raw-recording.mp4
├── output/
│   └── chemquest-gameplay-tutorial.mp4
└── final/
    └── chemquest-tutorial-2min.mp4 (compressed)
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd scripts/ai-agent-tutorial
npm install
```

### 2. Ensure ChemQuest is Ready
```bash
# In project root
cd client && npm install
cd ../server && npm install
```

### 3. Generate Tutorial Video
```bash
node generate-tutorial.js
```

### 4. Find Your Video
The final video will be saved to:
```
./videos/final/chemquest-tutorial-2min.mp4
```

## 📋 System Requirements

- **Node.js:** 18+
- **FFmpeg:** Automatically installed via npm
- **Chrome/Chromium:** For Puppeteer automation
- **RAM:** 4GB+ recommended
- **Disk Space:** 2GB+ free space
- **Platform:** Windows, macOS, or Linux

## 🎮 Automation Sequence

1. **Setup Phase:** Start servers, create demo account
2. **Recording Phase:** Puppeteer navigates and plays games
3. **Processing Phase:** FFmpeg adds narration, transitions, compression
4. **Cleanup Phase:** Remove temp files, optimize final video

## 🎯 Key Features Showcased

- Equation balancing with drag-and-drop
- Memory games with card flipping
- Lab procedure sequencing
- Character progression (XP, levels, badges)
- Smooth UI interactions and animations

## 📊 Output Specifications

- **Duration:** Exactly 2:00 minutes
- **Resolution:** 1920x1080 (Full HD)
- **Format:** MP4 (H.264/AAC)
- **File Size:** Under 50MB (web-optimized)
- **Frame Rate:** 30 FPS
- **Audio:** Narrated tutorial with background gameplay sounds

## 🔧 Configuration Options

Edit `src/index.js` to customize:

```javascript
const options = {
  duration: 120,           // Video length in seconds
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,           // FPS
  targetSize: 50 * 1024 * 1024  // Max file size (50MB)
}
```

## 🎙️ Narration Script

The system generates professional narration for each segment:

- **Intro:** Platform introduction and value proposition
- **Gameplay:** Explains mechanics as they're demonstrated
- **Features:** Highlights key educational benefits
- **Outro:** Clear call-to-action

## 🌐 Web Optimization

The final video is optimized for:
- **Fast Loading:** Progressive download enabled
- **Compatibility:** Works across all modern browsers
- **Mobile-Friendly:** Responsive video player support
- **SEO-Ready:** Proper metadata and thumbnails

## 🚨 Troubleshooting

### Common Issues

**Servers won't start:**
```bash
# Check if ports are available
netstat -an | grep :3001
netstat -an | grep :5173

# Kill existing processes if needed
pkill -f "npm run dev"
```

**FFmpeg errors:**
- FFmpeg is automatically installed via npm
- On some systems, you may need to install system codecs
- Try running with administrator privileges

**Recording fails:**
- Ensure sufficient disk space (>2GB)
- Close other applications to free resources
- Check that ChemQuest UI elements have proper test IDs

### Debug Mode

Run with debug logging:
```bash
DEBUG=* node generate-tutorial.js
```

## 📈 Performance Tips

- **Close unnecessary applications** during recording
- **Use SSD storage** for better I/O performance
- **Ensure stable internet** for dependency downloads
- **Run on dedicated machine** for best results

## 🎨 Customization

### Modify Gameplay Sequence
Edit `src/agent/GameplayAgent.js`:
```javascript
createGameplayTimeline() {
  return [
    { segment: 'custom_demo', startTime: 30, duration: 20 }
    // Add your custom segments
  ]
}
```

### Change Narration
Edit `src/recorder/NarrationGenerator.js`:
```javascript
createNarrationScript() {
  return {
    intro: {
      text: "Your custom narration here...",
      startTime: 0,
      duration: 15
    }
  }
}
```

### Adjust Video Quality
Edit `src/processor/VideoProcessor.js`:
```javascript
// Higher quality (larger file)
.videoBitrate('3000k')
.audioBitrate('192k')

// Lower quality (smaller file)
.videoBitrate('1000k')
.audioBitrate('96k')
```

## 📝 License

MIT License - Feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the logs in `./videos/logs/`
- Review the troubleshooting section above
- Open an issue on the project repository

---

**The final video will be exactly 2 minutes, web-optimized (under 50MB), and saved in the `./videos/final/` directory for easy access and sharing.**
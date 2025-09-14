#!/usr/bin/env node

import puppeteer from 'puppeteer'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// Narration script with timestamps
const narrationScript = [
  { time: 0, text: "Welcome to ChemQuest Alchemist Academy! Watch our AI agent demonstrate chemistry learning." },
  { time: 15, text: "The AI agent logs into the system and accesses the character profile." },
  { time: 30, text: "Here we see character progression with experience points and level advancement." },
  { time: 45, text: "ChemQuest features multiple learning realms for different chemistry concepts." },
  { time: 60, text: "The AI agent demonstrates equation balancing by solving chemical equations." },
  { time: 75, text: "Players receive immediate feedback and experience points for correct answers." },
  { time: 90, text: "The flashcard matching game helps students learn chemical formulas and names." },
  { time: 105, text: "Analytics dashboard tracks learning progress and identifies improvement areas." },
  { time: 115, text: "ChemQuest combines gamification with proven educational techniques!" }
]

async function generateSimpleNarratedDemo() {
  console.log('🎬 Starting Simple ChemQuest Narrated Demo')
  console.log('🎙️ This version focuses on working voice and captions')
  
  const outputDir = path.join(__dirname, '../../videos')
  const tempDir = path.join(outputDir, 'temp')
  const finalDir = path.join(outputDir, 'final')
  
  // Create directories
  await fs.ensureDir(outputDir)
  await fs.ensureDir(tempDir)
  await fs.ensureDir(finalDir)
  
  console.log('📁 Directories created')
  
  let browser
  try {
    // Launch browser
    console.log('🚀 Launching browser...')
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    console.log('✅ Browser launched')
    
    // Create simple demo page
    await createSimpleDemoPage(page)
    
    // Generate captions file
    await generateCaptionsFile(tempDir)
    
    // Generate audio first
    await generateSimpleAudio(tempDir)
    
    // Start recording
    console.log('🔴 Starting recording...')
    let frameCount = 0
    const screenshotInterval = 500
    
    const takeScreenshot = async () => {
      try {
        const framePath = path.join(tempDir, `frame-${String(frameCount).padStart(6, '0')}.png`)
        await page.screenshot({ 
          path: framePath,
          fullPage: false,
          type: 'png'
        })
        frameCount++
      } catch (error) {
        console.log('⚠️ Screenshot error:', error.message)
      }
    }
    
    const screenshotTimer = setInterval(takeScreenshot, screenshotInterval)
    
    // Perform simple demo
    await performSimpleDemo(page)
    
    // Stop recording
    console.log('⏹️ Stopping recording...')
    clearInterval(screenshotTimer)
    await takeScreenshot()
    
    console.log(`✅ Recording completed - ${frameCount} frames captured`)
    
    // Process video
    await processSimpleVideo(tempDir, finalDir)
    
    // Cleanup
    try {
      await fs.remove(tempDir)
      console.log('🧹 Cleanup completed')
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message)
    }
    
    console.log('\n🎉 SUCCESS!')
    console.log('📁 Simple narrated demo created!')
    console.log(`📍 Location: ${path.join(finalDir, 'chemquest-simple-narrated.mp4')}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function createSimpleDemoPage(page) {
  // Load the HTML file directly to avoid encoding issues
  const htmlPath = path.join(__dirname, 'demo-page.html')
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' })
}

async function performSimpleDemo(page) {
  console.log('🎮 Starting simple demo...')
  
  const startTime = Date.now()
  let currentNarrationIndex = 0
  
  // Schedule narration display
  const narrationTimer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000
    
    if (currentNarrationIndex < narrationScript.length) {
      const currentNarration = narrationScript[currentNarrationIndex]
      
      if (elapsed >= currentNarration.time) {
        console.log(`🎙️ [${elapsed.toFixed(1)}s] "${currentNarration.text}"`)
        
        // Add caption overlay
        page.evaluate((text) => {
          const existingCaption = document.getElementById('demo-caption')
          if (existingCaption) existingCaption.remove()
          
          const caption = document.createElement('div')
          caption.id = 'demo-caption'
          caption.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 18px;
            max-width: 80%;
            text-align: center;
            z-index: 10000;
          `
          caption.textContent = text
          document.body.appendChild(caption)
          
          setTimeout(() => {
            if (caption.parentNode) caption.parentNode.removeChild(caption)
          }, 6000)
        }, currentNarration.text)
        
        currentNarrationIndex++
      }
    }
  }, 1000)
  
  // Perform animations
  try {
    // 15s: Login
    await page.waitForTimeout(15000)
    await page.evaluate(() => {
      const status = document.getElementById('status')
      if (status) {
        status.textContent = 'Logged In ✓'
        status.style.color = '#00ff00'
      }
    })
    
    // 30s: Character progression
    await page.waitForTimeout(15000)
    await page.evaluate(() => {
      const level = document.getElementById('level')
      const xp = document.getElementById('xp')
      const xpBar = document.getElementById('xp-bar')
      
      if (level) level.textContent = '16'
      if (xp) xp.textContent = '2,850 (+400!)'
      if (xpBar) xpBar.style.width = '95%'
    })
    
    // 45s: Realms
    await page.waitForTimeout(15000)
    await page.evaluate(() => {
      const section = document.getElementById('equation-game')
      if (section) section.style.border = '3px solid gold'
    })
    
    // 60s: Equation solving
    await page.waitForTimeout(15000)
    await page.evaluate(() => {
      const equation = document.getElementById('equation')
      if (equation) {
        equation.style.background = 'rgba(0,255,0,0.2)'
        equation.style.border = '2px solid #00ff00'
      }
    })
    
    // 75s: Feedback
    await page.waitForTimeout(15000)
    await page.evaluate(() => {
      const result = document.getElementById('result')
      if (result) {
        result.style.color = '#00ff00'
        result.style.fontSize = '1.2rem'
      }
    })
    
    // 90s: Flashcards
    await page.waitForTimeout(15000)
    await page.evaluate(() => {
      const section = document.getElementById('flashcards')
      if (section) section.style.background = 'rgba(0,255,0,0.1)'
    })
    
    // 105s: Analytics
    await page.waitForTimeout(15000)
    await page.evaluate(() => {
      const accuracy = document.getElementById('accuracy')
      const speed = document.getElementById('speed')
      const achievements = document.getElementById('achievements')
      
      if (accuracy) accuracy.style.color = '#00ff00'
      if (speed) speed.style.color = '#00ff00'
      if (achievements) achievements.style.color = '#00ff00'
    })
    
    // 120s: Complete
    await page.waitForTimeout(15000)
    
  } catch (error) {
    console.log('⚠️ Demo error:', error.message)
  }
  
  clearInterval(narrationTimer)
  console.log('✅ Simple demo completed')
}

async function generateCaptionsFile(tempDir) {
  console.log('📝 Generating captions...')
  
  let srtContent = ''
  
  narrationScript.forEach((item, index) => {
    const startTime = item.time
    const endTime = index < narrationScript.length - 1 ? narrationScript[index + 1].time : 120
    
    srtContent += `${index + 1}\n`
    srtContent += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`
    srtContent += `${item.text}\n\n`
  })
  
  await fs.writeFile(path.join(tempDir, 'captions.srt'), srtContent)
  console.log('✅ Captions generated')
}

function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

async function generateSimpleAudio(tempDir) {
  console.log('🎙️ Generating simple audio...')
  
  try {
    const audioPath = path.join(tempDir, 'narration.wav')
    const fullText = narrationScript.map(item => item.text).join(' ')
    
    if (process.platform === 'win32') {
      // Windows TTS with better error handling
      const cleanText = fullText.replace(/"/g, '\\"').replace(/'/g, "\\'").substring(0, 500) // Limit text length
      const absolutePath = path.resolve(audioPath)
      
      console.log('🎤 Generating Windows TTS audio...')
      console.log(`Audio path: ${absolutePath}`)
      
      // Try multiple approaches
      try {
        // Method 1: Standard SAPI
        const psCommand = `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.SetOutputToWaveFile('${absolutePath}'); $synth.Speak('${cleanText}'); $synth.Dispose()`
        execSync(`powershell -ExecutionPolicy Bypass -Command "${psCommand}"`, { stdio: 'pipe' })
        
        if (await fs.pathExists(audioPath)) {
          console.log('✅ Windows TTS audio generated (Method 1)')
        } else {
          throw new Error('Audio file not created')
        }
        
      } catch (error) {
        console.log('⚠️ Method 1 failed, trying Method 2...')
        
        try {
          // Method 2: COM object
          const comCommand = `$voice = New-Object -ComObject SAPI.SpVoice; $file = New-Object -ComObject SAPI.SpFileStream; $file.Open('${absolutePath}', 3); $voice.AudioOutputStream = $file; $voice.Speak('${cleanText}'); $file.Close()`
          execSync(`powershell -ExecutionPolicy Bypass -Command "${comCommand}"`, { stdio: 'pipe' })
          
          if (await fs.pathExists(audioPath)) {
            console.log('✅ Windows TTS audio generated (Method 2)')
          } else {
            throw new Error('Audio file not created with COM method')
          }
          
        } catch (error2) {
          console.log('⚠️ Both TTS methods failed, creating silent audio')
          throw error2
        }
      }
      
    } else {
      // Create silent audio for other platforms
      await createSilentAudio(audioPath, 120)
      console.log('✅ Silent audio created (TTS not available)')
    }
    
  } catch (error) {
    console.log('⚠️ Audio generation failed:', error.message)
    // Create silent audio as fallback
    await createSilentAudio(path.join(tempDir, 'narration.wav'), 120)
  }
}

async function createSilentAudio(outputPath, durationSeconds) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=channel_layout=stereo:sample_rate=44100')
      .inputOptions(['-f lavfi'])
      .audioCodec('pcm_s16le')
      .duration(durationSeconds)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath)
  })
}

async function processSimpleVideo(tempDir, finalDir) {
  console.log('🎞️ Processing simple video...')
  
  const inputPattern = path.join(tempDir, 'frame-%06d.png')
  const captionsPath = path.join(tempDir, 'captions.srt')
  const audioPath = path.join(tempDir, 'narration.wav')
  const outputPath = path.join(finalDir, 'chemquest-simple-narrated.mp4')
  
  return new Promise((resolve, reject) => {
    let ffmpegCommand = ffmpeg(inputPattern)
      .inputFPS(2)
      .videoCodec('libx264')
      .size('1920x1080')
      .fps(30)
      .videoBitrate('2000k')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
        '-t 120'
      ])
    
    // Add audio if exists
    if (fs.existsSync(audioPath)) {
      console.log('🎵 Adding audio...')
      ffmpegCommand = ffmpegCommand
        .input(audioPath)
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions(['-shortest'])
    }
    
    // Add captions if exists
    if (fs.existsSync(captionsPath)) {
      console.log('📝 Adding captions...')
      ffmpegCommand = ffmpegCommand
        .input(captionsPath)
        .outputOptions([
          '-c:s mov_text',
          '-metadata:s:s:0 language=eng'
        ])
    }
    
    ffmpegCommand
      .on('start', () => console.log('🔄 Processing...'))
      .on('progress', (progress) => {
        console.log(`⏳ Progress: ${Math.round(progress.percent || 0)}%`)
      })
      .on('end', () => {
        console.log('✅ Video processing completed')
        resolve()
      })
      .on('error', (err) => {
        console.error('❌ Processing error:', err.message)
        reject(err)
      })
      .save(outputPath)
  })
}

generateSimpleNarratedDemo()
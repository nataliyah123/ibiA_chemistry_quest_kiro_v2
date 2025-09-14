#!/usr/bin/env node

import puppeteer from 'puppeteer'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { performDemoInteractions } from './demo-interactions.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

async function generateDemoVideo() {
  console.log('🎬 Starting ChemQuest Demo Video Generator')
  
  const outputDir = path.join(__dirname, '../../videos')
  const tempDir = path.join(outputDir, 'temp')
  const finalDir = path.join(outputDir, 'final')
  
  // Store frames for video creation
  let frames = []
  
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
      headless: false, // Show browser so you can see the demo
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    console.log('✅ Browser launched')
    
    // Start recording using Chrome DevTools Protocol
    console.log('🔴 Starting recording...')
    const client = await page.target().createCDPSession()
    
    client.on('Page.screencastFrame', async (frame) => {
      frames.push(frame)
      await client.send('Page.screencastFrameAck', { sessionId: frame.sessionId })
    })
    
    await client.send('Page.startScreencast', {
      format: 'png',
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1080,
      everyNthFrame: 2
    })
    
    // Navigate to ChemQuest (or create a blank page if it fails)
    console.log('🌐 Navigating to ChemQuest...')
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      })
      console.log('✅ ChemQuest loaded')
    } catch (error) {
      console.log('⚠️ ChemQuest not accessible, creating demo page...')
      await page.goto('data:text/html,<html><head><title>ChemQuest Demo</title></head><body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 2rem;"><div style="text-align: center; color: white;"><h1>🧪 ChemQuest: Alchemist Academy</h1><p style="font-size: 1.2rem;">Demo Video Recording</p></div></body></html>')
    }
    
    // Perform demo interactions
    await performDemoInteractions(page)
    
    // Stop recording
    console.log('⏹️ Stopping recording...')
    await client.send('Page.stopScreencast')
    
    console.log('✅ Recording completed')
    console.log(`📊 Captured ${frames.length} frames`)
    
    // Save frames as images
    console.log('💾 Saving frames...')
    for (let i = 0; i < frames.length; i++) {
      const frameData = frames[i].data
      const framePath = path.join(tempDir, `frame-${String(i).padStart(6, '0')}.png`)
      await fs.writeFile(framePath, frameData, 'base64')
    }
    
    // Process video with FFmpeg
    console.log('🎞️ Processing video...')
    const inputPattern = path.join(tempDir, 'frame-%06d.png')
    const outputPath = path.join(finalDir, 'chemquest-demo-tutorial.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputPattern)
        .inputFPS(2) // Match the everyNthFrame setting
        .videoCodec('libx264')
        .size('1920x1080')
        .fps(30)
        .videoBitrate('2000k')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
          '-pix_fmt yuv420p'
        ])
        .on('start', (commandLine) => {
          console.log('🔄 FFmpeg processing started...')
        })
        .on('progress', (progress) => {
          console.log(`⏳ Processing: ${Math.round(progress.percent || 0)}%`)
        })
        .on('end', () => {
          console.log('✅ Video processing completed')
          resolve()
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg error:', err.message)
          reject(err)
        })
        .save(outputPath)
    })
    
    // Cleanup temp files
    try {
      await fs.remove(tempDir)
      console.log('🧹 Cleanup completed')
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message)
    }
    
    console.log('\n🎉 SUCCESS!')
    console.log('📁 Demo video created successfully!')
    console.log(`📍 Location: ${outputPath}`)
    console.log('📊 Video specs: 1920x1080, 30fps, web-optimized')
    console.log('')
    console.log('🎯 This demo shows what the video will look like once ChemQuest is built!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

generateDemoVideo()
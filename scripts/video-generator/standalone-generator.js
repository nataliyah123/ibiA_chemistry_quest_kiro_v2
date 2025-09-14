#!/usr/bin/env node

import puppeteer from 'puppeteer'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

async function generateVideo() {
  console.log('🎬 Starting standalone video generator')
  
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
    
    // Start recording
    console.log('🔴 Starting recording...')
    await page.startScreencast({
      path: path.join(tempDir, 'raw-recording.webm'),
      format: 'webm'
    })
    
    // Navigate to ChemQuest
    console.log('🌐 Navigating to ChemQuest...')
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
    
    console.log('✅ Page loaded')
    
    // Wait and interact (simplified version)
    await page.waitForTimeout(5000) // Wait 5 seconds
    
    // Try to find and click some elements (basic interaction)
    try {
      await page.click('body') // Click somewhere on the page
      await page.waitForTimeout(2000)
    } catch (e) {
      console.log('⚠️ Basic interaction failed, continuing...')
    }
    
    // Record for 10 seconds total
    await page.waitForTimeout(5000)
    
    // Stop recording
    console.log('⏹️ Stopping recording...')
    await page.stopScreencast()
    
    console.log('✅ Recording completed')
    
    // Process video with FFmpeg
    console.log('🎞️ Processing video...')
    const inputPath = path.join(tempDir, 'raw-recording.webm')
    const outputPath = path.join(finalDir, 'chemquest-tutorial-test.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1920x1080')
        .fps(30)
        .on('start', () => {
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
    
    console.log('\n🎉 SUCCESS!')
    console.log(`📁 Video saved to: ${outputPath}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

generateVideo()
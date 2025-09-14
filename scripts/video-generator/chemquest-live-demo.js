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

async function generateChemQuestDemo() {
  console.log('🎬 Starting ChemQuest Live Demo Video Generator')
  console.log('🔗 This will record the actual ChemQuest application')
  
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
    
    // Navigate to ChemQuest
    console.log('🌐 Navigating to ChemQuest...')
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    })
    console.log('✅ ChemQuest loaded')
    
    // Start recording by taking screenshots
    console.log('🔴 Starting recording...')
    let frameCount = 0
    const screenshotInterval = 250 // Take screenshot every 250ms for smoother video
    
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
    
    // Start screenshot interval
    const screenshotTimer = setInterval(takeScreenshot, screenshotInterval)
    
    // Perform live demo interactions with the actual ChemQuest app
    await performLiveChemQuestDemo(page)
    
    // Stop recording
    console.log('⏹️ Stopping recording...')
    clearInterval(screenshotTimer)
    
    // Take one final screenshot
    await takeScreenshot()
    
    console.log(`✅ Recording completed - ${frameCount} frames captured`)
    
    // Process video with FFmpeg
    console.log('🎞️ Processing video...')
    const inputPattern = path.join(tempDir, 'frame-%06d.png')
    const outputPath = path.join(finalDir, 'chemquest-live-demo.mp4')
    
    await new Promise((resolve, reject) => {
      ffmpeg(inputPattern)
        .inputFPS(4) // 4 fps since we take screenshots every 250ms
        .videoCodec('libx264')
        .size('1920x1080')
        .fps(30) // Output at 30fps for smooth playback
        .videoBitrate('2000k')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
          '-pix_fmt yuv420p',
          '-t 120' // Exactly 2 minutes duration
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
    console.log('📁 Live ChemQuest demo video created!')
    console.log(`📍 Location: ${outputPath}`)
    console.log('📊 Video specs: 1920x1080, 30fps, web-optimized')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function performLiveChemQuestDemo(page) {
  console.log('🎮 Starting 2-minute live ChemQuest demo with gameplay...')
  
  const startTime = Date.now()
  const targetDuration = 120000 // 2 minutes in milliseconds
  
  try {
    // === PHASE 1: Introduction and Login (0-20 seconds) ===
    console.log('📝 Phase 1: Introduction and Login (0-20s)')
    await page.waitForTimeout(3000)
    
    // Try to find and interact with login system
    const loginElements = await page.$$('button, input, form, [class*="login"], [class*="auth"]')
    if (loginElements.length > 0) {
      console.log('🔐 Found login interface - demonstrating authentication...')
      
      // Look for email/username field
      const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email"]').catch(() => null)
      if (emailField) {
        await emailField.click()
        await emailField.type('demo@chemquest.com', { delay: 150 })
        await page.waitForTimeout(1000)
      }
      
      // Look for password field
      const passwordField = await page.$('input[type="password"], input[name="password"]').catch(() => null)
      if (passwordField) {
        await passwordField.click()
        await passwordField.type('demopassword', { delay: 150 })
        await page.waitForTimeout(1000)
      }
      
      // Try to submit login
      const submitButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').catch(() => null)
      if (submitButton) {
        await submitButton.click()
        await page.waitForTimeout(3000)
      }
    }
    
    await page.waitForTimeout(2000)
    
    // === PHASE 2: Character Profile and Progression (20-40 seconds) ===
    console.log('👤 Phase 2: Character Profile and Progression (20-40s)')
    
    // Look for character/profile elements
    const profileElements = await page.$$('[class*="character"], [class*="Character"], [class*="profile"], [class*="Profile"], [class*="xp"], [class*="level"]')
    if (profileElements.length > 0) {
      console.log('✨ Found character elements - showing progression system...')
      
      for (let i = 0; i < Math.min(3, profileElements.length); i++) {
        try {
          await profileElements[i].click()
          await page.waitForTimeout(2000)
          
          // Hover to show tooltips/details
          await profileElements[i].hover()
          await page.waitForTimeout(1500)
        } catch (error) {
          console.log('⚠️ Character element interaction failed:', error.message)
        }
      }
    }
    
    await page.waitForTimeout(3000)
    
    // === PHASE 3: Game Navigation and Realm Selection (40-70 seconds) ===
    console.log('🎮 Phase 3: Game Navigation and Realm Selection (40-70s)')
    
    // Look for realm/game navigation
    const realmElements = await page.$$('[class*="realm"], [class*="Realm"], [class*="game"], [class*="Game"], [class*="nav"]')
    if (realmElements.length > 0) {
      console.log('🏰 Found realm elements - navigating through game areas...')
      
      for (let i = 0; i < Math.min(4, realmElements.length); i++) {
        try {
          await realmElements[i].click()
          await page.waitForTimeout(3000)
          
          // Scroll to show content
          await page.evaluate(() => window.scrollBy(0, 200))
          await page.waitForTimeout(1500)
          
          // Look for game-specific elements to interact with
          const gameSpecificElements = await page.$$('button, [class*="start"], [class*="play"], [class*="begin"]')
          if (gameSpecificElements.length > 0) {
            await gameSpecificElements[0].click()
            await page.waitForTimeout(2000)
          }
          
        } catch (error) {
          console.log('⚠️ Realm navigation failed:', error.message)
        }
      }
    }
    
    // === PHASE 4: Actual Gameplay Simulation (70-100 seconds) ===
    console.log('⚔️ Phase 4: Actual Gameplay Simulation (70-100s)')
    
    // Look for specific game components
    const gameComponents = [
      '[class*="equation"], [class*="Equation"]', // Equation Duels
      '[class*="flashcard"], [class*="Flashcard"]', // Flashcard Match
      '[class*="molecule"], [class*="Molecule"]', // Molecular games
      '[class*="lab"], [class*="Lab"]', // Lab simulator
      'input[type="number"]', // Coefficient inputs
      '[class*="card"]', // Game cards
      '[class*="drag"]', // Drag and drop elements
    ]
    
    for (const selector of gameComponents) {
      try {
        const elements = await page.$$(selector)
        if (elements.length > 0) {
          console.log(`🎯 Found ${selector} elements - simulating gameplay...`)
          
          // Interact with multiple elements to simulate gameplay
          for (let i = 0; i < Math.min(3, elements.length); i++) {
            await elements[i].click()
            await page.waitForTimeout(1000)
            
            // If it's an input field, type some values
            const tagName = await elements[i].evaluate(el => el.tagName.toLowerCase())
            if (tagName === 'input') {
              const inputType = await elements[i].evaluate(el => el.type)
              if (inputType === 'number') {
                await elements[i].clear()
                await elements[i].type(String(Math.floor(Math.random() * 10) + 1), { delay: 200 })
              }
            }
            
            await page.waitForTimeout(1500)
          }
          
          // Look for submit/check buttons after interactions
          const submitButtons = await page.$$('button:has-text("Submit"), button:has-text("Check"), button:has-text("Solve"), [class*="submit"]')
          if (submitButtons.length > 0) {
            await submitButtons[0].click()
            await page.waitForTimeout(2000)
          }
          
          break // Move to next phase after finding interactive elements
        }
      } catch (error) {
        console.log(`⚠️ Gameplay simulation failed for ${selector}:`, error.message)
      }
    }
    
    // === PHASE 5: Dashboard and Analytics (100-120 seconds) ===
    console.log('📊 Phase 5: Dashboard and Analytics (100-120s)')
    
    // Look for dashboard/analytics elements
    const dashboardElements = await page.$$('[class*="dashboard"], [class*="Dashboard"], [class*="analytics"], [class*="Analytics"], [class*="progress"], [class*="stats"]')
    if (dashboardElements.length > 0) {
      console.log('📈 Found dashboard elements - showing progress analytics...')
      
      for (let i = 0; i < Math.min(2, dashboardElements.length); i++) {
        try {
          await dashboardElements[i].click()
          await page.waitForTimeout(2000)
          
          // Scroll through dashboard content
          await page.evaluate(() => window.scrollBy(0, 300))
          await page.waitForTimeout(1500)
          
          await page.evaluate(() => window.scrollBy(0, -150))
          await page.waitForTimeout(1500)
        } catch (error) {
          console.log('⚠️ Dashboard interaction failed:', error.message)
        }
      }
    }
    
    // Final scroll to show overall interface
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(2000)
    
    // === Ensure we reach exactly 2 minutes ===
    const elapsedTime = Date.now() - startTime
    const remainingTime = targetDuration - elapsedTime
    
    if (remainingTime > 0) {
      console.log(`⏰ Extending demo by ${Math.round(remainingTime/1000)} seconds to reach 2 minutes...`)
      
      // Fill remaining time with additional interactions
      const allInteractiveElements = await page.$$('button, input, select, [class*="clickable"], [role="button"]')
      const interactionDelay = Math.max(500, remainingTime / Math.min(10, allInteractiveElements.length))
      
      for (let i = 0; i < allInteractiveElements.length && (Date.now() - startTime) < targetDuration; i++) {
        try {
          await allInteractiveElements[i].hover()
          await page.waitForTimeout(interactionDelay / 2)
          
          if ((Date.now() - startTime) < targetDuration - 1000) {
            await allInteractiveElements[i].click()
            await page.waitForTimeout(interactionDelay / 2)
          }
        } catch (error) {
          // Continue with next element
        }
      }
      
      // Final wait to reach exactly 2 minutes
      const finalWait = targetDuration - (Date.now() - startTime)
      if (finalWait > 0) {
        await page.waitForTimeout(finalWait)
      }
    }
    
    const totalTime = (Date.now() - startTime) / 1000
    console.log(`✅ Live demo completed in ${totalTime.toFixed(1)} seconds`)
    
  } catch (error) {
    console.log('⚠️ Demo interaction error:', error.message)
    console.log('📝 Continuing with extended fallback demonstration...')
    
    // Extended fallback for 2 minutes
    const fallbackStartTime = Date.now()
    const fallbackDuration = 120000 - (Date.now() - startTime)
    
    while ((Date.now() - fallbackStartTime) < fallbackDuration) {
      await page.evaluate(() => window.scrollBy(0, 200))
      await page.waitForTimeout(2000)
      
      await page.evaluate(() => window.scrollBy(0, -100))
      await page.waitForTimeout(2000)
      
      // Try clicking random elements
      const randomElements = await page.$$('*')
      if (randomElements.length > 10) {
        const randomIndex = Math.floor(Math.random() * Math.min(randomElements.length, 50))
        try {
          await randomElements[randomIndex].hover()
          await page.waitForTimeout(1000)
        } catch (error) {
          // Continue
        }
      }
    }
  }
}

generateChemQuestDemo()
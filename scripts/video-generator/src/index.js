#!/usr/bin/env node

import puppeteer from 'puppeteer'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import winston from 'winston'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// Setup logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'video-generation.log' })
  ]
})

class ChemQuestVideoGenerator {
  constructor(options = {}) {
    this.outputDir = path.join(__dirname, '../../../videos')
    this.tempDir = path.join(this.outputDir, 'temp')
    this.finalDir = path.join(this.outputDir, 'final')
    this.browser = null
    this.page = null
    this.recordingStartTime = null
    this.screenshots = []
    this.recordingInterval = null
    
    // Configuration options
    this.config = {
      appUrl: options.appUrl || 'http://localhost:3000', // Docker dev setup
      waitTimeout: options.waitTimeout || 30000,
      ...options
    }
  }

  async initialize() {
    logger.info('🎬 Initializing ChemQuest Video Generator')
    
    // Create directories
    await fs.ensureDir(this.outputDir)
    await fs.ensureDir(this.tempDir)
    await fs.ensureDir(this.finalDir)
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for recording
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    })
    
    this.page = await this.browser.newPage()
    await this.page.setViewport({ width: 1920, height: 1080 })
    
    logger.info('✅ Browser initialized successfully')
  }

  async startRecording() {
    logger.info('🔴 Starting screen recording')
    this.recordingStartTime = Date.now()
    
    // Use screenshot-based recording
    this.screenshots = []
    this.recordingInterval = setInterval(async () => {
      try {
        const screenshot = await this.page.screenshot({ 
          type: 'png',
          fullPage: false 
        })
        this.screenshots.push({
          timestamp: Date.now(),
          data: screenshot
        })
      } catch (error) {
        logger.warn('⚠️ Screenshot capture failed:', error.message)
      }
    }, 100) // Capture every 100ms for 10fps
    
    logger.info('📸 Screenshot-based recording started')
  }

  async stopRecording() {
    logger.info('⏹️ Stopping screen recording')
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval)
    }
    
    const recordingDuration = (Date.now() - this.recordingStartTime) / 1000
    logger.info(`📊 Recording duration: ${recordingDuration.toFixed(2)} seconds`)
    logger.info(`📸 Captured ${this.screenshots.length} screenshots`)
    
    // Save screenshots to temp directory for video processing
    await this.saveScreenshots()
  }

  async saveScreenshots() {
    logger.info('💾 Saving screenshots to temp directory')
    
    const screenshotsDir = path.join(this.tempDir, 'screenshots')
    await fs.ensureDir(screenshotsDir)
    
    for (let i = 0; i < this.screenshots.length; i++) {
      const screenshot = this.screenshots[i]
      const filename = `frame_${String(i).padStart(6, '0')}.png`
      const filepath = path.join(screenshotsDir, filename)
      
      await fs.writeFile(filepath, screenshot.data)
    }
    
    logger.info(`💾 Saved ${this.screenshots.length} screenshots`)
  }

  async navigateToChemQuest() {
    logger.info(`🌐 Navigating to ChemQuest application at ${this.config.appUrl}`)
    
    try {
      // Navigate to local development server
      await this.page.goto(this.config.appUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.config.waitTimeout 
      })
      
      // Wait for app to load
      await this.page.waitForSelector('[data-testid="app-container"], .app, #root', { timeout: 10000 })
      logger.info('✅ ChemQuest application loaded')
      
    } catch (error) {
      logger.error(`❌ Failed to load ChemQuest application at ${this.config.appUrl}`)
      logger.error('💡 Make sure your Docker containers are running with: docker-compose -f docker-compose.dev.yml up')
      logger.error('💡 Or if running locally with Vite, use: npm run dev (which should use port 3000)')
      throw new Error(`Navigation failed: ${error.message}`)
    }
  }

  async performLogin() {
    logger.info('🔐 Performing demo user login')
    
    try {
      // Look for login button or form
      await this.page.waitForSelector('button:has-text("Login"), [data-testid="login-button"], .login-button', { timeout: 5000 })
      
      // Click login button
      await this.page.click('button:has-text("Login"), [data-testid="login-button"], .login-button')
      await this.delay(1000)
      
      // Fill login form (using demo credentials)
      await this.page.type('input[type="email"], input[name="email"]', 'demo@chemquest.com')
      await this.delay(500)
      
      await this.page.type('input[type="password"], input[name="password"]', 'demo123')
      await this.delay(500)
      
      // Submit login
      await this.page.click('button[type="submit"], button:has-text("Sign In")')
      await this.delay(2000)
      
      logger.info('✅ Login completed')
    } catch (error) {
      logger.warn('⚠️ Login flow not found, continuing with existing session')
    }
  }

  async playEquationDuels() {
    logger.info('⚔️ Playing Equation Duels game')
    
    try {
      // Navigate to Mathmage Trials
      await this.page.click('text="Mathmage Trials", [data-testid="mathmage-trials"]')
      await this.delay(1500)
      
      // Start Equation Duels
      await this.page.click('text="Equation Duels", [data-testid="equation-duels"]')
      await this.delay(2000)
      
      // Wait for equation to appear
      await this.page.waitForSelector('.equation, [data-testid="equation"]', { timeout: 5000 })
      
      // Solve equation (simplified interaction)
      const coefficientInputs = await this.page.$$('input[type="number"], .coefficient-input')
      
      if (coefficientInputs.length >= 4) {
        await coefficientInputs[0].type('2')
        await this.delay(800)
        await coefficientInputs[1].type('13')
        await this.delay(800)
        await coefficientInputs[2].type('8')
        await this.delay(800)
        await coefficientInputs[3].type('10')
        await this.delay(1000)
        
        // Submit answer
        await this.page.click('button:has-text("Submit"), [data-testid="submit-answer"]')
        await this.delay(2000)
      }
      
      logger.info('✅ Equation Duels completed')
    } catch (error) {
      logger.error('❌ Error in Equation Duels:', error.message)
    }
  }

  async playFlashcardMatch() {
    logger.info('🃏 Playing Flashcard Match game')
    
    try {
      // Navigate to Memory Labyrinth
      await this.page.click('text="Memory Labyrinth", [data-testid="memory-labyrinth"]')
      await this.delay(1500)
      
      // Start Flashcard Match
      await this.page.click('text="Flashcard Match", [data-testid="flashcard-match"]')
      await this.delay(2000)
      
      // Click on cards to match them
      const cards = await this.page.$$('.card, [data-testid*="card"]')
      
      if (cards.length >= 4) {
        // Click first pair
        await cards[0].click()
        await this.delay(500)
        await cards[1].click()
        await this.delay(1500)
        
        // Click second pair
        await cards[2].click()
        await this.delay(500)
        await cards[3].click()
        await this.delay(1500)
      }
      
      logger.info('✅ Flashcard Match completed')
    } catch (error) {
      logger.error('❌ Error in Flashcard Match:', error.message)
    }
  }

  async playStepByStepSimulator() {
    logger.info('🧪 Playing Step-by-Step Simulator')
    
    try {
      // Navigate to Virtual Apprentice
      await this.page.click('text="Virtual Apprentice", [data-testid="virtual-apprentice"]')
      await this.delay(1500)
      
      // Start Step-by-Step Simulator
      await this.page.click('text="Step-by-Step Simulator", [data-testid="step-simulator"]')
      await this.delay(2000)
      
      // Drag and drop procedure steps (simplified)
      const steps = await this.page.$$('.procedure-step, [data-testid*="step"]')
      
      for (let i = 0; i < Math.min(steps.length, 3); i++) {
        await steps[i].click()
        await this.delay(800)
      }
      
      // Submit procedure
      await this.page.click('button:has-text("Check Order"), [data-testid="check-procedure"]')
      await this.delay(2000)
      
      logger.info('✅ Step-by-Step Simulator completed')
    } catch (error) {
      logger.error('❌ Error in Step-by-Step Simulator:', error.message)
    }
  }

  async showCharacterProgression() {
    logger.info('📈 Showing character progression')
    
    try {
      // Navigate to character profile
      await this.page.click('text="Profile", [data-testid="character-profile"], .profile-button')
      await this.delay(2000)
      
      // Show XP and level information
      await this.page.hover('.xp-bar, [data-testid="xp-bar"]')
      await this.delay(1000)
      
      // Show achievements
      await this.page.hover('.achievements, [data-testid="achievements"]')
      await this.delay(1500)
      
      logger.info('✅ Character progression shown')
    } catch (error) {
      logger.error('❌ Error showing character progression:', error.message)
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async generateTutorialVideo() {
    logger.info('🎥 Starting 2-minute tutorial video generation')
    
    try {
      await this.initialize()
      await this.startRecording()
      
      // Video timeline (exactly 2 minutes = 120 seconds)
      await this.navigateToChemQuest() // 0-10s
      await this.delay(5000)
      
      await this.performLogin() // 10-20s
      await this.delay(5000)
      
      await this.playEquationDuels() // 20-50s
      await this.delay(10000)
      
      await this.playFlashcardMatch() // 50-80s
      await this.delay(10000)
      
      await this.playStepByStepSimulator() // 80-110s
      await this.delay(10000)
      
      await this.showCharacterProgression() // 110-120s
      await this.delay(10000)
      
      await this.stopRecording()
      await this.processVideo()
      
      logger.info('🎉 Tutorial video generation completed!')
      logger.info(`📁 Final video saved to: ${path.join(this.finalDir, 'chemquest-tutorial-2min.mp4')}`)
      
    } catch (error) {
      logger.error('❌ Error generating tutorial video:', error.message)
      throw error
    } finally {
      if (this.browser) {
        await this.browser.close()
      }
    }
  }

  async processVideo() {
    logger.info('🎞️ Processing video with FFmpeg')
    
    const screenshotsDir = path.join(this.tempDir, 'screenshots')
    const outputPath = path.join(this.finalDir, 'chemquest-tutorial-2min.mp4')
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(screenshotsDir, 'frame_%06d.png'))
        .inputOptions([
          '-framerate 10', // Input framerate (10 FPS from screenshots)
          '-t 120' // Limit to exactly 2 minutes
        ])
        .videoCodec('libx264')
        .size('1920x1080')
        .fps(30) // Output framerate
        .videoBitrate('2000k')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-pix_fmt yuv420p', // Ensure compatibility
          '-movflags +faststart' // Optimize for web streaming
        ])
        .on('start', (commandLine) => {
          logger.info('🔄 FFmpeg process started')
          logger.info(`Command: ${commandLine}`)
        })
        .on('progress', (progress) => {
          logger.info(`⏳ Processing: ${Math.round(progress.percent || 0)}%`)
        })
        .on('end', () => {
          logger.info('✅ Video processing completed')
          resolve()
        })
        .on('error', (err) => {
          logger.error('❌ FFmpeg error:', err.message)
          reject(err)
        })
        .save(outputPath)
    })
  }

  async cleanup() {
    logger.info('🧹 Cleaning up temporary files')
    
    try {
      await fs.remove(this.tempDir)
      logger.info('✅ Cleanup completed')
    } catch (error) {
      logger.warn('⚠️ Cleanup warning:', error.message)
    }
  }
}

// Main execution
async function main() {
  console.log('🎬 Main function started')
  console.log('📋 Process arguments:', process.argv)
  
  // Parse command line arguments
  const args = process.argv.slice(2)
  console.log('🔧 Parsed args:', args)
  
  const urlArg = args.find(arg => arg.startsWith('--url='))
  const appUrl = urlArg ? urlArg.split('=')[1] : undefined
  
  const options = {}
  if (appUrl) {
    options.appUrl = appUrl
    console.log(`🔧 Using custom URL: ${appUrl}`)
  }
  
  const generator = new ChemQuestVideoGenerator(options)
  console.log('🏗️ Generator created with config:', generator.config)
  
  try {
    console.log('🚀 Starting ChemQuest Video Generation')
    console.log(`📍 Target URL: ${generator.config.appUrl}`)
    console.log('💡 Make sure your ChemQuest application is running!')
    console.log('')
    
    await generator.generateTutorialVideo()
    await generator.cleanup()
    
    console.log('\n🎉 SUCCESS!')
    console.log('📁 Your 2-minute ChemQuest tutorial video is ready!')
    console.log(`📍 Location: ${path.join(generator.finalDir, 'chemquest-tutorial-2min.mp4')}`)
    console.log('📊 Video specs: 1920x1080, 30fps, ~2 minutes, web-optimized')
    
  } catch (error) {
    console.error('\n❌ FAILED!')
    console.error('Error:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure Docker containers are running: docker-compose -f docker-compose.dev.yml up')
    console.log('2. Check if the app is accessible at: http://localhost:3000')
    console.log('3. If using Vite directly, try: --url=http://localhost:5173')
    process.exit(1)
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1].includes('index.js') ||
                     process.argv[1].includes('src/index.js')

if (isMainModule) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error)
    process.exit(1)
  })
}

export default ChemQuestVideoGenerator
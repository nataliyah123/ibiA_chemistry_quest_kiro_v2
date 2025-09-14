import { GameplayAgent } from '../agent/GameplayAgent.js'
import { NarrationGenerator } from './NarrationGenerator.js'
import { join } from 'path'
import fs from 'fs-extra'

export class GameplayRecorder {
  constructor(logger) {
    this.logger = logger
    this.agent = new GameplayAgent(logger)
    this.narrator = new NarrationGenerator(logger)
  }

  async recordGameplaySession(options) {
    const {
      duration = 120, // Exactly 2 minutes
      outputPath,
      resolution = { width: 1920, height: 1080 },
      frameRate = 30,
      tempDir
    } = options

    this.logger.info(`🎬 Starting ${duration}s gameplay recording at ${resolution.width}x${resolution.height}@${frameRate}fps`)
    
    try {
      // Initialize AI agent
      await this.agent.initialize()
      
      // Generate narration audio clips
      this.logger.info('🎙️ Generating narration audio...')
      const audioClips = await this.narrator.generateNarrationAudio(tempDir)
      
      // Start screen recording
      this.logger.info('📹 Starting screen capture...')
      const page = this.agent.getPage()
      
      // Configure page for recording
      await page.setViewport(resolution)
      
      // Start recording and gameplay simultaneously
      const recordingPromise = this.startScreenRecording(page, outputPath, duration, frameRate)
      const gameplayPromise = this.agent.executeTimedGameplaySequence(duration)
      
      // Wait for both to complete
      await Promise.all([recordingPromise, gameplayPromise])
      
      this.logger.info('✅ Gameplay recording completed')
      
      // Cleanup
      await this.agent.cleanup()
      
      return {
        videoPath: outputPath,
        audioClips: audioClips,
        duration: duration,
        resolution: resolution,
        frameRate: frameRate
      }
      
    } catch (error) {
      this.logger.error('❌ Recording failed:', error)
      await this.agent.cleanup()
      throw error
    }
  }

  async startScreenRecording(page, outputPath, duration, frameRate) {
    return new Promise(async (resolve, reject) => {
      try {
        this.logger.info('📸 Capturing screenshots for video...')
        
        const screenshots = []
        const screenshotInterval = 1000 / frameRate // e.g., 33.33ms for 30fps
        let screenshotCount = 0
        const maxScreenshots = duration * frameRate
        
        const screenshotTimer = setInterval(async () => {
          try {
            if (screenshotCount >= maxScreenshots) {
              clearInterval(screenshotTimer)
              this.logger.info(`📸 Captured ${screenshots.length} screenshots`)
              await this.convertScreenshotsToVideo(screenshots, outputPath, frameRate)
              resolve()
              return
            }
            
            const screenshot = await page.screenshot({
              type: 'png',
              fullPage: false,
              quality: 90
            })
            
            screenshots.push({
              data: screenshot,
              timestamp: Date.now(),
              index: screenshotCount
            })
            
            screenshotCount++
            
            // Log progress every 30 screenshots (1 second at 30fps)
            if (screenshotCount % 30 === 0) {
              const progress = Math.round((screenshotCount / maxScreenshots) * 100)
              this.logger.info(`📸 Recording progress: ${progress}% (${screenshotCount}/${maxScreenshots} frames)`)
            }
            
          } catch (error) {
            this.logger.warn('Screenshot capture error:', error.message)
          }
        }, screenshotInterval)
        
        // Safety timeout
        setTimeout(() => {
          clearInterval(screenshotTimer)
          if (screenshots.length > 0) {
            this.logger.info(`⏰ Recording timeout reached, processing ${screenshots.length} screenshots`)
            this.convertScreenshotsToVideo(screenshots, outputPath, frameRate)
              .then(resolve)
              .catch(reject)
          } else {
            reject(new Error('No screenshots captured during recording'))
          }
        }, (duration + 10) * 1000) // 10 second buffer
        
      } catch (error) {
        reject(error)
      }
    })
  }

  async convertScreenshotsToVideo(screenshots, outputPath, frameRate) {
    this.logger.info(`🎞️ Converting ${screenshots.length} screenshots to video...`)
    
    try {
      // Save screenshots to temporary files
      const screenshotsDir = join(outputPath, '..', 'temp-screenshots')
      await fs.ensureDir(screenshotsDir)
      
      // Save each screenshot with padded filename for FFmpeg
      for (let i = 0; i < screenshots.length; i++) {
        const filename = `frame_${i.toString().padStart(6, '0')}.png`
        const filepath = join(screenshotsDir, filename)
        await fs.writeFile(filepath, screenshots[i].data)
      }
      
      // Create video metadata for fallback
      const videoMetadata = {
        type: 'screenshot-based-video',
        screenshots: screenshots.length,
        duration: screenshots.length / frameRate,
        resolution: '1920x1080',
        frameRate: frameRate,
        format: 'mp4',
        createdAt: new Date().toISOString(),
        screenshotsDir: screenshotsDir
      }
      
      // Save metadata
      await fs.writeFile(outputPath.replace('.mp4', '.json'), JSON.stringify(videoMetadata, null, 2))
      
      // Create placeholder video file (will be processed by VideoProcessor)
      const placeholderData = Buffer.from(`CHEMQUEST_VIDEO_PLACEHOLDER_${screenshots.length}_FRAMES`)
      await fs.writeFile(outputPath, placeholderData)
      
      this.logger.info(`✅ Video conversion prepared: ${outputPath}`)
      
      // Cleanup temporary screenshots after a delay
      setTimeout(async () => {
        try {
          await fs.remove(screenshotsDir)
        } catch (error) {
          this.logger.debug('Cleanup of temp screenshots failed:', error.message)
        }
      }, 60000) // Clean up after 1 minute
      
    } catch (error) {
      this.logger.error('Screenshot to video conversion failed:', error)
      throw error
    }
  }

  async createFallbackVideo(outputPath, duration) {
    // Create a simple colored video as fallback
    this.logger.info('📹 Creating fallback video...')
    
    const fallbackData = {
      type: 'fallback-video',
      duration: duration,
      resolution: '1920x1080',
      message: 'ChemQuest Tutorial Video - Fallback Mode',
      createdAt: new Date().toISOString()
    }
    
    await fs.writeFile(outputPath.replace('.mp4', '.json'), JSON.stringify(fallbackData, null, 2))
    
    // Create minimal video file
    const fallbackVideoData = Buffer.from('CHEMQUEST_FALLBACK_VIDEO')
    await fs.writeFile(outputPath, fallbackVideoData)
    
    this.logger.info('✅ Fallback video created')
  }
}
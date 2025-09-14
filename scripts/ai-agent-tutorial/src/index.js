#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs-extra'
import winston from 'winston'
import dotenv from 'dotenv'
import { GameplayRecorder } from './recorder/GameplayRecorder.js'
import { VideoProcessor } from './processor/VideoProcessor.js'
import { ServerManager } from './utils/ServerManager.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '../../../')
const VIDEOS_DIR = join(PROJECT_ROOT, 'videos')

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: join(VIDEOS_DIR, 'logs', 'tutorial-generator.log') })
  ]
})

export class TutorialVideoGenerator {
  constructor() {
    this.videosDir = VIDEOS_DIR
    this.tempDir = join(VIDEOS_DIR, 'temp')
    this.outputDir = join(VIDEOS_DIR, 'output')
    this.finalDir = join(VIDEOS_DIR, 'final')
    this.logger = logger
    
    this.serverManager = new ServerManager(logger)
    this.recorder = new GameplayRecorder(logger)
    this.processor = new VideoProcessor(logger)
  }

  async initialize() {
    this.logger.info('🚀 Initializing ChemQuest AI Tutorial Generator')
    
    // Create directory structure exactly as specified
    await fs.ensureDir(this.videosDir)
    await fs.ensureDir(this.tempDir)
    await fs.ensureDir(this.outputDir)
    await fs.ensureDir(this.finalDir)
    await fs.ensureDir(join(this.videosDir, 'logs'))
    await fs.ensureDir(join(this.tempDir, 'screenshots'))
    await fs.ensureDir(join(this.tempDir, 'audio-clips'))
    
    this.logger.info('📁 Video directory structure created:')
    this.logger.info(`   📂 ${this.tempDir} (working files)`)
    this.logger.info(`   📂 ${this.outputDir} (primary output)`)
    this.logger.info(`   📂 ${this.finalDir} (web-optimized final)`)
  }

  async generateTutorialVideo() {
    try {
      await this.initialize()
      
      // Step 1: Start ChemQuest servers
      this.logger.info('🔧 Starting ChemQuest servers...')
      await this.serverManager.startServers()
      
      // Step 2: Record 2-minute gameplay session
      this.logger.info('🎬 Starting 2-minute gameplay recording...')
      const primaryOutputPath = join(this.outputDir, 'chemquest-gameplay-tutorial.mp4')
      
      const recordingResult = await this.recorder.recordGameplaySession({
        duration: 120, // Exactly 2 minutes
        outputPath: primaryOutputPath,
        resolution: { width: 1920, height: 1080 }, // Standard HD
        frameRate: 30, // Smooth but manageable
        tempDir: this.tempDir
      })
      
      // Step 3: Process and optimize video
      this.logger.info('🎞️ Processing video with narration and effects...')
      const finalVideoPath = join(this.finalDir, 'chemquest-tutorial-2min.mp4')
      
      const processedVideo = await this.processor.processVideo({
        inputPath: recordingResult.videoPath,
        outputPath: finalVideoPath,
        tempDir: this.tempDir,
        targetSize: 50 * 1024 * 1024, // Under 50MB for web
        audioClips: recordingResult.audioClips
      })
      
      // Step 4: Cleanup temporary files
      this.logger.info('🧹 Cleaning up temporary files...')
      await this.serverManager.stopServers()
      await fs.remove(this.tempDir)
      
      // Step 5: Generate final report
      const videoStats = await this.generateVideoReport(finalVideoPath)
      
      this.logger.info('✅ Tutorial video generated successfully!')
      this.logger.info(`📍 Primary Output: ${primaryOutputPath}`)
      this.logger.info(`📍 Final Delivery: ${finalVideoPath}`)
      
      return {
        primaryOutput: primaryOutputPath,
        finalDelivery: finalVideoPath,
        stats: videoStats
      }
      
    } catch (error) {
      this.logger.error('❌ Error generating tutorial video:', error)
      await this.serverManager.stopServers()
      throw error
    }
  }

  async generateVideoReport(videoPath) {
    try {
      const stats = await fs.stat(videoPath)
      const fileSizeMB = Math.round(stats.size / (1024 * 1024))
      
      return {
        duration: '2:00',
        resolution: '1920x1080',
        frameRate: '30fps',
        format: 'MP4',
        fileSize: `${fileSizeMB}MB`,
        webOptimized: fileSizeMB <= 50,
        location: videoPath,
        segments: [
          { name: 'Intro', time: '0:00-0:15', content: 'ChemQuest logo + welcome' },
          { name: 'Character Creation', time: '0:15-0:25', content: 'Quick character setup' },
          { name: 'Mathmage Trials', time: '0:25-0:50', content: 'Equation Duels gameplay' },
          { name: 'Memory Labyrinth', time: '0:50-1:15', content: 'Flashcard Match game' },
          { name: 'Virtual Apprentice', time: '1:15-1:40', content: 'Step-by-Step Simulator' },
          { name: 'Progress & Rewards', time: '1:40-1:55', content: 'XP, levels, badges' },
          { name: 'Outro', time: '1:55-2:00', content: 'Call to action' }
        ]
      }
    } catch (error) {
      this.logger.warn('Could not generate video report:', error.message)
      return { error: 'Stats unavailable' }
    }
  }
}

// Main execution when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new TutorialVideoGenerator()
  
  generator.generateTutorialVideo()
    .then((result) => {
      console.log('\n🎉 SUCCESS! ChemQuest tutorial video is ready!')
      console.log('=' .repeat(60))
      console.log(`📹 Primary Output: ${result.primaryOutput}`)
      console.log(`🌐 Final Delivery: ${result.finalDelivery}`)
      
      if (result.stats && !result.stats.error) {
        console.log('\n📊 Video Details:')
        console.log(`   • Duration: ${result.stats.duration}`)
        console.log(`   • Resolution: ${result.stats.resolution}`)
        console.log(`   • Frame Rate: ${result.stats.frameRate}`)
        console.log(`   • File Size: ${result.stats.fileSize}`)
        console.log(`   • Web Optimized: ${result.stats.webOptimized ? '✅' : '❌'}`)
        
        console.log('\n🎬 Video Segments:')
        result.stats.segments.forEach(segment => {
          console.log(`   ${segment.time}: ${segment.name} - ${segment.content}`)
        })
      }
      
      console.log('\n✨ Your ChemQuest tutorial video is ready for sharing!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 FAILED to generate tutorial video:')
      console.error('❌ Error:', error.message)
      process.exit(1)
    })
}
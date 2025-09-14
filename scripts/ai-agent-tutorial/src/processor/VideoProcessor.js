import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { join } from 'path'
import fs from 'fs-extra'

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export class VideoProcessor {
  constructor(logger) {
    this.logger = logger
  }

  async processVideo(options) {
    const { inputPath, outputPath, tempDir, targetSize = 50 * 1024 * 1024, audioClips = [] } = options
    
    this.logger.info('🎞️ Starting video processing pipeline...')
    
    try {
      // Step 1: Create intro/outro overlays
      await this.createVideoOverlays(tempDir)
      
      // Step 2: Process main video with narration
      const processedVideoPath = await this.processMainVideo(inputPath, audioClips, tempDir)
      
      // Step 3: Add intro and outro
      const withIntroOutroPath = await this.addIntroOutro(processedVideoPath, tempDir)
      
      // Step 4: Optimize for web (under 50MB)
      await this.optimizeForWeb(withIntroOutroPath, outputPath, targetSize)
      
      this.logger.info(`✅ Video processing completed: ${outputPath}`)
      
      return outputPath
      
    } catch (error) {
      this.logger.error('❌ Video processing failed:', error)
      
      // Create fallback video
      await this.createFallbackVideo(outputPath)
      return outputPath
    }
  }

  async createVideoOverlays(tempDir) {
    this.logger.info('🎨 Creating video overlays...')
    
    const overlaysDir = join(tempDir, 'overlays')
    await fs.ensureDir(overlaysDir)
    
    // Create intro overlay (3 seconds)
    const introPath = join(overlaysDir, 'intro.mp4')
    await this.createIntroVideo(introPath)
    
    // Create outro overlay (3 seconds)
    const outroPath = join(overlaysDir, 'outro.mp4')
    await this.createOutroVideo(outroPath)
    
    this.logger.info('✅ Video overlays created')
  }

  async createIntroVideo(outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=#1a1a2e:size=1920x1080:duration=3')
        .inputFormat('lavfi')
        .complexFilter([
          // Add ChemQuest title text
          'drawtext=text=\\"ChemQuest\\: Alchemist Academy\\":fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50',
          'drawtext=text=\\"AI Gameplay Tutorial\\":fontsize=36:fontcolor=#00d4ff:x=(w-text_w)/2:y=(h-text_h)/2+50'
        ])
        .videoCodec('libx264')
        .fps(30)
        .duration(3)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
  }

  async createOutroVideo(outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=#2d5a87:size=1920x1080:duration=3')
        .inputFormat('lavfi')
        .complexFilter([
          'drawtext=text=\\"Start Your Chemistry Adventure Today!\\":fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30',
          'drawtext=text=\\"Visit ChemQuest.ai\\":fontsize=32:fontcolor=#00ff88:x=(w-text_w)/2:y=(h-text_h)/2+30'
        ])
        .videoCodec('libx264')
        .fps(30)
        .duration(3)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
  }

  async processMainVideo(inputPath, audioClips, tempDir) {
    this.logger.info('🎬 Processing main video with narration...')
    
    const outputPath = join(tempDir, 'processed-main-video.mp4')
    
    return new Promise(async (resolve, reject) => {
      try {
        // Check if we have screenshot-based video
        const metadataPath = inputPath.replace('.mp4', '.json')
        let isScreenshotBased = false
        let screenshotsDir = null
        
        if (await fs.pathExists(metadataPath)) {
          const metadata = await fs.readJson(metadataPath)
          if (metadata.type === 'screenshot-based-video' && metadata.screenshotsDir) {
            isScreenshotBased = true
            screenshotsDir = metadata.screenshotsDir
          }
        }
        
        let command = ffmpeg()
        
        if (isScreenshotBased && screenshotsDir && await fs.pathExists(screenshotsDir)) {
          // Create video from screenshots
          this.logger.info('📸 Creating video from screenshots...')
          const framePattern = join(screenshotsDir, 'frame_%06d.png')
          command = command.input(framePattern)
          command = command.inputFPS(30)
        } else {
          // Use placeholder or fallback
          this.logger.info('🎨 Creating placeholder video...')
          command = command.input('color=navy:size=1920x1080:duration=120')
          command = command.inputFormat('lavfi')
        }
        
        // Add audio tracks
        const validAudioClips = []
        for (const audioClip of audioClips) {
          if (await fs.pathExists(audioClip.file)) {
            command = command.input(audioClip.file)
            validAudioClips.push(audioClip)
          }
        }
        
        // Set video properties
        command = command
          .videoCodec('libx264')
          .size('1920x1080')
          .fps(30)
          .duration(120) // Exactly 2 minutes
        
        // Mix audio if we have multiple clips
        if (validAudioClips.length > 1) {
          const audioInputs = validAudioClips.map((_, index) => `[${index + 1}:a]`).join('')
          command = command.complexFilter([
            `${audioInputs}amix=inputs=${validAudioClips.length}:duration=longest[aout]`
          ])
          command = command.outputOptions(['-map', '0:v', '-map', '[aout]'])
        } else if (validAudioClips.length === 1) {
          command = command.outputOptions(['-map', '0:v', '-map', '1:a'])
        }
        
        command
          .output(outputPath)
          .on('start', (commandLine) => {
            this.logger.debug('FFmpeg command:', commandLine)
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              this.logger.info(`Processing: ${Math.round(progress.percent)}%`)
            }
          })
          .on('end', () => {
            this.logger.info('✅ Main video processing completed')
            resolve(outputPath)
          })
          .on('error', (error) => {
            this.logger.error('❌ FFmpeg error:', error.message)
            // Create fallback
            this.createPlaceholderVideo(outputPath, 120)
              .then(() => resolve(outputPath))
              .catch(reject)
          })
          .run()
          
      } catch (error) {
        reject(error)
      }
    })
  }

  async createPlaceholderVideo(outputPath, duration = 120) {
    this.logger.info(`📹 Creating ${duration}s placeholder video...`)
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=navy:size=1920x1080:duration=' + duration)
        .inputFormat('lavfi')
        .complexFilter([
          'drawtext=text=\\"ChemQuest\\: Alchemist Academy\\":fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-100',
          'drawtext=text=\\"Tutorial Video\\":fontsize=48:fontcolor=#00d4ff:x=(w-text_w)/2:y=(h-text_h)/2',
          'drawtext=text=\\"Gameplay Demonstration\\":fontsize=32:fontcolor=#00ff88:x=(w-text_w)/2:y=(h-text_h)/2+100'
        ])
        .videoCodec('libx264')
        .fps(30)
        .duration(duration)
        .output(outputPath)
        .on('end', () => {
          this.logger.info('✅ Placeholder video created')
          resolve(outputPath)
        })
        .on('error', reject)
        .run()
    })
  }

  async addIntroOutro(inputPath, tempDir) {
    this.logger.info('🎬 Adding intro and outro...')
    
    const introPath = join(tempDir, 'overlays', 'intro.mp4')
    const outroPath = join(tempDir, 'overlays', 'outro.mp4')
    const outputPath = join(tempDir, 'with-intro-outro.mp4')
    
    // Check if intro/outro files exist
    const hasIntro = await fs.pathExists(introPath)
    const hasOutro = await fs.pathExists(outroPath)
    
    if (!hasIntro && !hasOutro) {
      // No intro/outro, just copy the main video
      await fs.copy(inputPath, outputPath)
      return outputPath
    }
    
    return new Promise((resolve, reject) => {
      const listFile = join(tempDir, 'concat-list.txt')
      const listContent = []
      
      if (hasIntro) listContent.push(`file '${introPath}'`)
      listContent.push(`file '${inputPath}'`)
      if (hasOutro) listContent.push(`file '${outroPath}'`)
      
      fs.writeFileSync(listFile, listContent.join('\\n'))
      
      ffmpeg()
        .input(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .videoCodec('libx264')
        .audioCodec('aac')
        .output(outputPath)
        .on('end', () => {
          this.logger.info('✅ Intro/outro added')
          resolve(outputPath)
        })
        .on('error', (error) => {
          this.logger.warn('Intro/outro failed, using main video:', error.message)
          fs.copy(inputPath, outputPath)
            .then(() => resolve(outputPath))
            .catch(reject)
        })
        .run()
    })
  }

  async optimizeForWeb(inputPath, outputPath, targetSize) {
    this.logger.info(`🌐 Optimizing video for web (target: ${Math.round(targetSize / 1024 / 1024)}MB)...`)
    
    return new Promise((resolve, reject) => {
      // Calculate bitrate to achieve target file size
      const durationSeconds = 126 // 2 min + intro/outro
      const targetBitrate = Math.floor((targetSize * 8) / durationSeconds / 1000) // kbps
      const videoBitrate = Math.max(800, Math.floor(targetBitrate * 0.8)) // 80% for video
      const audioBitrate = Math.min(128, Math.floor(targetBitrate * 0.2)) // 20% for audio
      
      this.logger.info(`🎯 Target bitrates: video=${videoBitrate}k, audio=${audioBitrate}k`)
      
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1920x1080')
        .fps(30)
        .videoBitrate(`${videoBitrate}k`)
        .audioBitrate(`${audioBitrate}k`)
        .outputOptions([
          '-preset', 'fast',
          '-crf', '23',
          '-movflags', '+faststart', // Enable progressive download
          '-pix_fmt', 'yuv420p' // Ensure compatibility
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          if (progress.percent) {
            this.logger.info(`Optimizing: ${Math.round(progress.percent)}%`)
          }
        })
        .on('end', async () => {
          // Check final file size
          try {
            const stats = await fs.stat(outputPath)
            const finalSizeMB = Math.round(stats.size / 1024 / 1024)
            const targetSizeMB = Math.round(targetSize / 1024 / 1024)
            
            this.logger.info(`✅ Web optimization completed: ${finalSizeMB}MB (target: ${targetSizeMB}MB)`)
            
            if (stats.size <= targetSize) {
              this.logger.info('🎯 Target file size achieved!')
            } else {
              this.logger.warn(`⚠️ File size (${finalSizeMB}MB) exceeds target (${targetSizeMB}MB)`)
            }
            
            resolve(outputPath)
          } catch (error) {
            this.logger.warn('Could not check final file size:', error.message)
            resolve(outputPath)
          }
        })
        .on('error', (error) => {
          this.logger.warn('Optimization failed, copying original:', error.message)
          fs.copy(inputPath, outputPath)
            .then(() => resolve(outputPath))
            .catch(reject)
        })
        .run()
    })
  }

  async createFallbackVideo(outputPath) {
    this.logger.info('📹 Creating fallback video...')
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=#1a1a2e:size=1920x1080:duration=120')
        .inputFormat('lavfi')
        .complexFilter([
          'drawtext=text=\\"ChemQuest\\: Alchemist Academy\\":fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-100',
          'drawtext=text=\\"Tutorial Video\\":fontsize=48:fontcolor=#00d4ff:x=(w-text_w)/2:y=(h-text_h)/2',
          'drawtext=text=\\"Coming Soon\\":fontsize=36:fontcolor=#00ff88:x=(w-text_w)/2:y=(h-text_h)/2+100'
        ])
        .videoCodec('libx264')
        .fps(30)
        .videoBitrate('1000k')
        .audioBitrate('128k')
        .outputOptions(['-movflags', '+faststart'])
        .output(outputPath)
        .on('end', () => {
          this.logger.info('✅ Fallback video created')
          resolve(outputPath)
        })
        .on('error', reject)
        .run()
    })
  }
}
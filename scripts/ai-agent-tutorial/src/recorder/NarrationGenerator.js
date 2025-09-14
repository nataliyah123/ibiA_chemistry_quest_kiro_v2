import fs from 'fs-extra'
import { join } from 'path'
import { spawn } from 'child_process'

export class NarrationGenerator {
  constructor(logger) {
    this.logger = logger
    this.narrationScript = this.createNarrationScript()
  }

  createNarrationScript() {
    // Exact narration matching the 2-minute timeline
    return {
      intro: {
        text: "Welcome to ChemQuest: Alchemist Academy! The ultimate gamified chemistry learning platform for O and A-Level students.",
        startTime: 0,
        duration: 15
      },
      character_creation: {
        text: "Let's create your character and explore the magical world of chemistry learning through interactive gameplay.",
        startTime: 15,
        duration: 10
      },
      mathmage_trials: {
        text: "First, we enter the Mathmage Trials realm, where you'll master equation balancing through exciting duels with drag-and-drop mechanics.",
        startTime: 25,
        duration: 25
      },
      memory_labyrinth: {
        text: "Next, we venture into the Memory Labyrinth, where flashcard games help you memorize gas tests and chemical properties with combo multipliers.",
        startTime: 50,
        duration: 25
      },
      virtual_apprentice: {
        text: "In the Virtual Apprentice realm, you'll learn laboratory techniques through step-by-step simulations and hands-on practice.",
        startTime: 75,
        duration: 25
      },
      progress_rewards: {
        text: "Watch as your character gains experience points, levels up, and unlocks new badges and achievements for your chemistry mastery.",
        startTime: 100,
        duration: 15
      },
      outro: {
        text: "Start your chemistry adventure today with ChemQuest: Alchemist Academy!",
        startTime: 115,
        duration: 5
      }
    }
  }

  async generateNarrationAudio(tempDir) {
    this.logger.info('🎙️ Generating narration audio clips...')
    
    const audioClipsDir = join(tempDir, 'audio-clips')
    await fs.ensureDir(audioClipsDir)
    
    const audioFiles = []
    
    for (const [segment, narration] of Object.entries(this.narrationScript)) {
      try {
        const audioFile = join(audioClipsDir, `${segment}.wav`)
        
        // Generate audio using text-to-speech
        await this.generateTTSAudio(narration.text, audioFile)
        
        audioFiles.push({
          segment,
          file: audioFile,
          startTime: narration.startTime,
          duration: narration.duration,
          text: narration.text
        })
        
        this.logger.info(`✅ Generated audio for ${segment} (${narration.duration}s)`)
        
      } catch (error) {
        this.logger.warn(`⚠️ Failed to generate audio for ${segment}:`, error.message)
        
        // Create silent placeholder
        const silentFile = join(audioClipsDir, `${segment}_silent.wav`)
        await this.createSilentAudio(silentFile, narration.duration)
        
        audioFiles.push({
          segment,
          file: silentFile,
          startTime: narration.startTime,
          duration: narration.duration,
          text: narration.text,
          silent: true
        })
      }
    }
    
    this.logger.info(`🎙️ Generated ${audioFiles.length} audio clips`)
    return audioFiles
  }

  async generateTTSAudio(text, outputFile) {
    return new Promise((resolve, reject) => {
      let command, args
      
      // Platform-specific TTS commands
      if (process.platform === 'win32') {
        // Windows PowerShell TTS
        command = 'powershell'
        args = [
          '-Command',
          `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.SetOutputToWaveFile('${outputFile.replace(/'/g, "''")}'); $synth.Speak('${text.replace(/'/g, "''")}'); $synth.Dispose()`
        ]
      } else if (process.platform === 'darwin') {
        // macOS 'say' command
        command = 'say'
        args = ['-o', outputFile, '--data-format=LEF32@22050', text]
      } else {
        // Linux espeak
        command = 'espeak'
        args = ['-w', outputFile, '-s', '150', text] // 150 words per minute
      }
      
      const ttsProcess = spawn(command, args, { stdio: 'pipe' })
      
      let processOutput = ''
      
      ttsProcess.stdout?.on('data', (data) => {
        processOutput += data.toString()
      })
      
      ttsProcess.stderr?.on('data', (data) => {
        processOutput += data.toString()
      })
      
      ttsProcess.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`TTS process exited with code ${code}: ${processOutput}`))
        }
      })
      
      ttsProcess.on('error', (error) => {
        reject(new Error(`TTS process error: ${error.message}`))
      })
      
      // Timeout after 30 seconds
      setTimeout(() => {
        ttsProcess.kill('SIGTERM')
        reject(new Error('TTS process timeout'))
      }, 30000)
    })
  }

  async createSilentAudio(outputFile, durationSeconds) {
    this.logger.info(`🔇 Creating ${durationSeconds}s silent audio: ${outputFile}`)
    
    const sampleRate = 22050
    const samples = Math.floor(durationSeconds * sampleRate)
    const dataSize = samples * 2 // 16-bit samples
    
    const buffer = Buffer.alloc(44 + dataSize)
    
    // WAV header
    buffer.write('RIFF', 0)
    buffer.writeUInt32LE(36 + dataSize, 4)
    buffer.write('WAVE', 8)
    buffer.write('fmt ', 12)
    buffer.writeUInt32LE(16, 16) // PCM format size
    buffer.writeUInt16LE(1, 20)  // PCM format
    buffer.writeUInt16LE(1, 22)  // Mono
    buffer.writeUInt32LE(sampleRate, 24)
    buffer.writeUInt32LE(sampleRate * 2, 28) // Byte rate
    buffer.writeUInt16LE(2, 32)  // Block align
    buffer.writeUInt16LE(16, 34) // Bits per sample
    buffer.write('data', 36)
    buffer.writeUInt32LE(dataSize, 40)
    
    // Silent data (all zeros)
    buffer.fill(0, 44)
    
    await fs.writeFile(outputFile, buffer)
  }

  getNarrationScript() {
    return this.narrationScript
  }

  getTotalDuration() {
    return Object.values(this.narrationScript)
      .reduce((total, segment) => total + segment.duration, 0)
  }

  getSegmentByTime(timeSeconds) {
    for (const [key, segment] of Object.entries(this.narrationScript)) {
      if (timeSeconds >= segment.startTime && timeSeconds < segment.startTime + segment.duration) {
        return { key, ...segment }
      }
    }
    return null
  }
}
#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testTTS() {
  console.log('🎙️ Testing Text-to-Speech functionality...')
  console.log(`Platform: ${process.platform}`)
  
  const testText = "Hello, this is a test of the text to speech system for ChemQuest."
  const outputPath = path.join(__dirname, 'test-audio.wav')
  
  try {
    if (process.platform === 'win32') {
      console.log('🪟 Testing Windows SAPI TTS...')
      
      // First test: Just speak without saving to file
      console.log('Testing speech output...')
      try {
        const speakScript = `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak('Testing ChemQuest text to speech'); $synth.Dispose()`
        execSync(`powershell -ExecutionPolicy Bypass -Command "${speakScript}"`, { stdio: 'inherit' })
        console.log('✅ Speech test successful')
      } catch (error) {
        console.log('⚠️ Speech test failed:', error.message)
      }
      
      // Second test: Save to file
      console.log('Testing file output...')
      const cleanPath = outputPath.replace(/\\/g, '/')
      const cleanText = testText.replace(/"/g, '\\"')
      
      const fileScript = `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.SetOutputToWaveFile('${cleanPath}'); $synth.Speak('${cleanText}'); $synth.Dispose()`
      
      console.log('PowerShell command:', fileScript)
      execSync(`powershell -ExecutionPolicy Bypass -Command "${fileScript}"`, { stdio: 'inherit' })
      
    } else if (process.platform === 'darwin') {
      console.log('🍎 Testing macOS say command...')
      execSync(`say "${testText}" -o "${outputPath}" --data-format=LEF32@22050`, { stdio: 'inherit' })
      
    } else {
      console.log('🐧 Testing Linux TTS...')
      try {
        console.log('Trying espeak...')
        execSync(`espeak "${testText}" -w "${outputPath}"`, { stdio: 'inherit' })
      } catch (error) {
        console.log('Trying festival...')
        execSync(`echo "${testText}" | text2wave -o "${outputPath}"`, { stdio: 'inherit' })
      }
    }
    
    // Check if file was created
    if (await fs.pathExists(outputPath)) {
      const stats = await fs.stat(outputPath)
      console.log(`✅ TTS test successful!`)
      console.log(`📁 Audio file created: ${outputPath}`)
      console.log(`📊 File size: ${stats.size} bytes`)
      console.log('🎵 You can play this file to test the audio quality')
      
      // Clean up test file after 10 seconds
      setTimeout(async () => {
        try {
          await fs.remove(outputPath)
          console.log('🧹 Test file cleaned up')
        } catch (error) {
          console.log('⚠️ Could not clean up test file:', error.message)
        }
      }, 10000)
      
    } else {
      console.log('❌ TTS test failed - no audio file created')
    }
    
  } catch (error) {
    console.log('❌ TTS test failed:', error.message)
    console.log('')
    console.log('💡 Troubleshooting:')
    
    if (process.platform === 'win32') {
      console.log('- Make sure PowerShell is available')
      console.log('- Windows Speech API should be built-in')
    } else if (process.platform === 'darwin') {
      console.log('- The "say" command should be built-in on macOS')
    } else {
      console.log('- Install espeak: sudo apt-get install espeak')
      console.log('- Or install festival: sudo apt-get install festival')
    }
    
    console.log('')
    console.log('🔄 The narrated demo will still work with captions only if TTS fails')
  }
}

testTTS()
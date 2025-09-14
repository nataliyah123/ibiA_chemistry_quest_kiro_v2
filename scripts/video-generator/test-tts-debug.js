#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function debugTTS() {
  console.log('🔍 Debugging TTS functionality...')
  console.log(`Platform: ${process.platform}`)
  console.log(`Directory: ${__dirname}`)
  
  if (process.platform !== 'win32') {
    console.log('❌ This debug script is for Windows only')
    return
  }
  
  const testText = "Hello ChemQuest"
  const outputPath = path.join(__dirname, 'debug-audio.wav')
  
  console.log(`Output path: ${outputPath}`)
  
  // Test 1: Simple speech (no file)
  console.log('\n🎤 Test 1: Simple speech output')
  try {
    execSync(`powershell -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('Hello from ChemQuest')"`, { stdio: 'inherit' })
    console.log('✅ Simple speech works')
  } catch (error) {
    console.log('❌ Simple speech failed:', error.message)
    return
  }
  
  // Test 2: File output with absolute path
  console.log('\n💾 Test 2: File output')
  try {
    const absolutePath = path.resolve(outputPath)
    console.log(`Absolute path: ${absolutePath}`)
    
    const command = `powershell -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile('${absolutePath}'); $s.Speak('${testText}'); $s.Dispose()"`
    
    console.log('Executing command...')
    execSync(command, { stdio: 'inherit' })
    
    // Check if file was created
    if (await fs.pathExists(outputPath)) {
      const stats = await fs.stat(outputPath)
      console.log(`✅ File created successfully!`)
      console.log(`📊 File size: ${stats.size} bytes`)
      
      // Clean up after 5 seconds
      setTimeout(async () => {
        try {
          await fs.remove(outputPath)
          console.log('🧹 Debug file cleaned up')
        } catch (error) {
          console.log('⚠️ Could not clean up debug file')
        }
      }, 5000)
      
    } else {
      console.log('❌ File was not created')
    }
    
  } catch (error) {
    console.log('❌ File output failed:', error.message)
  }
  
  // Test 3: Alternative method using COM
  console.log('\n🔄 Test 3: Alternative COM method')
  try {
    const comCommand = `powershell -ExecutionPolicy Bypass -Command "$voice = New-Object -ComObject SAPI.SpVoice; $voice.Speak('ChemQuest COM test')"`
    execSync(comCommand, { stdio: 'inherit' })
    console.log('✅ COM method works')
  } catch (error) {
    console.log('❌ COM method failed:', error.message)
  }
}

debugTTS()
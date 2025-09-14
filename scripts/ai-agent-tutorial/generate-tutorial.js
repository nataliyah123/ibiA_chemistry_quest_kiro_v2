#!/usr/bin/env node

import { TutorialVideoGenerator } from './src/index.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  console.log('🎬 ChemQuest AI Tutorial Video Generator')
  console.log('========================================')
  console.log('📹 Generating 2-minute gameplay tutorial...')
  console.log('')

  try {
    // Verify project structure
    const projectRoot = join(__dirname, '../../')
    const clientDir = join(projectRoot, 'client')
    const serverDir = join(projectRoot, 'server')

    if (!await fs.pathExists(clientDir) || !await fs.pathExists(serverDir)) {
      console.error('❌ Error: ChemQuest client and server directories not found!')
      console.error('   Make sure you are running this from the project root.')
      console.error(`   Looking for: ${clientDir}`)
      console.error(`   Looking for: ${serverDir}`)
      process.exit(1)
    }

    console.log('✅ ChemQuest project structure verified')
    console.log('')

    // Initialize and run the generator
    const generator = new TutorialVideoGenerator()

    console.log('🚀 Starting tutorial video generation...')
    console.log('   This process will take approximately 5-10 minutes.')
    console.log('   The system will:')
    console.log('   • Start ChemQuest servers')
    console.log('   • Launch AI agent for gameplay')
    console.log('   • Record 2 minutes of gameplay at 1080p/30fps')
    console.log('   • Generate narration audio')
    console.log('   • Process and optimize video for web')
    console.log('')

    const startTime = Date.now()
    const result = await generator.generateTutorialVideo()
    const endTime = Date.now()
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60)

    // Display success information
    console.log('')
    console.log('='.repeat(70))
    console.log('🎉 SUCCESS! ChemQuest tutorial video generated!')
    console.log('='.repeat(70))
    console.log('')
    console.log('📍 Video Locations:')
    console.log(`   📂 Primary Output: ${result.primaryOutput}`)
    console.log(`   🌐 Final Delivery: ${result.finalDelivery}`)
    console.log('')
    console.log(`⏱️  Generation Time: ${durationMinutes} minutes`)

    // Display video details
    if (result.stats && !result.stats.error) {
      console.log('')
      console.log('📊 Video Details:')
      console.log(`   • Duration: ${result.stats.duration}`)
      console.log(`   • Resolution: ${result.stats.resolution}`)
      console.log(`   • Frame Rate: ${result.stats.frameRate}`)
      console.log(`   • Format: ${result.stats.format}`)
      console.log(`   • File Size: ${result.stats.fileSize}`)
      console.log(`   • Web Optimized: ${result.stats.webOptimized ? '✅ Yes' : '❌ No'}`)

      console.log('')
      console.log('🎬 Video Timeline:')
      result.stats.segments.forEach(segment => {
        console.log(`   ${segment.time}: ${segment.name}`)
        console.log(`      ${segment.content}`)
      })
    }

    console.log('')
    console.log('🎯 What the video showcases:')
    console.log('   • ChemQuest platform overview and branding')
    console.log('   • Character creation and dashboard navigation')
    console.log('   • Mathmage Trials: Equation balancing with drag-and-drop')
    console.log('   • Memory Labyrinth: Flashcard matching games')
    console.log('   • Virtual Apprentice: Lab procedure simulations')
    console.log('   • Character progression: XP, levels, and badge unlocks')
    console.log('   • Smooth UI interactions and game animations')

    console.log('')
    console.log('🌐 Ready for:')
    console.log('   • Web embedding and streaming')
    console.log('   • Social media sharing (Twitter, LinkedIn, YouTube)')
    console.log('   • Educational presentations and demos')
    console.log('   • Marketing materials and landing pages')
    console.log('   • Investor pitches and product showcases')

    console.log('')
    console.log('✨ Your ChemQuest tutorial video is ready to share with the world!')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('💥 FAILED to generate tutorial video:')
    console.error('❌ Error:', error.message)

    if (error.stack) {
      console.error('')
      console.error('📋 Stack trace:')
      console.error(error.stack)
    }

    console.error('')
    console.error('🔧 Troubleshooting tips:')
    console.error('   • Ensure ChemQuest servers can start:')
    console.error('     - cd client && npm install && npm run dev')
    console.error('     - cd server && npm install && npm run dev')
    console.error('   • Check that all dependencies are installed:')
    console.error('     - npm install in this directory')
    console.error('   • Verify FFmpeg is available on your system')
    console.error('   • Make sure you have sufficient disk space (>2GB recommended)')
    console.error('   • Close other applications to free up system resources')
    console.error('   • Try running with administrator/sudo privileges if needed')
    console.error('')
    console.error('📧 If issues persist, check the logs in ./videos/logs/')

    process.exit(1)
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('')
  console.log('')
  console.log('⏹️  Tutorial generation interrupted by user')
  console.log('🧹 Cleaning up processes...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('')
  console.log('')
  console.log('⏹️  Tutorial generation terminated')
  console.log('🧹 Cleaning up processes...')
  process.exit(0)
})

// Run the main function
main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
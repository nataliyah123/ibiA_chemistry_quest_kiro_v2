#!/usr/bin/env node

/**
 * ChemQuest Video Generator Runner
 * 
 * This script helps run the video generator with the correct configuration
 * for different development setups.
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SETUPS = {
  docker: {
    url: 'http://localhost:3000',
    description: 'Docker development setup (docker-compose.dev.yml)'
  },
  vite: {
    url: 'http://localhost:5173',
    description: 'Local Vite development server'
  },
  production: {
    url: 'http://localhost:80',
    description: 'Docker production setup'
  }
}

function showHelp() {
  console.log('🎬 ChemQuest Video Generator')
  console.log('')
  console.log('Usage:')
  console.log('  node run-video-generator.js [setup]')
  console.log('')
  console.log('Available setups:')
  Object.entries(SETUPS).forEach(([key, config]) => {
    console.log(`  ${key.padEnd(12)} - ${config.description} (${config.url})`)
  })
  console.log('')
  console.log('Examples:')
  console.log('  node run-video-generator.js docker    # Use Docker dev setup (recommended)')
  console.log('  node run-video-generator.js vite      # Use local Vite server')
  console.log('  node run-video-generator.js --url=http://localhost:8080  # Custom URL')
  console.log('')
}

function runGenerator(url) {
  console.log(`🚀 Starting video generator with URL: ${url}`)
  console.log('📋 Make sure your ChemQuest application is running at this URL!')
  console.log('')

  const generatorScript = path.join(__dirname, 'src', 'index.js')
  const args = url ? [`--url=${url}`] : []

  const child = spawn('node', [generatorScript, ...args], {
    stdio: 'inherit',
    cwd: __dirname
  })

  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Video generation completed successfully!')
    } else {
      console.log(`\n❌ Video generation failed with code ${code}`)
      process.exit(code)
    }
  })

  child.on('error', (error) => {
    console.error('❌ Failed to start video generator:', error.message)
    process.exit(1)
  })
}

// Main execution
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  const setup = args[0]

  // Check for custom URL
  if (setup.startsWith('--url=')) {
    const customUrl = setup.split('=')[1]
    runGenerator(customUrl)
    return
  }

  // Check for predefined setup
  if (SETUPS[setup]) {
    console.log(`🔧 Using ${setup} setup: ${SETUPS[setup].description}`)
    runGenerator(SETUPS[setup].url)
    return
  }

  console.error(`❌ Unknown setup: ${setup}`)
  console.log('')
  showHelp()
  process.exit(1)
}

main()
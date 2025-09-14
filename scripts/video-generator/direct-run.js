#!/usr/bin/env node

/**
 * Direct runner for video generator - bypasses the runner script
 */

import ChemQuestVideoGenerator from './src/index.js'

async function runDirectly() {
  console.log('🎬 Running video generator directly')
  
  const generator = new ChemQuestVideoGenerator({
    appUrl: 'http://localhost:3000'
  })
  
  try {
    console.log('🚀 Starting video generation...')
    await generator.generateTutorialVideo()
    await generator.cleanup()
    
    console.log('\n🎉 SUCCESS!')
    console.log('📁 Video should be ready!')
    
  } catch (error) {
    console.error('\n❌ FAILED!')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

runDirectly()
#!/usr/bin/env node

console.log('🎬 Simple test script started')
console.log('📋 Process arguments:', process.argv)
console.log('📁 Current directory:', process.cwd())
console.log('🔗 Import meta URL:', import.meta.url)

// Test if we can import the generator
try {
  const { default: ChemQuestVideoGenerator } = await import('./src/index.js')
  console.log('✅ Successfully imported ChemQuestVideoGenerator')
  
  const generator = new ChemQuestVideoGenerator({
    appUrl: 'http://localhost:3000'
  })
  
  console.log('✅ Generator created successfully')
  console.log('🔧 Config:', generator.config)
  
} catch (error) {
  console.error('❌ Error:', error.message)
  console.error('Stack:', error.stack)
}
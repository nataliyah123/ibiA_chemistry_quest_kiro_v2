#!/usr/bin/env node

/**
 * Test script to verify ChemQuest is accessible before generating video
 */

import puppeteer from 'puppeteer'

async function testConnection(url = 'http://localhost:3000') {
  console.log(`🔍 Testing connection to: ${url}`)
  
  let browser
  try {
    console.log('🚀 Launching browser...')
    browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    })
    
    const page = await browser.newPage()
    
    // Set a user agent to avoid potential blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    console.log('⏳ Attempting to load page...')
    
    // Try with different wait conditions
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    })
    
    console.log(`📊 Response status: ${response.status()}`)
    console.log(`📊 Response URL: ${response.url()}`)
    
    if (response.status() >= 400) {
      throw new Error(`HTTP ${response.status()}: ${response.statusText()}`)
    }
    
    // Wait a bit more for the page to load
    await page.waitForTimeout(2000)
    
    console.log('✅ Successfully connected to ChemQuest!')
    console.log('🎬 You can now run the video generator')
    
    const title = await page.title()
    console.log(`📄 Page title: ${title}`)
    
    // Check if there's any content
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 100))
    console.log(`📝 Page content preview: ${bodyText}...`)
    
  } catch (error) {
    console.error('❌ Connection failed!')
    console.error(`Error: ${error.message}`)
    
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('\n🔧 Connection refused - the service might not be running')
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 Timeout - the service might be slow to respond')
    } else if (error.message.includes('net::ERR_EMPTY_RESPONSE')) {
      console.log('\n🔧 Empty response - the service might be starting up')
    }
    
    console.log('\n🔧 Troubleshooting steps:')
    console.log('1. Check if Docker containers are running:')
    console.log('   docker ps')
    console.log('2. Check container logs:')
    console.log('   docker logs chemquest-client-dev')
    console.log('3. Try accessing in your browser:')
    console.log(`   ${url}`)
    console.log('4. Wait 30 seconds and try again (services might be starting)')
    
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const url = args[0] || 'http://localhost:3000'

testConnection(url)
#!/usr/bin/env node

import puppeteer from 'puppeteer'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// Narration script with timestamps
const narrationScript = [
  { time: 0, text: "Welcome to ChemQuest: Alchemist Academy! Watch our AI agent demonstrate how chemistry learning becomes an epic adventure." },
  { time: 8, text: "The AI agent starts by logging into the system, entering credentials to access the learning platform." },
  { time: 20, text: "Here we see the character progression system, where students earn experience points and level up through gameplay." },
  { time: 35, text: "ChemQuest features multiple learning realms, each targeting different chemistry concepts and skills." },
  { time: 45, text: "The AI agent selects the Mathmage Trials realm to demonstrate equation balancing gameplay." },
  { time: 60, text: "Watch as the AI agent solves a chemical equation by determining the correct coefficients step by step." },
  { time: 75, text: "The system provides immediate feedback and rewards the agent with experience points for correct answers." },
  { time: 90, text: "Next, the AI demonstrates flashcard matching, connecting chemical formulas with their common names." },
  { time: 105, text: "The analytics dashboard updates in real-time, tracking accuracy, speed, and achievement progress." },
  { time: 115, text: "ChemQuest combines AI-powered gameplay with proven educational techniques for effective chemistry learning!" }
]

async function generateNarratedDemo() {
  console.log('🎬 Starting ChemQuest Narrated Demo Video Generator')
  console.log('🎙️ This version includes voice narration and captions')
  
  const outputDir = path.join(__dirname, '../../videos')
  const tempDir = path.join(outputDir, 'temp')
  const finalDir = path.join(outputDir, 'final')
  
  // Create directories
  await fs.ensureDir(outputDir)
  await fs.ensureDir(tempDir)
  await fs.ensureDir(finalDir)
  
  console.log('📁 Directories created')
  
  let browser
  try {
    // Launch browser
    console.log('🚀 Launching browser...')
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    console.log('✅ Browser launched')
    
    // Navigate to ChemQuest
    console.log('🌐 Navigating to ChemQuest...')
    try {
      await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      })
      console.log('✅ ChemQuest loaded')
    } catch (error) {
      console.log('⚠️ ChemQuest not accessible, creating demo page...')
      await createDemoPage(page)
    }
    
    // Generate captions file
    await generateCaptionsFile(tempDir)
    
    // Start recording with narration
    console.log('🔴 Starting recording with narration...')
    let frameCount = 0
    const screenshotInterval = 500 // Take screenshot every 500ms
    
    const takeScreenshot = async () => {
      try {
        const framePath = path.join(tempDir, `frame-${String(frameCount).padStart(6, '0')}.png`)
        await page.screenshot({ 
          path: framePath,
          fullPage: false,
          type: 'png'
        })
        frameCount++
      } catch (error) {
        console.log('⚠️ Screenshot error:', error.message)
      }
    }
    
    // Start screenshot interval
    const screenshotTimer = setInterval(takeScreenshot, screenshotInterval)
    
    // Perform narrated demo
    await performNarratedDemo(page)
    
    // Stop recording
    console.log('⏹️ Stopping recording...')
    clearInterval(screenshotTimer)
    await takeScreenshot() // Final screenshot
    
    console.log(`✅ Recording completed - ${frameCount} frames captured`)
    
    // Generate audio narration
    await generateAudioNarration(tempDir)
    
    // Process video with narration and captions
    await processVideoWithAudio(tempDir, finalDir, frameCount)
    
    // Cleanup temp files
    try {
      await fs.remove(tempDir)
      console.log('🧹 Cleanup completed')
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message)
    }
    
    console.log('\n🎉 SUCCESS!')
    console.log('📁 Narrated ChemQuest demo video created!')
    console.log(`📍 Location: ${path.join(finalDir, 'chemquest-narrated-demo.mp4')}`)
    console.log('📊 Video specs: 1920x1080, 30fps, 2 minutes, with voice and captions')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function createDemoPage(page) {
  const demoHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>ChemQuest: Alchemist Academy Demo</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 2rem;
                color: white;
                min-height: 100vh;
            }
            .header {
                text-align: center;
                margin-bottom: 3rem;
            }
            .header h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .demo-section {
                background: rgba(255,255,255,0.1);
                border-radius: 15px;
                padding: 2rem;
                margin: 2rem 0;
                backdrop-filter: blur(10px);
            }
            .character-profile {
                display: flex;
                align-items: center;
                gap: 2rem;
            }
            .avatar {
                width: 100px;
                height: 100px;
                background: linear-gradient(45deg, #ff6b6b, #feca57);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
            }
            .progress-bar {
                background: rgba(0,0,0,0.2);
                border-radius: 10px;
                height: 20px;
                overflow: hidden;
                margin: 1rem 0;
            }
            .progress-fill {
                background: linear-gradient(90deg, #00d2ff, #3a7bd5);
                height: 100%;
                width: 75%;
                border-radius: 10px;
                animation: pulse 2s infinite;
            }
            .game-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin: 2rem 0;
            }
            .game-card {
                background: rgba(255,255,255,0.15);
                border-radius: 10px;
                padding: 1.5rem;
                text-align: center;
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            .game-card:hover {
                transform: translateY(-5px);
            }
            .equation {
                font-family: 'Courier New', monospace;
                font-size: 1.4rem;
                background: rgba(0,0,0,0.2);
                padding: 1rem;
                border-radius: 5px;
                margin: 1rem 0;
                text-align: center;
            }
            .coefficient-input {
                width: 60px;
                height: 40px;
                font-size: 1.2rem;
                text-align: center;
                border: 2px solid #ccc;
                border-radius: 5px;
                margin: 0 5px;
                background: rgba(255,255,255,0.9);
                color: #333;
            }
            .coefficient-input:focus {
                border-color: #00ff00;
                box-shadow: 0 0 10px rgba(0,255,0,0.3);
            }
            .submit-btn {
                background: linear-gradient(45deg, #00d2ff, #3a7bd5);
                border: none;
                color: white;
                padding: 12px 24px;
                font-size: 1.1rem;
                border-radius: 25px;
                cursor: pointer;
                margin: 1rem 0;
                transition: transform 0.2s ease;
            }
            .submit-btn:hover {
                transform: scale(1.05);
            }
            .flashcard-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1rem;
                margin: 1rem 0;
            }
            .flashcard {
                background: rgba(255,255,255,0.2);
                border-radius: 10px;
                padding: 1.5rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                min-height: 80px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.1rem;
            }
            .flashcard:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.05);
            }
            .flashcard.flipped {
                background: rgba(0,255,0,0.3);
                border: 2px solid #00ff00;
            }
            .ai-cursor {
                position: absolute;
                width: 20px;
                height: 20px;
                background: #ff0000;
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                transition: all 0.3s ease;
                box-shadow: 0 0 10px rgba(255,0,0,0.5);
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            .floating {
                animation: float 3s ease-in-out infinite;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            @keyframes typing {
                from { width: 0; }
                to { width: 100%; }
            }
            .typing-effect {
                overflow: hidden;
                white-space: nowrap;
                animation: typing 2s steps(20, end);
            }
        </style>
    </head>
    <body>
        <div id="ai-cursor" class="ai-cursor" style="display: none;"></div>
        
        <div class="header">
            <h1 class="floating">🧪 ChemQuest: Alchemist Academy</h1>
            <p style="font-size: 1.3rem;">AI Agent Demonstration</p>
        </div>
        
        <div class="demo-section" id="login-section">
            <h2>🔐 Login System</h2>
            <div style="display: flex; gap: 1rem; align-items: center;">
                <input type="email" id="email-input" placeholder="Enter email..." style="padding: 10px; border-radius: 5px; border: none; width: 250px;">
                <input type="password" id="password-input" placeholder="Enter password..." style="padding: 10px; border-radius: 5px; border: none; width: 250px;">
                <button class="submit-btn" id="login-btn">Login</button>
            </div>
        </div>
        
        <div class="demo-section" id="character-section">
            <h2>👤 Character Profile</h2>
            <div class="character-profile">
                <div class="avatar" id="character-avatar">🧙‍♂️</div>
                <div>
                    <h3 id="character-name">Alchemist Apprentice</h3>
                    <p id="character-level">Level 15 • 2,450 XP</p>
                    <div class="progress-bar">
                        <div class="progress-fill" id="xp-progress"></div>
                    </div>
                    <p id="progress-text">Progress to Level 16: 75%</p>
                </div>
            </div>
        </div>
        
        <div class="demo-section" id="realms-section">
            <h2>🏰 Learning Realms</h2>
            <div class="game-grid">
                <div class="game-card" id="mathmage-card">
                    <h3>⚔️ Mathmage Trials</h3>
                    <p>Master equation balancing</p>
                </div>
                <div class="game-card" id="memory-card">
                    <h3>🧩 Memory Labyrinth</h3>
                    <p>Learn through flashcards</p>
                </div>
                <div class="game-card" id="apprentice-card">
                    <h3>🔬 Virtual Apprentice</h3>
                    <p>Practice lab procedures</p>
                </div>
            </div>
        </div>
        
        <div class="demo-section" id="equation-section">
            <h2>⚔️ Equation Duels - AI Agent Playing</h2>
            <p>Watch the AI agent balance this chemical equation:</p>
            <div class="equation" id="current-equation">
                <span id="coeff1">__</span>CH₄ + <span id="coeff2">__</span>O₂ → <span id="coeff3">__</span>CO₂ + <span id="coeff4">__</span>H₂O
            </div>
            <div style="text-align: center; margin: 1rem 0;">
                <input type="number" class="coefficient-input" id="input1" placeholder="?">
                <input type="number" class="coefficient-input" id="input2" placeholder="?">
                <input type="number" class="coefficient-input" id="input3" placeholder="?">
                <input type="number" class="coefficient-input" id="input4" placeholder="?">
            </div>
            <div style="text-align: center;">
                <button class="submit-btn" id="check-equation">Check Answer</button>
            </div>
            <div id="equation-feedback" style="text-align: center; margin-top: 1rem; font-size: 1.2rem;"></div>
        </div>
        
        <div class="demo-section" id="flashcard-section">
            <h2>🃏 Flashcard Match - AI Agent Playing</h2>
            <p>Watch the AI agent match chemical formulas with their names:</p>
            <div class="flashcard-grid">
                <div class="flashcard" data-pair="1" data-type="formula">H₂O</div>
                <div class="flashcard" data-pair="2" data-type="name">Sodium Chloride</div>
                <div class="flashcard" data-pair="1" data-type="name">Water</div>
                <div class="flashcard" data-pair="3" data-type="formula">CO₂</div>
                <div class="flashcard" data-pair="2" data-type="formula">NaCl</div>
                <div class="flashcard" data-pair="4" data-type="name">Methane</div>
                <div class="flashcard" data-pair="3" data-type="name">Carbon Dioxide</div>
                <div class="flashcard" data-pair="4" data-type="formula">CH₄</div>
            </div>
            <div id="flashcard-feedback" style="text-align: center; margin-top: 1rem; font-size: 1.2rem;"></div>
        </div>
        
        <div class="demo-section" id="analytics-section">
            <h2>📊 Progress Analytics</h2>
            <div id="stats-display">
                <p>🎯 Accuracy: <span id="accuracy">87%</span> | ⚡ Speed: <span id="speed">45 sec avg</span> | 🏆 Achievements: <span id="achievements">12/20</span></p>
                <div class="progress-bar">
                    <div class="progress-fill" id="accuracy-bar" style="width: 87%;"></div>
                </div>
            </div>
        </div>
        
        <script>
            // AI Agent simulation functions
            let aiCursor = document.getElementById('ai-cursor');
            
            function showAICursor() {
                aiCursor.style.display = 'block';
            }
            
            function hideAICursor() {
                aiCursor.style.display = 'none';
            }
            
            function moveAICursor(x, y) {
                aiCursor.style.left = x + 'px';
                aiCursor.style.top = y + 'px';
            }
            
            function getElementCenter(element) {
                const rect = element.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
            
            async function aiTypeInField(element, text, delay = 200) {
                const center = getElementCenter(element);
                moveAICursor(center.x, center.y);
                element.focus();
                
                for (let char of text) {
                    element.value += char;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            async function aiClickElement(element) {
                const center = getElementCenter(element);
                moveAICursor(center.x, center.y);
                await new Promise(resolve => setTimeout(resolve, 500));
                element.click();
            }
            
            // Make functions globally available
            window.aiAgent = {
                showCursor: showAICursor,
                hideCursor: hideAICursor,
                moveCursor: moveAICursor,
                typeInField: aiTypeInField,
                clickElement: aiClickElement,
                getElementCenter: getElementCenter
            };
        </script>
    </body>
    </html>
  `
  
  await page.goto(`data:text/html,${encodeURIComponent(demoHTML)}`)
}

async function performNarratedDemo(page) {
  console.log('🎮 Starting 2-minute narrated demo...')
  
  const startTime = Date.now()
  let currentNarrationIndex = 0
  
  // Schedule narration display
  const narrationTimer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000
    
    if (currentNarrationIndex < narrationScript.length) {
      const currentNarration = narrationScript[currentNarrationIndex]
      
      if (elapsed >= currentNarration.time) {
        console.log(`🎙️ [${elapsed.toFixed(1)}s] "${currentNarration.text}"`)
        
        // Add caption overlay to page
        page.evaluate((text) => {
          // Remove existing caption
          const existingCaption = document.getElementById('demo-caption')
          if (existingCaption) {
            existingCaption.remove()
          }
          
          // Add new caption
          const caption = document.createElement('div')
          caption.id = 'demo-caption'
          caption.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 18px;
            font-family: Arial, sans-serif;
            max-width: 80%;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          `
          caption.textContent = text
          document.body.appendChild(caption)
          
          // Remove caption after 6 seconds
          setTimeout(() => {
            if (caption.parentNode) {
              caption.parentNode.removeChild(caption)
            }
          }, 6000)
        }, currentNarration.text)
        
        currentNarrationIndex++
      }
    }
  }, 1000)
  
  // Perform demo actions synchronized with narration
  try {
    // 0-8s: Introduction
    await page.waitForTimeout(8000)
    
    // 8-20s: AI Agent Login demonstration
    console.log('🤖 AI Agent: Performing login...')
    await page.evaluate(() => {
      if (window.aiAgent) {
        window.aiAgent.showCursor()
      } else {
        console.log('AI Agent functions not available, using fallback')
      }
    })
    
    // AI types email
    await page.evaluate(async () => {
      const emailInput = document.getElementById('email-input')
      if (emailInput && window.aiAgent) {
        await window.aiAgent.typeInField(emailInput, 'ai.agent@chemquest.com', 150)
      } else {
        // Fallback if aiAgent is not available
        if (emailInput) {
          emailInput.focus()
          emailInput.value = 'ai.agent@chemquest.com'
          emailInput.style.border = '3px solid #00ff00'
        }
      }
    })
    await page.waitForTimeout(3000)
    
    // AI types password
    await page.evaluate(async () => {
      const passwordInput = document.getElementById('password-input')
      if (passwordInput && window.aiAgent) {
        await window.aiAgent.typeInField(passwordInput, 'demo123', 150)
      } else {
        // Fallback if aiAgent is not available
        if (passwordInput) {
          passwordInput.focus()
          passwordInput.value = 'demo123'
          passwordInput.style.border = '3px solid #00ff00'
        }
      }
    })
    await page.waitForTimeout(2000)
    
    // AI clicks login button
    await page.evaluate(async () => {
      const loginBtn = document.getElementById('login-btn')
      if (loginBtn && window.aiAgent) {
        await window.aiAgent.clickElement(loginBtn)
      } else {
        // Fallback if aiAgent is not available
        if (loginBtn) {
          loginBtn.style.background = 'rgba(255,0,0,0.3)'
          loginBtn.click()
          loginBtn.style.background = 'rgba(0,255,0,0.3)'
        }
      }
    })
    await page.waitForTimeout(7000)
    
    // 20-35s: Character progression animation
    console.log('🤖 AI Agent: Viewing character progression...')
    await page.evaluate(() => {
      const avatar = document.getElementById('character-avatar')
      if (avatar) {
        avatar.style.transform = 'scale(1.2) rotate(360deg)'
        avatar.style.transition = 'transform 2s ease'
      }
      
      // Animate XP gain
      const xpProgress = document.getElementById('xp-progress')
      if (xpProgress) {
        xpProgress.style.width = '95%'
        xpProgress.style.transition = 'width 3s ease'
      }
      
      // Update level text
      setTimeout(() => {
        const levelText = document.getElementById('character-level')
        if (levelText) {
          levelText.textContent = 'Level 16 • 2,850 XP (+400 XP!)'
          levelText.style.color = '#00ff00'
        }
      }, 2000)
    })
    await page.waitForTimeout(15000)
    
    // 35-45s: Realm navigation
    console.log('🤖 AI Agent: Exploring realms...')
    await page.evaluate(async () => {
      const mathmageCard = document.getElementById('mathmage-card')
      if (mathmageCard) {
        await window.aiAgent.clickElement(mathmageCard)
        mathmageCard.style.background = 'rgba(255,215,0,0.3)'
        mathmageCard.style.border = '3px solid gold'
        mathmageCard.style.transform = 'scale(1.1)'
      }
    })
    await page.waitForTimeout(10000)
    
    // 45-75s: AI Agent plays Equation Duels
    console.log('🤖 AI Agent: Playing Equation Duels...')
    await page.evaluate(() => {
      // Scroll to equation section
      document.getElementById('equation-section').scrollIntoView({ behavior: 'smooth' })
    })
    await page.waitForTimeout(2000)
    
    // AI solves the equation step by step
    const coefficients = [1, 2, 1, 2] // Correct answer for CH4 + 2O2 -> CO2 + 2H2O
    
    for (let i = 0; i < coefficients.length; i++) {
      await page.evaluate(async (index, value) => {
        const input = document.getElementById(`input${index + 1}`)
        if (input) {
          // Move cursor to input
          const center = window.aiAgent.getElementCenter(input)
          window.aiAgent.moveCursor(center.x, center.y)
          
          // Highlight input
          input.style.border = '3px solid #ff0000'
          input.focus()
          
          // Type the coefficient
          await new Promise(resolve => setTimeout(resolve, 1000))
          input.value = value.toString()
          input.style.border = '3px solid #00ff00'
          
          // Update equation display
          document.getElementById(`coeff${index + 1}`).textContent = value
          document.getElementById(`coeff${index + 1}`).style.color = '#00ff00'
          document.getElementById(`coeff${index + 1}`).style.fontWeight = 'bold'
        }
      }, i, coefficients[i])
      
      await page.waitForTimeout(3000)
    }
    
    // AI clicks check answer
    await page.evaluate(async () => {
      const checkBtn = document.getElementById('check-equation')
      if (checkBtn) {
        await window.aiAgent.clickElement(checkBtn)
        
        // Show success feedback
        setTimeout(() => {
          const feedback = document.getElementById('equation-feedback')
          if (feedback) {
            feedback.innerHTML = '🎉 Correct! +50 XP earned!'
            feedback.style.color = '#00ff00'
            feedback.style.fontSize = '1.5rem'
            feedback.style.fontWeight = 'bold'
          }
          
          // Animate equation success
          const equation = document.getElementById('current-equation')
          if (equation) {
            equation.style.background = 'rgba(0,255,0,0.3)'
            equation.style.border = '3px solid #00ff00'
          }
        }, 1000)
      }
    })
    await page.waitForTimeout(15000)
    
    // 75-90s: AI Agent plays Flashcard Match
    console.log('🤖 AI Agent: Playing Flashcard Match...')
    await page.evaluate(() => {
      document.getElementById('flashcard-section').scrollIntoView({ behavior: 'smooth' })
    })
    await page.waitForTimeout(2000)
    
    // AI matches flashcards
    const pairs = [
      { first: '[data-pair="1"][data-type="formula"]', second: '[data-pair="1"][data-type="name"]' },
      { first: '[data-pair="2"][data-type="formula"]', second: '[data-pair="2"][data-type="name"]' }
    ]
    
    for (const pair of pairs) {
      await page.evaluate(async (pairData) => {
        const first = document.querySelector(pairData.first)
        const second = document.querySelector(pairData.second)
        
        if (first && second) {
          // Click first card
          await window.aiAgent.clickElement(first)
          first.classList.add('flipped')
          first.style.background = 'rgba(255,255,0,0.3)'
          
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Click second card
          await window.aiAgent.clickElement(second)
          second.classList.add('flipped')
          second.style.background = 'rgba(0,255,0,0.3)'
          
          // Show match success
          setTimeout(() => {
            first.style.background = 'rgba(0,255,0,0.4)'
            second.style.background = 'rgba(0,255,0,0.4)'
            first.style.border = '2px solid #00ff00'
            second.style.border = '2px solid #00ff00'
          }, 1000)
        }
      }, pair)
      
      await page.waitForTimeout(4000)
    }
    
    await page.evaluate(() => {
      const feedback = document.getElementById('flashcard-feedback')
      if (feedback) {
        feedback.innerHTML = '🎯 Perfect Match! +30 XP earned!'
        feedback.style.color = '#00ff00'
        feedback.style.fontSize = '1.3rem'
        feedback.style.fontWeight = 'bold'
      }
    })
    await page.waitForTimeout(15000)
    
    // 90-105s: Analytics dashboard update
    console.log('🤖 AI Agent: Viewing updated analytics...')
    await page.evaluate(() => {
      document.getElementById('analytics-section').scrollIntoView({ behavior: 'smooth' })
      
      // Update stats
      document.getElementById('accuracy').textContent = '92%'
      document.getElementById('speed').textContent = '38 sec avg'
      document.getElementById('achievements').textContent = '14/20'
      
      // Animate accuracy bar
      const accuracyBar = document.getElementById('accuracy-bar')
      if (accuracyBar) {
        accuracyBar.style.width = '92%'
        accuracyBar.style.transition = 'width 2s ease'
      }
      
      // Highlight improvements
      const statsDisplay = document.getElementById('stats-display')
      if (statsDisplay) {
        statsDisplay.style.background = 'rgba(0,255,0,0.1)'
        statsDisplay.style.border = '2px solid #00ff00'
        statsDisplay.style.borderRadius = '10px'
        statsDisplay.style.padding = '1rem'
      }
    })
    await page.waitForTimeout(15000)
    
    // 105-120s: Conclusion with AI cursor hide
    console.log('🤖 AI Agent: Demo complete!')
    await page.evaluate(() => {
      window.aiAgent.hideCursor()
      
      const header = document.querySelector('.header h1')
      if (header) {
        header.style.animation = 'float 1s ease-in-out infinite'
        header.style.color = '#ffd700'
        header.style.textShadow = '0 0 20px rgba(255,215,0,0.8)'
      }
      
      // Add completion message
      const completionMsg = document.createElement('div')
      completionMsg.innerHTML = '🎉 AI Agent Demo Complete! 🎉'
      completionMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: #00ff00;
        padding: 2rem;
        border-radius: 20px;
        font-size: 2rem;
        font-weight: bold;
        text-align: center;
        z-index: 10001;
        border: 3px solid #00ff00;
        box-shadow: 0 0 30px rgba(0,255,0,0.5);
      `
      document.body.appendChild(completionMsg)
      
      setTimeout(() => {
        if (completionMsg.parentNode) {
          completionMsg.parentNode.removeChild(completionMsg)
        }
      }, 5000)
    })
    await page.waitForTimeout(15000)
    
  } catch (error) {
    console.log('⚠️ Demo action error:', error.message)
  }
  
  clearInterval(narrationTimer)
  console.log('✅ Narrated demo completed')
}

async function generateCaptionsFile(tempDir) {
  console.log('📝 Generating captions file...')
  
  let srtContent = ''
  
  narrationScript.forEach((item, index) => {
    const startTime = item.time
    const endTime = index < narrationScript.length - 1 ? narrationScript[index + 1].time : 120
    
    srtContent += `${index + 1}\n`
    srtContent += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`
    srtContent += `${item.text}\n\n`
  })
  
  await fs.writeFile(path.join(tempDir, 'captions.srt'), srtContent)
  console.log('✅ Captions file generated')
}

function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

async function generateAudioNarration(tempDir) {
  console.log('🎙️ Generating audio narration using built-in TTS...')
  
  try {
    // Install say package if not available (cross-platform TTS)
    const { execSync } = await import('child_process')
    
    // Create individual audio files for each narration segment
    const audioFiles = []
    
    for (let i = 0; i < narrationScript.length; i++) {
      const segment = narrationScript[i]
      const audioFileName = `narration_${String(i).padStart(2, '0')}.wav`
      const audioPath = path.join(tempDir, audioFileName)
      
      console.log(`🎤 Generating audio for segment ${i + 1}: "${segment.text.substring(0, 50)}..."`)
      
      try {
        // Try different TTS approaches based on platform
        if (process.platform === 'win32') {
          // Windows: Use PowerShell with SAPI
          const psScript = `
            Add-Type -AssemblyName System.Speech
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
            $synth.SetOutputToWaveFile("${audioPath.replace(/\\/g, '\\\\')}")
            $synth.Speak("${segment.text.replace(/"/g, '\\"')}")
            $synth.Dispose()
          `
          execSync(`powershell -ExecutionPolicy Bypass -Command "${psScript}"`, { stdio: 'pipe' })
        } else if (process.platform === 'darwin') {
          // macOS: Use say command
          execSync(`say "${segment.text}" -o "${audioPath}" --data-format=LEF32@22050`, { stdio: 'pipe' })
        } else {
          // Linux: Use espeak or festival
          try {
            execSync(`espeak "${segment.text}" -w "${audioPath}"`, { stdio: 'pipe' })
          } catch (error) {
            console.log('⚠️ espeak not found, trying festival...')
            execSync(`echo "${segment.text}" | text2wave -o "${audioPath}"`, { stdio: 'pipe' })
          }
        }
        
        audioFiles.push({ time: segment.time, file: audioPath })
        console.log(`✅ Generated audio segment ${i + 1}`)
        
      } catch (error) {
        console.log(`⚠️ Failed to generate audio for segment ${i + 1}: ${error.message}`)
        // Create a silent audio file as fallback
        await createSilentAudio(audioPath, 5) // 5 seconds of silence
        audioFiles.push({ time: segment.time, file: audioPath })
      }
    }
    
    // Create a combined audio file with proper timing
    await combineAudioSegments(audioFiles, path.join(tempDir, 'narration.wav'))
    
    console.log('✅ Audio narration generated successfully')
    
  } catch (error) {
    console.log('⚠️ Audio generation failed:', error.message)
    console.log('📝 Creating silent audio track as fallback...')
    await createSilentAudio(path.join(tempDir, 'narration.wav'), 120) // 2 minutes of silence
  }
}

async function createSilentAudio(outputPath, durationSeconds) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=channel_layout=stereo:sample_rate=44100')
      .inputOptions(['-f lavfi'])
      .audioCodec('pcm_s16le')
      .duration(durationSeconds)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath)
  })
}

async function combineAudioSegments(audioFiles, outputPath) {
  console.log('🎵 Combining audio segments with proper timing...')
  
  return new Promise((resolve, reject) => {
    let ffmpegCommand = ffmpeg()
    
    // Add silent base track (2 minutes)
    ffmpegCommand = ffmpegCommand
      .input('anullsrc=channel_layout=stereo:sample_rate=44100')
      .inputOptions(['-f lavfi', '-t 120'])
    
    // Add each audio segment at the correct time
    audioFiles.forEach((audioFile, index) => {
      ffmpegCommand = ffmpegCommand.input(audioFile.file)
    })
    
    // Create filter complex to overlay audio at correct times
    let filterComplex = '[0:a]'
    audioFiles.forEach((audioFile, index) => {
      const inputIndex = index + 1
      filterComplex += `[${inputIndex}:a]adelay=${audioFile.time * 1000}|${audioFile.time * 1000}[a${inputIndex}];`
    })
    
    // Mix all audio streams
    filterComplex += '[0:a]'
    audioFiles.forEach((audioFile, index) => {
      filterComplex += `[a${index + 1}]`
    })
    filterComplex += `amix=inputs=${audioFiles.length + 1}:duration=longest[out]`
    
    ffmpegCommand
      .complexFilter(filterComplex)
      .outputOptions(['-map [out]'])
      .audioCodec('pcm_s16le')
      .on('start', () => console.log('🔄 Combining audio segments...'))
      .on('end', () => {
        console.log('✅ Audio segments combined successfully')
        resolve()
      })
      .on('error', (err) => {
        console.log('⚠️ Audio combination failed:', err.message)
        reject(err)
      })
      .save(outputPath)
  })
}

async function processVideoWithAudio(tempDir, finalDir, frameCount) {
  console.log('🎞️ Processing video with audio and captions...')
  
  const inputPattern = path.join(tempDir, 'frame-%06d.png')
  const captionsPath = path.join(tempDir, 'captions.srt')
  const audioPath = path.join(tempDir, 'narration.wav')
  const outputPath = path.join(finalDir, 'chemquest-narrated-demo.mp4')
  
  return new Promise((resolve, reject) => {
    let ffmpegCommand = ffmpeg(inputPattern)
      .inputFPS(2) // 2 fps input (screenshots every 500ms)
      .videoCodec('libx264')
      .size('1920x1080')
      .fps(30) // 30 fps output
      .videoBitrate('2000k')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
        '-t 120' // Exactly 2 minutes
      ])
    
    // Add audio if file exists
    if (fs.existsSync(audioPath)) {
      console.log('🎵 Adding audio narration to video...')
      ffmpegCommand = ffmpegCommand
        .input(audioPath)
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions(['-shortest']) // Match video duration
    } else {
      console.log('⚠️ No audio file found, creating video without narration')
    }
    
    // Add captions if file exists
    if (fs.existsSync(captionsPath)) {
      console.log('📝 Adding captions to video...')
      ffmpegCommand = ffmpegCommand
        .input(captionsPath)
        .outputOptions([
          '-c:s mov_text', // Subtitle codec
          '-metadata:s:s:0 language=eng'
        ])
    }
    
    ffmpegCommand
      .on('start', (commandLine) => {
        console.log('🔄 FFmpeg processing started...')
        console.log(`Command: ${commandLine}`)
      })
      .on('progress', (progress) => {
        console.log(`⏳ Processing: ${Math.round(progress.percent || 0)}%`)
      })
      .on('end', () => {
        console.log('✅ Video processing completed')
        console.log(`📁 Final video: ${outputPath}`)
        console.log('🎬 Features: HD video, AI agent gameplay, captions' + (fs.existsSync(audioPath) ? ', voice narration' : ''))
        resolve()
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message)
        reject(err)
      })
      .save(outputPath)
  })
}

generateNarratedDemo()
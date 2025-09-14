import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin())

export class GameplayAgent {
  constructor(logger) {
    this.logger = logger
    this.browser = null
    this.page = null
    this.baseUrl = 'http://localhost:5173'
    this.gameplayTimeline = this.createGameplayTimeline()
  }

  createGameplayTimeline() {
    // Exact 2-minute timeline as specified
    return [
      { 
        segment: 'intro', 
        startTime: 0, 
        duration: 15,
        description: 'ChemQuest logo + "Welcome to ChemQuest: Alchemist Academy"'
      },
      { 
        segment: 'character_creation', 
        startTime: 15, 
        duration: 10,
        description: 'Quick character setup and dashboard overview'
      },
      { 
        segment: 'mathmage_trials', 
        startTime: 25, 
        duration: 25,
        description: 'Equation Duels gameplay demonstration'
      },
      { 
        segment: 'memory_labyrinth', 
        startTime: 50, 
        duration: 25,
        description: 'Flashcard Match game'
      },
      { 
        segment: 'virtual_apprentice', 
        startTime: 75, 
        duration: 25,
        description: 'Step-by-Step Simulator'
      },
      { 
        segment: 'progress_rewards', 
        startTime: 100, 
        duration: 15,
        description: 'XP gain, level up, badge unlock'
      },
      { 
        segment: 'outro', 
        startTime: 115, 
        duration: 5,
        description: '"Start your chemistry adventure today!"'
      }
    ]
  }

  async initialize() {
    this.logger.info('🤖 Initializing AI Gameplay Agent...')
    
    this.browser = await puppeteer.launch({
      headless: false, // Visible for recording
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1920,1080',
        '--start-maximized'
      ]
    })

    this.page = await this.browser.newPage()
    await this.page.setViewport({ width: 1920, height: 1080 })
    
    // Human-like user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    this.logger.info('✅ AI Agent initialized with 1920x1080 viewport')
  }

  async executeTimedGameplaySequence(duration = 120) {
    this.logger.info(`🎮 Starting ${duration}s timed gameplay sequence...`)
    
    const startTime = Date.now()
    
    for (const segment of this.gameplayTimeline) {
      const segmentStartTime = startTime + (segment.startTime * 1000)
      const currentTime = Date.now()
      
      // Wait until it's time for this segment
      if (currentTime < segmentStartTime) {
        const waitTime = segmentStartTime - currentTime
        this.logger.info(`⏳ Waiting ${Math.round(waitTime/1000)}s for ${segment.segment}...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      
      // Execute segment
      this.logger.info(`🎬 ${segment.startTime}s: ${segment.description}`)
      await this.executeSegment(segment)
      
      // Check if we've exceeded total duration
      if (Date.now() >= startTime + (duration * 1000)) {
        break
      }
    }
    
    this.logger.info('✅ Gameplay sequence completed')
  }

  async executeSegment(segment) {
    try {
      switch (segment.segment) {
        case 'intro':
          await this.showIntro()
          break
        case 'character_creation':
          await this.demonstrateCharacterCreation()
          break
        case 'mathmage_trials':
          await this.playMathmageTrials()
          break
        case 'memory_labyrinth':
          await this.playMemoryLabyrinth()
          break
        case 'virtual_apprentice':
          await this.playVirtualApprentice()
          break
        case 'progress_rewards':
          await this.showProgressAndRewards()
          break
        case 'outro':
          await this.showOutro()
          break
        default:
          this.logger.warn(`Unknown segment: ${segment.segment}`)
      }
    } catch (error) {
      this.logger.warn(`Segment ${segment.segment} failed:`, error.message)
      // Continue with next segment
    }
  }

  async showIntro() {
    // Navigate to ChemQuest homepage
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' })
    await this.humanDelay(3000)
    
    // Look for logo or main title
    try {
      await this.page.waitForSelector('h1, .logo, [data-testid="app-title"]', { timeout: 5000 })
    } catch (error) {
      this.logger.debug('Logo/title not found, continuing...')
    }
    
    await this.humanDelay(2000)
  }

  async demonstrateCharacterCreation() {
    // Look for register/login buttons
    try {
      const authButton = await this.page.$('[data-testid="register-button"], [data-testid="login-button"], .auth-btn, button:contains("Register"), button:contains("Login")')
      
      if (authButton) {
        await this.humanClick(authButton)
        await this.humanDelay(1000)
        
        // Quick demo user setup
        await this.setupDemoUser()
      }
      
      // Show dashboard briefly
      await this.humanDelay(2000)
      
    } catch (error) {
      this.logger.debug('Auth flow not found, continuing...')
    }
  }

  async setupDemoUser() {
    try {
      // Fill demo credentials quickly
      const emailInput = await this.page.$('input[type="email"], [data-testid="email-input"]')
      if (emailInput) {
        await this.humanClick(emailInput)
        await this.humanType(emailInput, 'demo@chemquest.ai')
      }
      
      const passwordInput = await this.page.$('input[type="password"], [data-testid="password-input"]')
      if (passwordInput) {
        await this.humanClick(passwordInput)
        await this.humanType(passwordInput, 'DemoPass123!')
      }
      
      // Submit
      const submitButton = await this.page.$('button[type="submit"], [data-testid="submit-button"]')
      if (submitButton) {
        await this.humanClick(submitButton)
        await this.humanDelay(2000)
      }
      
    } catch (error) {
      this.logger.debug('Demo user setup failed:', error.message)
    }
  }

  async playMathmageTrials() {
    // Navigate to Mathmage Trials realm
    try {
      const mathmageButton = await this.page.$('[data-testid="mathmage-trials"], .realm-mathmage, button:contains("Mathmage")')
      if (mathmageButton) {
        await this.humanClick(mathmageButton)
        await this.humanDelay(2000)
      }
      
      // Start Equation Duels
      const equationDuelsButton = await this.page.$('[data-testid="equation-duels"], .game-equation-duels, button:contains("Equation")')
      if (equationDuelsButton) {
        await this.humanClick(equationDuelsButton)
        await this.humanDelay(2000)
      }
      
      // Demonstrate equation balancing with drag-and-drop
      await this.demonstrateEquationBalancing()
      
    } catch (error) {
      this.logger.debug('Mathmage Trials demo failed:', error.message)
    }
  }

  async demonstrateEquationBalancing() {
    // Look for coefficient inputs or drag-and-drop elements
    try {
      const coefficientInputs = await this.page.$$('input[data-coefficient], .coefficient-input, input[type="number"]')
      
      if (coefficientInputs.length >= 2) {
        // Demo solution: balance simple equation
        const demoCoefficients = ['2', '1', '2', '1']
        
        for (let i = 0; i < Math.min(coefficientInputs.length, demoCoefficients.length); i++) {
          await this.humanClick(coefficientInputs[i])
          await this.humanDelay(300)
          await coefficientInputs[i].type(demoCoefficients[i])
          await this.humanDelay(500)
        }
        
        // Submit answer
        const submitButton = await this.page.$('[data-testid="submit-answer"], .submit-btn, button:contains("Submit")')
        if (submitButton) {
          await this.humanClick(submitButton)
          await this.humanDelay(1500)
        }
      }
      
      // Show mana/HP mechanics briefly
      await this.humanDelay(2000)
      
    } catch (error) {
      this.logger.debug('Equation balancing demo failed:', error.message)
    }
  }

  async playMemoryLabyrinth() {
    // Navigate to Memory Labyrinth
    try {
      const memoryButton = await this.page.$('[data-testid="memory-labyrinth"], .realm-memory, button:contains("Memory")')
      if (memoryButton) {
        await this.humanClick(memoryButton)
        await this.humanDelay(2000)
      }
      
      // Start Flashcard Match
      const flashcardButton = await this.page.$('[data-testid="flashcard-match"], .game-flashcard, button:contains("Flashcard")')
      if (flashcardButton) {
        await this.humanClick(flashcardButton)
        await this.humanDelay(2000)
      }
      
      // Demonstrate card flipping
      await this.demonstrateFlashcardGame()
      
    } catch (error) {
      this.logger.debug('Memory Labyrinth demo failed:', error.message)
    }
  }

  async demonstrateFlashcardGame() {
    try {
      // Find flashcards and demonstrate flipping
      const cards = await this.page.$$('.flashcard, [data-testid="flashcard"], .card')
      
      if (cards.length >= 4) {
        // Flip cards in sequence to show matching
        for (let i = 0; i < Math.min(4, cards.length); i++) {
          await this.humanClick(cards[i])
          await this.humanDelay(800)
        }
      }
      
      // Show combo multiplier if visible
      await this.humanDelay(2000)
      
    } catch (error) {
      this.logger.debug('Flashcard demo failed:', error.message)
    }
  }

  async playVirtualApprentice() {
    // Navigate to Virtual Apprentice
    try {
      const apprenticeButton = await this.page.$('[data-testid="virtual-apprentice"], .realm-apprentice, button:contains("Apprentice")')
      if (apprenticeButton) {
        await this.humanClick(apprenticeButton)
        await this.humanDelay(2000)
      }
      
      // Start Step-by-Step Simulator
      const simulatorButton = await this.page.$('[data-testid="step-simulator"], .game-simulator, button:contains("Simulator")')
      if (simulatorButton) {
        await this.humanClick(simulatorButton)
        await this.humanDelay(2000)
      }
      
      // Demonstrate lab procedure sequencing
      await this.demonstrateLabProcedure()
      
    } catch (error) {
      this.logger.debug('Virtual Apprentice demo failed:', error.message)
    }
  }

  async demonstrateLabProcedure() {
    try {
      // Look for procedure steps or drag-and-drop elements
      const procedureSteps = await this.page.$$('.procedure-step, [data-testid="procedure-step"], .lab-step')
      
      if (procedureSteps.length >= 3) {
        // Demonstrate correct sequence
        for (let i = 0; i < Math.min(3, procedureSteps.length); i++) {
          await this.humanClick(procedureSteps[i])
          await this.humanDelay(1000)
        }
      }
      
      // Show completion feedback
      await this.humanDelay(2000)
      
    } catch (error) {
      this.logger.debug('Lab procedure demo failed:', error.message)
    }
  }

  async showProgressAndRewards() {
    // Navigate to character profile/progress
    try {
      const profileButton = await this.page.$('[data-testid="profile"], .profile-btn, button:contains("Profile")')
      if (profileButton) {
        await this.humanClick(profileButton)
        await this.humanDelay(2000)
      }
      
      // Show XP and level progression
      await this.humanDelay(2000)
      
      // Show badges/achievements
      const achievementsButton = await this.page.$('[data-testid="achievements"], .achievements-btn, button:contains("Achievement")')
      if (achievementsButton) {
        await this.humanClick(achievementsButton)
        await this.humanDelay(2000)
      }
      
    } catch (error) {
      this.logger.debug('Progress display failed:', error.message)
    }
  }

  async showOutro() {
    // Show final call-to-action screen
    await this.humanDelay(2000)
    
    // Could navigate to a specific outro page or stay on current
    try {
      // Look for any call-to-action elements
      const ctaElements = await this.page.$$('.cta, [data-testid="cta"], button:contains("Start")')
      if (ctaElements.length > 0) {
        // Highlight the CTA briefly
        await this.humanDelay(1000)
      }
    } catch (error) {
      this.logger.debug('Outro display completed')
    }
  }

  // Human-like interaction methods
  async humanClick(element) {
    await this.humanDelay(100 + Math.random() * 200)
    
    try {
      const box = await element.boundingBox()
      if (box) {
        // Click at a random point within the element
        const x = box.x + box.width * (0.3 + Math.random() * 0.4)
        const y = box.y + box.height * (0.3 + Math.random() * 0.4)
        await this.page.mouse.click(x, y)
      } else {
        await element.click()
      }
    } catch (error) {
      // Fallback to regular click
      await element.click()
    }
  }

  async humanType(element, text) {
    await element.focus()
    await this.humanDelay(200)
    
    // Type with human-like delays
    for (const char of text) {
      await this.page.keyboard.type(char)
      await this.humanDelay(50 + Math.random() * 100)
    }
  }

  async humanDelay(baseMs) {
    const variation = baseMs * 0.2 // 20% variation
    const delay = baseMs + (Math.random() - 0.5) * variation
    await new Promise(resolve => setTimeout(resolve, Math.max(50, delay)))
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
    }
  }

  getPage() {
    return this.page
  }

  getBrowser() {
    return this.browser
  }

  getGameplayTimeline() {
    return this.gameplayTimeline
  }
}
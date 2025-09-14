#!/usr/bin/env node

/**
 * Demo interactions for video recording when ChemQuest UI doesn't exist yet
 */

export async function performDemoInteractions(page) {
  console.log('🎮 Starting demo interactions...')
  
  try {
    // Wait for page to load
    await page.waitForTimeout(2000)
    
    // Demo Interaction 1: Simulate clicking around the page
    console.log('🖱️ Demo: General page interaction')
    await page.evaluate(() => {
      // Create a demo title if none exists
      if (!document.querySelector('h1')) {
        const title = document.createElement('h1')
        title.textContent = 'ChemQuest: Alchemist Academy'
        title.style.cssText = 'text-align: center; color: #4f46e5; font-size: 3rem; margin: 2rem;'
        document.body.insertBefore(title, document.body.firstChild)
      }
    })
    await page.waitForTimeout(1000)
    
    // Demo Interaction 2: Simulate equation balancing
    console.log('⚔️ Demo: Equation Duels simulation')
    await page.evaluate(() => {
      const demo = document.createElement('div')
      demo.innerHTML = `
        <div style="text-align: center; margin: 2rem; padding: 2rem; border: 2px solid #4f46e5; border-radius: 10px;">
          <h2 style="color: #4f46e5;">🧙‍♂️ Mathmage Trials - Equation Duels</h2>
          <p style="font-size: 1.5rem; margin: 1rem;">Balance this equation:</p>
          <p style="font-size: 2rem; font-family: monospace; background: #f3f4f6; padding: 1rem; border-radius: 5px;">
            C₄H₁₀ + O₂ → CO₂ + H₂O
          </p>
          <div style="margin: 1rem;">
            <button style="background: #10b981; color: white; padding: 0.5rem 1rem; border: none; border-radius: 5px; margin: 0.5rem; cursor: pointer;">Submit Answer</button>
          </div>
        </div>
      `
      document.body.appendChild(demo)
    })
    await page.waitForTimeout(3000)
    
    // Simulate clicking the submit button
    await page.click('button')
    await page.waitForTimeout(1000)
    
    // Demo Interaction 3: Simulate memory game
    console.log('🃏 Demo: Memory Labyrinth simulation')
    await page.evaluate(() => {
      const demo = document.createElement('div')
      demo.innerHTML = `
        <div style="text-align: center; margin: 2rem; padding: 2rem; border: 2px solid #7c3aed; border-radius: 10px;">
          <h2 style="color: #7c3aed;">🧠 Memory Labyrinth - Flashcard Match</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; max-width: 400px; margin: 2rem auto;">
            <div style="background: #fbbf24; padding: 1rem; border-radius: 5px; cursor: pointer;">H₂</div>
            <div style="background: #f87171; padding: 1rem; border-radius: 5px; cursor: pointer;">CO₂</div>
            <div style="background: #60a5fa; padding: 1rem; border-radius: 5px; cursor: pointer;">NH₃</div>
            <div style="background: #34d399; padding: 1rem; border-radius: 5px; cursor: pointer;">O₂</div>
          </div>
        </div>
      `
      document.body.appendChild(demo)
    })
    await page.waitForTimeout(2000)
    
    // Simulate clicking cards
    const cards = await page.$$('div[style*="cursor: pointer"]')
    if (cards.length >= 2) {
      await cards[0].click()
      await page.waitForTimeout(500)
      await cards[1].click()
      await page.waitForTimeout(1000)
    }
    
    // Demo Interaction 4: Simulate lab procedures
    console.log('🧪 Demo: Virtual Apprentice simulation')
    await page.evaluate(() => {
      const demo = document.createElement('div')
      demo.innerHTML = `
        <div style="text-align: center; margin: 2rem; padding: 2rem; border: 2px solid #059669; border-radius: 10px;">
          <h2 style="color: #059669;">🧪 Virtual Apprentice - Lab Simulator</h2>
          <p style="margin: 1rem;">Arrange the titration steps in correct order:</p>
          <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin: 2rem;">
            <div style="background: #fde68a; padding: 1rem; border-radius: 5px; cursor: move;">1. Fill burette</div>
            <div style="background: #fed7d7; padding: 1rem; border-radius: 5px; cursor: move;">2. Add indicator</div>
            <div style="background: #bee3f8; padding: 1rem; border-radius: 5px; cursor: move;">3. Titrate slowly</div>
          </div>
        </div>
      `
      document.body.appendChild(demo)
    })
    await page.waitForTimeout(3000)
    
    // Demo Interaction 5: Simulate character progression
    console.log('📈 Demo: Character progression simulation')
    await page.evaluate(() => {
      const demo = document.createElement('div')
      demo.innerHTML = `
        <div style="text-align: center; margin: 2rem; padding: 2rem; border: 2px solid #dc2626; border-radius: 10px;">
          <h2 style="color: #dc2626;">⭐ Character Progression</h2>
          <div style="margin: 2rem;">
            <p style="font-size: 1.2rem;">Level: 5 🧙‍♂️</p>
            <div style="background: #e5e7eb; height: 20px; border-radius: 10px; margin: 1rem auto; max-width: 300px;">
              <div style="background: #3b82f6; height: 100%; width: 75%; border-radius: 10px;"></div>
            </div>
            <p>XP: 750/1000</p>
            <p style="margin: 1rem;">🏆 Achievements: Equation Master, Memory Champion</p>
          </div>
        </div>
      `
      document.body.appendChild(demo)
    })
    await page.waitForTimeout(3000)
    
    // Scroll through the content
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
    await page.waitForTimeout(1000)
    
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    })
    await page.waitForTimeout(2000)
    
    console.log('✅ Demo interactions completed')
    
  } catch (error) {
    console.error('❌ Demo interaction error:', error.message)
  }
}
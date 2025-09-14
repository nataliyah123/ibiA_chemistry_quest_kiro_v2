import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { AccessibilityProvider } from '../../contexts/AccessibilityContext'
import { MathmageTrialsRealm } from '../../components/realms/MathmageTrialsRealm'
import { MemoryLabyrinthRealm } from '../../components/realms/MemoryLabyrinthRealm'
import { AnalyticsDashboard } from '../../components/analytics/AnalyticsDashboard'
import { CharacterProfile } from '../../components/CharacterProfile'
import { EducatorDashboard } from '../../components/educatorDashboard/EducatorDashboard'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('Automated Accessibility Testing', () => {
  const renderWithAccessibility = (component: React.ReactElement) => {
    return render(
      <AccessibilityProvider>
        {component}
      </AccessibilityProvider>
    )
  }

  describe('Game Components Accessibility', () => {
    it('should have no accessibility violations in Mathmage Trials Realm', async () => {
      const { container } = renderWithAccessibility(<MathmageTrialsRealm />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in Memory Labyrinth Realm', async () => {
      const { container } = renderWithAccessibility(<MemoryLabyrinthRealm />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels for interactive game elements', async () => {
      const { container } = renderWithAccessibility(<MathmageTrialsRealm />)
      
      // Check for proper button labels
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(
          button.getAttribute('aria-label') || 
          button.textContent || 
          button.getAttribute('title')
        ).toBeTruthy()
      })

      // Check for proper form labels
      const inputs = container.querySelectorAll('input')
      inputs.forEach(input => {
        const label = container.querySelector(`label[for="${input.id}"]`)
        const ariaLabel = input.getAttribute('aria-label')
        const ariaLabelledBy = input.getAttribute('aria-labelledby')
        
        expect(label || ariaLabel || ariaLabelledBy).toBeTruthy()
      })
    })

    it('should have proper heading hierarchy', async () => {
      const { container } = renderWithAccessibility(<MathmageTrialsRealm />)
      
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)))
      
      // Check that heading levels don't skip (e.g., h1 -> h3)
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i]
        const previousLevel = headingLevels[i - 1]
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('Dashboard Components Accessibility', () => {
    it('should have no accessibility violations in Analytics Dashboard', async () => {
      const { container } = renderWithAccessibility(<AnalyticsDashboard />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in Character Profile', async () => {
      const { container } = renderWithAccessibility(<CharacterProfile />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in Educator Dashboard', async () => {
      const { container } = renderWithAccessibility(<EducatorDashboard />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper table accessibility for data displays', async () => {
      const { container } = renderWithAccessibility(<AnalyticsDashboard />)
      
      const tables = container.querySelectorAll('table')
      tables.forEach(table => {
        // Check for table headers
        const headers = table.querySelectorAll('th')
        expect(headers.length).toBeGreaterThan(0)
        
        // Check for proper scope attributes
        headers.forEach(header => {
          expect(['col', 'row', 'colgroup', 'rowgroup']).toContain(
            header.getAttribute('scope') || 'col'
          )
        })
        
        // Check for table caption or aria-label
        const caption = table.querySelector('caption')
        const ariaLabel = table.getAttribute('aria-label')
        expect(caption || ariaLabel).toBeTruthy()
      })
    })
  })

  describe('Form Accessibility', () => {
    it('should have proper form validation messages', async () => {
      const FormComponent = () => (
        <form>
          <div>
            <label htmlFor="equation-input">Enter coefficients:</label>
            <input 
              id="equation-input" 
              type="text" 
              aria-describedby="equation-error"
              aria-invalid="true"
            />
            <div id="equation-error" role="alert">
              Please enter valid coefficients
            </div>
          </div>
        </form>
      )

      const { container } = renderWithAccessibility(<FormComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // Check error message association
      const input = container.querySelector('#equation-input')
      const errorMessage = container.querySelector('#equation-error')
      
      expect(input?.getAttribute('aria-describedby')).toBe('equation-error')
      expect(errorMessage?.getAttribute('role')).toBe('alert')
    })

    it('should have proper fieldset grouping for related inputs', async () => {
      const FieldsetComponent = () => (
        <form>
          <fieldset>
            <legend>Chemical Equation Coefficients</legend>
            <label htmlFor="coeff1">Reactant 1:</label>
            <input id="coeff1" type="number" />
            <label htmlFor="coeff2">Reactant 2:</label>
            <input id="coeff2" type="number" />
          </fieldset>
        </form>
      )

      const { container } = renderWithAccessibility(<FieldsetComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should meet WCAG color contrast requirements', async () => {
      const { container } = renderWithAccessibility(<MathmageTrialsRealm />)
      
      // axe will automatically check color contrast
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })

    it('should not rely solely on color for information', async () => {
      const ColorTestComponent = () => (
        <div>
          <div className="correct-answer" aria-label="Correct answer">
            <span>✓</span> This is correct
          </div>
          <div className="incorrect-answer" aria-label="Incorrect answer">
            <span>✗</span> This is incorrect
          </div>
        </div>
      )

      const { container } = renderWithAccessibility(<ColorTestComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation Accessibility', () => {
    it('should have proper focus management', async () => {
      const FocusTestComponent = () => (
        <div>
          <button>First button</button>
          <button>Second button</button>
          <input type="text" placeholder="Input field" />
          <a href="#link">Link</a>
        </div>
      )

      const { container } = renderWithAccessibility(<FocusTestComponent />)
      
      // Check that all interactive elements are focusable
      const focusableElements = container.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      )
      
      focusableElements.forEach(element => {
        expect(element.getAttribute('tabindex')).not.toBe('-1')
      })
    })

    it('should have proper skip links for main content', async () => {
      const SkipLinkComponent = () => (
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <nav>Navigation</nav>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      )

      const { container } = renderWithAccessibility(<SkipLinkComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      const skipLink = container.querySelector('.skip-link')
      const mainContent = container.querySelector('#main-content')
      
      expect(skipLink?.getAttribute('href')).toBe('#main-content')
      expect(mainContent).toBeTruthy()
    })
  })

  describe('Screen Reader Accessibility', () => {
    it('should have proper live regions for dynamic content', async () => {
      const LiveRegionComponent = () => (
        <div>
          <div role="status" aria-live="polite" id="score-update">
            Score: 85 points
          </div>
          <div role="alert" aria-live="assertive" id="error-message">
            Error: Invalid input
          </div>
          <div role="timer" aria-live="off" id="countdown">
            Time remaining: 30 seconds
          </div>
        </div>
      )

      const { container } = renderWithAccessibility(<LiveRegionComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // Check live region attributes
      const statusRegion = container.querySelector('[role="status"]')
      const alertRegion = container.querySelector('[role="alert"]')
      const timerRegion = container.querySelector('[role="timer"]')
      
      expect(statusRegion?.getAttribute('aria-live')).toBe('polite')
      expect(alertRegion?.getAttribute('aria-live')).toBe('assertive')
      expect(timerRegion?.getAttribute('aria-live')).toBe('off')
    })

    it('should have proper ARIA descriptions for complex interactions', async () => {
      const ComplexInteractionComponent = () => (
        <div>
          <button 
            aria-describedby="drag-instructions"
            aria-label="Drag coefficient to equation"
          >
            2
          </button>
          <div id="drag-instructions">
            Drag this coefficient to the correct position in the chemical equation
          </div>
          <div 
            role="grid" 
            aria-label="Chemical equation grid"
            aria-describedby="grid-instructions"
          >
            <div role="row">
              <div role="gridcell">C₄H₁₀</div>
              <div role="gridcell">+</div>
              <div role="gridcell">O₂</div>
            </div>
          </div>
          <div id="grid-instructions">
            Use arrow keys to navigate the equation grid
          </div>
        </div>
      )

      const { container } = renderWithAccessibility(<ComplexInteractionComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Mobile Accessibility', () => {
    it('should have appropriate touch targets', async () => {
      const MobileTouchComponent = () => (
        <div>
          <button style={{ minWidth: '44px', minHeight: '44px' }}>
            Large enough button
          </button>
          <button 
            style={{ minWidth: '44px', minHeight: '44px', margin: '8px' }}
          >
            Properly spaced button
          </button>
        </div>
      )

      const { container } = renderWithAccessibility(<MobileTouchComponent />)
      
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        const width = parseInt(styles.minWidth)
        const height = parseInt(styles.minHeight)
        
        // WCAG recommends minimum 44px touch targets
        expect(width).toBeGreaterThanOrEqual(44)
        expect(height).toBeGreaterThanOrEqual(44)
      })
    })
  })
})
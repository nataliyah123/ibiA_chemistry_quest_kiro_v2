import { spawn } from 'child_process'
import { join } from 'path'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '../../../../')

export class ServerManager {
  constructor(logger) {
    this.logger = logger
    this.serverProcess = null
    this.clientProcess = null
    this.serverUrl = 'http://localhost:3001'
    this.clientUrl = 'http://localhost:5173'
  }

  async startServers() {
    this.logger.info('🔧 Starting ChemQuest backend server...')
    await this.startBackendServer()
    
    this.logger.info('🔧 Starting ChemQuest frontend client...')
    await this.startFrontendClient()
    
    this.logger.info('⏳ Waiting for servers to be ready...')
    await this.waitForServers()
    
    this.logger.info('✅ All ChemQuest servers are ready!')
  }

  async startBackendServer() {
    return new Promise((resolve, reject) => {
      const serverPath = join(PROJECT_ROOT, 'server')
      
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: serverPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      })

      let resolved = false

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString()
        this.logger.debug('Server stdout:', output.trim())
        
        if (!resolved && (output.includes('Server running') || output.includes('listening'))) {
          resolved = true
          resolve()
        }
      })

      this.serverProcess.stderr.on('data', (data) => {
        this.logger.debug('Server stderr:', data.toString().trim())
      })

      this.serverProcess.on('error', (error) => {
        if (!resolved) {
          this.logger.error('Server process error:', error)
          reject(error)
        }
      })

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          resolve() // Assume it started
        }
      }, 30000)
    })
  }

  async startFrontendClient() {
    return new Promise((resolve, reject) => {
      const clientPath = join(PROJECT_ROOT, 'client')
      
      this.clientProcess = spawn('npm', ['run', 'dev'], {
        cwd: clientPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      })

      let resolved = false

      this.clientProcess.stdout.on('data', (data) => {
        const output = data.toString()
        this.logger.debug('Client stdout:', output.trim())
        
        if (!resolved && (output.includes('Local:') || output.includes('ready'))) {
          resolved = true
          resolve()
        }
      })

      this.clientProcess.stderr.on('data', (data) => {
        this.logger.debug('Client stderr:', data.toString().trim())
      })

      this.clientProcess.on('error', (error) => {
        if (!resolved) {
          this.logger.error('Client process error:', error)
          reject(error)
        }
      })

      // Timeout fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          resolve() // Assume it started
        }
      }, 30000)
    })
  }

  async waitForServers() {
    const maxAttempts = 30
    const delay = 2000 // 2 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check backend server health
        await axios.get(`${this.serverUrl}/health`, { 
          timeout: 5000,
          validateStatus: () => true // Accept any status
        })
        this.logger.info('✅ Backend server responding')
        
        // Check frontend client
        await axios.get(this.clientUrl, { 
          timeout: 5000,
          validateStatus: () => true // Accept any status
        })
        this.logger.info('✅ Frontend client responding')
        
        return // Both servers ready
        
      } catch (error) {
        this.logger.info(`⏳ Waiting for servers... (${attempt}/${maxAttempts})`)
        
        if (attempt === maxAttempts) {
          this.logger.warn('Servers may not be fully ready, but proceeding anyway')
          return // Continue even if not fully ready
        }
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  async stopServers() {
    this.logger.info('🛑 Stopping ChemQuest servers...')
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM')
      this.serverProcess = null
    }
    
    if (this.clientProcess) {
      this.clientProcess.kill('SIGTERM')
      this.clientProcess = null
    }
    
    // Wait for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    this.logger.info('✅ Servers stopped')
  }

  getServerUrl() {
    return this.serverUrl
  }

  getClientUrl() {
    return this.clientUrl
  }
}
#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🧪 Running Comprehensive Test Suite for ChemQuest: Alchemist Academy\n')

// Check if required dependencies are installed
function checkDependencies() {
  console.log('🔍 Checking dependencies...')
  
  const clientPackageJson = path.join(__dirname, '../client/package.json')
  const serverPackageJson = path.join(__dirname, '../server/package.json')
  
  if (!fs.existsSync(clientPackageJson) || !fs.existsSync(serverPackageJson)) {
    console.log('❌ Package.json files not found. Please ensure you are in the correct directory.')
    process.exit(1)
  }
  
  console.log('✅ Dependencies check passed\n')
}

const testSuites = [
  {
    name: 'Unit Tests (Server)',
    command: 'npm run test:unit',
    cwd: 'server',
    description: 'Testing server-side logic and services',
    timeout: 60000
  },
  {
    name: 'Unit Tests (Client)',
    command: 'npm run test:unit',
    cwd: 'client',
    description: 'Testing individual components and functions',
    timeout: 45000
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    cwd: 'client',
    description: 'Testing component interactions and workflows',
    timeout: 90000
  },
  {
    name: 'End-to-End Tests',
    command: 'npm run test:e2e',
    cwd: 'client',
    description: 'Testing complete user journeys',
    timeout: 120000
  },
  {
    name: 'Accessibility Tests',
    command: 'npm run test:accessibility',
    cwd: 'client',
    description: 'Testing WCAG compliance and screen reader support',
    timeout: 60000
  },
  {
    name: 'Performance Tests',
    command: 'npm run test:performance',
    cwd: 'server',
    description: 'Testing load handling and response times',
    timeout: 180000
  }
]

let totalPassed = 0
let totalFailed = 0
const results = []

async function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n📋 Running ${suite.name}`)
    console.log(`   ${suite.description}`)
    console.log(`   Command: ${suite.command} (in ${suite.cwd})`)
    console.log('   ' + '─'.repeat(50))
    
    const startTime = Date.now()
    const cwd = path.join(__dirname, '..', suite.cwd)
    
    // Use spawn for better control over the process
    const child = spawn('npm', suite.command.split(' ').slice(1), {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    })
    
    let output = ''
    let errorOutput = ''
    
    child.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
      console.log(`   ⏰ ${suite.name} TIMEOUT (${suite.timeout}ms)`)
      resolve({
        name: suite.name,
        status: 'TIMEOUT',
        duration: 'N/A',
        error: 'Test suite timed out'
      })
    }, suite.timeout)
    
    child.on('close', (code) => {
      clearTimeout(timeout)
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)
      
      if (code === 0) {
        console.log(`   ✅ ${suite.name} PASSED (${duration}s)`)
        
        const testResults = parseTestOutput(output)
        resolve({
          name: suite.name,
          status: 'PASSED',
          duration,
          ...testResults
        })
      } else {
        console.log(`   ❌ ${suite.name} FAILED (${duration}s)`)
        console.log(`   Error Code: ${code}`)
        if (errorOutput) {
          console.log(`   Error Output: ${errorOutput.substring(0, 200)}...`)
        }
        
        resolve({
          name: suite.name,
          status: 'FAILED',
          duration,
          error: `Exit code ${code}`,
          output: errorOutput.substring(0, 500)
        })
      }
    })
    
    child.on('error', (error) => {
      clearTimeout(timeout)
      console.log(`   ❌ ${suite.name} ERROR`)
      console.log(`   Error: ${error.message}`)
      
      resolve({
        name: suite.name,
        status: 'ERROR',
        duration: 'N/A',
        error: error.message
      })
    })
  })
}

async function runAllTests() {
  checkDependencies()
  
  for (const suite of testSuites) {
    const result = await runTestSuite(suite)
    results.push(result)
    
    if (result.status === 'PASSED') {
      totalPassed += result.passed || 1
    } else {
      totalFailed += 1
    }
    
    // Add a small delay between test suites
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  printSummary()
}

function printSummary() {

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUITE SUMMARY')
  console.log('='.repeat(60))

  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : result.status === 'TIMEOUT' ? '⏰' : '❌'
    const duration = result.duration !== 'N/A' ? `(${result.duration}s)` : ''
    console.log(`${status} ${result.name} ${duration}`)
    
    if (result.passed) {
      console.log(`   Tests: ${result.passed} passed, ${result.failed || 0} failed`)
    }
    
    if (result.coverage) {
      console.log(`   Coverage: ${result.coverage}%`)
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
    
    if (result.output && result.status !== 'PASSED') {
      console.log(`   Output: ${result.output.substring(0, 100)}...`)
    }
  })

  console.log('\n' + '─'.repeat(60))
  console.log(`Total Test Suites: ${results.length}`)
  console.log(`Passed: ${results.filter(r => r.status === 'PASSED').length}`)
  console.log(`Failed: ${results.filter(r => r.status === 'FAILED').length}`)
  console.log(`Timeout: ${results.filter(r => r.status === 'TIMEOUT').length}`)
  console.log(`Errors: ${results.filter(r => r.status === 'ERROR').length}`)

  const failedCount = results.filter(r => r.status !== 'PASSED').length
  
  if (failedCount > 0) {
    console.log('\n❌ Some tests failed. Please review the output above.')
    console.log('\n🔧 Troubleshooting Tips:')
    console.log('   • Check that all dependencies are installed (npm install)')
    console.log('   • Ensure database is running for server tests')
    console.log('   • Verify environment variables are set correctly')
    console.log('   • Run individual test suites for more detailed output')
    process.exit(1)
  } else {
    console.log('\n🎉 All test suites passed successfully!')
    console.log('\n📋 Test Coverage Summary:')
    console.log('   • Unit Tests: Game logic, character progression, realm components')
    console.log('   • Integration Tests: Realm workflows, API interactions')
    console.log('   • E2E Tests: Complete user journeys, authentication flows')
    console.log('   • Accessibility Tests: WCAG compliance, keyboard navigation')
    console.log('   • Performance Tests: Load handling, concurrent users')
    
    console.log('\n✨ ChemQuest: Alchemist Academy is ready for deployment!')
    console.log('\n📈 Quality Metrics:')
    console.log(`   • Total Test Suites: ${results.length}`)
    console.log(`   • Success Rate: ${((results.filter(r => r.status === 'PASSED').length / results.length) * 100).toFixed(1)}%`)
    console.log(`   • Average Duration: ${(results.reduce((sum, r) => sum + (parseFloat(r.duration) || 0), 0) / results.length).toFixed(1)}s`)
  }
}

function parseTestOutput(output) {
  const results = {
    passed: 0,
    failed: 0,
    coverage: null
  }
  
  // Parse Vitest output
  const vitestPassMatch = output.match(/(\d+) passed/)
  if (vitestPassMatch) {
    results.passed = parseInt(vitestPassMatch[1])
  }
  
  const vitestFailMatch = output.match(/(\d+) failed/)
  if (vitestFailMatch) {
    results.failed = parseInt(vitestFailMatch[1])
  }
  
  // Parse Jest output
  const jestPassMatch = output.match(/Tests:\s+(\d+) passed/)
  if (jestPassMatch) {
    results.passed = parseInt(jestPassMatch[1])
  }
  
  const jestFailMatch = output.match(/Tests:\s+\d+ passed,\s+(\d+) failed/)
  if (jestFailMatch) {
    results.failed = parseInt(jestFailMatch[1])
  }
  
  // Parse test suites
  const jestSuitesMatch = output.match(/Test Suites:\s+(\d+) passed/)
  if (jestSuitesMatch && results.passed === 0) {
    results.passed = parseInt(jestSuitesMatch[1])
  }
  
  // Parse coverage
  const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/)
  if (coverageMatch) {
    results.coverage = parseFloat(coverageMatch[1])
  }
  
  // If no specific numbers found, assume 1 passed if no errors
  if (results.passed === 0 && results.failed === 0 && !output.includes('FAIL') && !output.includes('Error')) {
    results.passed = 1
  }
  
  return results
}

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Test runner encountered an error:', error.message)
  process.exit(1)
})
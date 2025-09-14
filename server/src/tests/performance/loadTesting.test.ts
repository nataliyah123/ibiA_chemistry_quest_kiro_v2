import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { performance } from 'perf_hooks'
import app from '../../index'
import { createTestUser, cleanupTestData } from '../helpers/testHelpers'

describe('Performance and Load Testing', () => {
  let testUsers: any[] = []
  let authTokens: string[] = []

  beforeAll(async () => {
    // Create multiple test users for concurrent testing
    for (let i = 0; i < 50; i++) {
      const user = await createTestUser(`loadtest${i}@test.com`, `loadtestuser${i}`)
      testUsers.push(user)
      
      // Get auth token for each user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'testpassword123'
        })
      
      authTokens.push(loginResponse.body.token)
    }
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('Authentication Load Testing', () => {
    it('should handle 50 concurrent login requests within acceptable time', async () => {
      const startTime = performance.now()
      
      const loginPromises = testUsers.map((user, index) => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: 'testpassword123'
          })
      )

      const responses = await Promise.all(loginPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.token).toBeDefined()
      })

      // Should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000)
      
      // Average response time should be under 100ms
      const averageTime = totalTime / responses.length
      expect(averageTime).toBeLessThan(100)
    })

    it('should handle registration rate limiting correctly', async () => {
      const registrationPromises = Array.from({ length: 20 }, (_, i) => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: `ratelimit${i}@test.com`,
            username: `ratelimituser${i}`,
            password: 'testpassword123'
          })
      )

      const responses = await Promise.all(registrationPromises)
      
      // Some requests should succeed, others should be rate limited
      const successfulRequests = responses.filter(r => r.status === 201)
      const rateLimitedRequests = responses.filter(r => r.status === 429)
      
      expect(successfulRequests.length).toBeGreaterThan(0)
      expect(rateLimitedRequests.length).toBeGreaterThan(0)
    })
  })

  describe('Game Engine Load Testing', () => {
    it('should handle concurrent challenge starts', async () => {
      const startTime = performance.now()
      
      const challengePromises = authTokens.slice(0, 30).map(token => 
        request(app)
          .post('/api/game/challenge/start')
          .set('Authorization', `Bearer ${token}`)
          .send({
            realmId: 'mathmage-trials',
            challengeType: 'equation-balancing'
          })
      )

      const responses = await Promise.all(challengePromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.challenge).toBeDefined()
      })

      // Should complete within 3 seconds
      expect(totalTime).toBeLessThan(3000)
    })

    it('should handle concurrent answer submissions', async () => {
      // First, start challenges for all users
      const challengeIds: string[] = []
      
      for (const token of authTokens.slice(0, 25)) {
        const challengeResponse = await request(app)
          .post('/api/game/challenge/start')
          .set('Authorization', `Bearer ${token}`)
          .send({
            realmId: 'mathmage-trials',
            challengeType: 'equation-balancing'
          })
        
        challengeIds.push(challengeResponse.body.challenge.id)
      }

      // Now submit answers concurrently
      const startTime = performance.now()
      
      const submissionPromises = challengeIds.map((challengeId, index) => 
        request(app)
          .post('/api/game/challenge/submit')
          .set('Authorization', `Bearer ${authTokens[index]}`)
          .send({
            challengeId,
            answer: ['2', '13', '8', '10'], // Correct answer for test equation
            timeElapsed: 45
          })
      )

      const responses = await Promise.all(submissionPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All submissions should be processed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.result).toBeDefined()
      })

      // Should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000)
    })

    it('should maintain database consistency under load', async () => {
      // Perform multiple operations that modify character data
      const operationPromises = authTokens.slice(0, 20).map(async (token, index) => {
        // Start and complete a challenge
        const challengeResponse = await request(app)
          .post('/api/game/challenge/start')
          .set('Authorization', `Bearer ${token}`)
          .send({
            realmId: 'mathmage-trials',
            challengeType: 'equation-balancing'
          })

        const submissionResponse = await request(app)
          .post('/api/game/challenge/submit')
          .set('Authorization', `Bearer ${token}`)
          .send({
            challengeId: challengeResponse.body.challenge.id,
            answer: ['2', '13', '8', '10'],
            timeElapsed: 60
          })

        return submissionResponse
      })

      const responses = await Promise.all(operationPromises)
      
      // All operations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Verify character data integrity
      for (let i = 0; i < 20; i++) {
        const characterResponse = await request(app)
          .get('/api/character')
          .set('Authorization', `Bearer ${authTokens[i]}`)

        expect(characterResponse.status).toBe(200)
        expect(characterResponse.body.character.experience).toBeGreaterThan(0)
      }
    })
  })

  describe('Leaderboard Performance', () => {
    it('should handle concurrent leaderboard requests efficiently', async () => {
      const startTime = performance.now()
      
      const leaderboardPromises = authTokens.slice(0, 40).map(token => 
        request(app)
          .get('/api/leaderboard/global')
          .set('Authorization', `Bearer ${token}`)
      )

      const responses = await Promise.all(leaderboardPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.leaderboard).toBeDefined()
      })

      // Should complete quickly due to caching
      expect(totalTime).toBeLessThan(1000)
    })

    it('should handle leaderboard updates under concurrent load', async () => {
      // Simulate multiple users completing challenges simultaneously
      const updatePromises = authTokens.slice(0, 15).map((token, index) => 
        request(app)
          .post('/api/leaderboard/update')
          .set('Authorization', `Bearer ${token}`)
          .send({
            category: 'equation-speed',
            score: 1000 + index * 10,
            metadata: { timeElapsed: 30 + index }
          })
      )

      const responses = await Promise.all(updatePromises)
      
      // All updates should be processed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Verify leaderboard reflects updates
      const leaderboardResponse = await request(app)
        .get('/api/leaderboard/equation-speed')
        .set('Authorization', `Bearer ${authTokens[0]}`)

      expect(leaderboardResponse.status).toBe(200)
      expect(leaderboardResponse.body.leaderboard.length).toBeGreaterThan(0)
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks during extended operation', async () => {
      const initialMemory = process.memoryUsage()
      
      // Perform 100 operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/character')
          .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()
      
      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100
      
      expect(memoryIncreasePercent).toBeLessThan(50) // Less than 50% increase
    })

    it('should handle database connection pooling efficiently', async () => {
      // Create many concurrent database operations
      const dbOperationPromises = Array.from({ length: 100 }, (_, i) => 
        request(app)
          .get('/api/character')
          .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
      )

      const startTime = performance.now()
      const responses = await Promise.all(dbOperationPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All operations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000)
    })
  })

  describe('Error Handling Under Load', () => {
    it('should gracefully handle invalid requests under load', async () => {
      const invalidRequestPromises = Array.from({ length: 30 }, () => 
        request(app)
          .post('/api/game/challenge/submit')
          .set('Authorization', `Bearer ${authTokens[0]}`)
          .send({
            challengeId: 'invalid-challenge-id',
            answer: 'invalid-answer'
          })
      )

      const responses = await Promise.all(invalidRequestPromises)
      
      // All should return appropriate error status
      responses.forEach(response => {
        expect(response.status).toBe(400)
        expect(response.body.error).toBeDefined()
      })
    })

    it('should maintain service availability during high error rates', async () => {
      // Mix of valid and invalid requests
      const mixedPromises = Array.from({ length: 50 }, (_, i) => {
        if (i % 2 === 0) {
          // Valid request
          return request(app)
            .get('/api/character')
            .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
        } else {
          // Invalid request
          return request(app)
            .get('/api/nonexistent-endpoint')
            .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
        }
      })

      const responses = await Promise.all(mixedPromises)
      
      // Valid requests should still succeed
      const validResponses = responses.filter((_, i) => i % 2 === 0)
      validResponses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Invalid requests should return 404
      const invalidResponses = responses.filter((_, i) => i % 2 === 1)
      invalidResponses.forEach(response => {
        expect(response.status).toBe(404)
      })
    })
  })
})
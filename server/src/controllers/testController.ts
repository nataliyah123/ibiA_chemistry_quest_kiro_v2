import { Request, Response } from 'express';
import pool from '../config/database';

export class TestController {
  // Test database connection
  static async testDatabase(req: Request, res: Response): Promise<void> {
    try {
      console.log('Testing database connection...');
      const result = await pool.query('SELECT NOW() as current_time');
      console.log('Database test successful:', result.rows[0]);
      res.json({ 
        success: true, 
        message: 'Database connection successful',
        time: result.rows[0].current_time 
      });
    } catch (error) {
      console.error('Database test failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Test simple user creation without all the extras
  static async testSimpleRegister(req: Request, res: Response): Promise<void> {
    try {
      console.log('Testing simple registration...');
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ message: 'Username, email, and password are required' });
        return;
      }

      // Just test if we can insert a simple user
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (parseInt(result.rows[0].count) > 0) {
        res.status(409).json({ message: 'User already exists' });
        return;
      }

      res.json({ 
        success: true, 
        message: 'Simple registration test passed - user can be created',
        data: { username, email }
      });
    } catch (error) {
      console.error('Simple registration test failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Simple registration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Test Redis connection
  static async testRedis(req: Request, res: Response): Promise<void> {
    try {
      console.log('Testing Redis connection...');
      const { redisUtils } = await import('../config/redis');
      
      // Test set and get
      await redisUtils.setCache('test_key', 'test_value', 60);
      const value = await redisUtils.getCache('test_key');
      
      console.log('Redis test successful:', value);
      res.json({ 
        success: true, 
        message: 'Redis connection successful',
        testValue: value 
      });
    } catch (error) {
      console.error('Redis test failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Redis connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
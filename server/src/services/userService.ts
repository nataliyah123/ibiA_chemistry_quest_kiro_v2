import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { redisUtils } from '../config/redis';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  educationLevel?: string;
  school?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Character {
  id: string;
  userId: string;
  characterName: string;
  level: number;
  experiencePoints: number;
  totalGold: number;
  currentRealm?: string;
  avatarUrl?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  educationLevel?: string;
  school?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  educationLevel?: string;
  school?: string;
}

export interface UpdateCharacterData {
  characterName?: string;
  avatarUrl?: string;
  title?: string;
}

export class UserService {
  static async createUser(userData: CreateUserData): Promise<{ user: User; character: Character }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);
      
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, date_of_birth, education_level, school)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, username, email, first_name, last_name, date_of_birth, education_level, school, is_verified, is_active, created_at, updated_at`,
        [
          userData.username,
          userData.email,
          passwordHash,
          userData.firstName || null,
          userData.lastName || null,
          userData.dateOfBirth || null,
          userData.educationLevel || null,
          userData.school || null
        ]
      );
      
      const user = userResult.rows[0];
      
      // Create character profile
      const characterResult = await client.query(
        `INSERT INTO characters (user_id, character_name, level, experience_points, total_gold)
         VALUES ($1, $2, 1, 0, 100)
         RETURNING id, user_id, character_name, level, experience_points, total_gold, current_realm, avatar_url, title, created_at, updated_at`,
        [user.id, userData.username] // Default character name to username
      );
      
      const character = characterResult.rows[0];
      
      await client.query('COMMIT');
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          dateOfBirth: user.date_of_birth,
          educationLevel: user.education_level,
          school: user.school,
          isVerified: user.is_verified,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        character: {
          id: character.id,
          userId: character.user_id,
          characterName: character.character_name,
          level: character.level,
          experiencePoints: character.experience_points,
          totalGold: character.total_gold,
          currentRealm: character.current_realm,
          avatarUrl: character.avatar_url,
          title: character.title,
          createdAt: character.created_at,
          updatedAt: character.updated_at
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async findUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, date_of_birth, education_level, school, 
              is_verified, is_active, created_at, updated_at, last_login
       FROM users WHERE email = $1 AND is_active = true`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth,
      educationLevel: user.education_level,
      school: user.school,
      isVerified: user.is_verified,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login
    };
  }
  
  static async findUserByUsername(username: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, date_of_birth, education_level, school, 
              is_verified, is_active, created_at, updated_at, last_login
       FROM users WHERE username = $1 AND is_active = true`,
      [username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth,
      educationLevel: user.education_level,
      school: user.school,
      isVerified: user.is_verified,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login
    };
  }
  
  static async findUserById(id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, date_of_birth, education_level, school, 
              is_verified, is_active, created_at, updated_at, last_login
       FROM users WHERE id = $1 AND is_active = true`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth,
      educationLevel: user.education_level,
      school: user.school,
      isVerified: user.is_verified,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login
    };
  }
  
  static async validatePassword(email: string, password: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, username, email, password_hash, first_name, last_name, date_of_birth, education_level, school, 
              is_verified, is_active, created_at, updated_at, last_login
       FROM users WHERE email = $1 AND is_active = true`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth,
      educationLevel: user.education_level,
      school: user.school,
      isVerified: user.is_verified,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login
    };
  }
  
  static async updateLastLogin(userId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }
  
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updateData.firstName !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(updateData.firstName);
    }
    
    if (updateData.lastName !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(updateData.lastName);
    }
    
    if (updateData.dateOfBirth !== undefined) {
      fields.push(`date_of_birth = $${paramCount++}`);
      values.push(updateData.dateOfBirth);
    }
    
    if (updateData.educationLevel !== undefined) {
      fields.push(`education_level = $${paramCount++}`);
      values.push(updateData.educationLevel);
    }
    
    if (updateData.school !== undefined) {
      fields.push(`school = $${paramCount++}`);
      values.push(updateData.school);
    }
    
    if (fields.length === 0) {
      return this.findUserById(userId);
    }
    
    values.push(userId);
    
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} AND is_active = true
       RETURNING id, username, email, first_name, last_name, date_of_birth, education_level, school, 
                 is_verified, is_active, created_at, updated_at, last_login`,
      values
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth,
      educationLevel: user.education_level,
      school: user.school,
      isVerified: user.is_verified,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login
    };
  }
  
  static async getUserCharacter(userId: string): Promise<Character | null> {
    const result = await pool.query(
      `SELECT id, user_id, character_name, level, experience_points, total_gold, 
              current_realm, avatar_url, title, created_at, updated_at
       FROM characters WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const character = result.rows[0];
    return {
      id: character.id,
      userId: character.user_id,
      characterName: character.character_name,
      level: character.level,
      experiencePoints: character.experience_points,
      totalGold: character.total_gold,
      currentRealm: character.current_realm,
      avatarUrl: character.avatar_url,
      title: character.title,
      createdAt: character.created_at,
      updatedAt: character.updated_at
    };
  }
  
  static async updateCharacter(userId: string, updateData: UpdateCharacterData): Promise<Character | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updateData.characterName !== undefined) {
      fields.push(`character_name = $${paramCount++}`);
      values.push(updateData.characterName);
    }
    
    if (updateData.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(updateData.avatarUrl);
    }
    
    if (updateData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updateData.title);
    }
    
    if (fields.length === 0) {
      return this.getUserCharacter(userId);
    }
    
    values.push(userId);
    
    const result = await pool.query(
      `UPDATE characters SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $${paramCount}
       RETURNING id, user_id, character_name, level, experience_points, total_gold, 
                 current_realm, avatar_url, title, created_at, updated_at`,
      values
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const character = result.rows[0];
    return {
      id: character.id,
      userId: character.user_id,
      characterName: character.character_name,
      level: character.level,
      experiencePoints: character.experience_points,
      totalGold: character.total_gold,
      currentRealm: character.current_realm,
      avatarUrl: character.avatar_url,
      title: character.title,
      createdAt: character.created_at,
      updatedAt: character.updated_at
    };
  }
  
  static async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return null;
    }
    
    // Generate a secure random token
    const token = require('crypto').randomBytes(32).toString('hex');
    
    // Store token in Redis with 1 hour expiration
    await redisUtils.setCache(`password_reset:${token}`, { userId: user.id, email }, 3600);
    
    return token;
  }
  
  static async validatePasswordResetToken(token: string): Promise<{ userId: string; email: string } | null> {
    const data = await redisUtils.getCache(`password_reset:${token}`);
    return data;
  }
  
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenData = await this.validatePasswordResetToken(token);
    if (!tokenData) {
      return false;
    }
    
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, tokenData.userId]
    );
    
    // Delete the used token
    await redisUtils.deleteCache(`password_reset:${token}`);
    
    return (result.rowCount ?? 0) > 0;
  }
  
  static async createEmailVerificationToken(userId: string): Promise<string> {
    const token = require('crypto').randomBytes(32).toString('hex');
    
    // Store token in Redis with 24 hour expiration
    await redisUtils.setCache(`cache:email_verification:${token}`, { userId }, 86400);
    
    return token;
  }
  
  static async verifyEmail(token: string): Promise<boolean> {
    const tokenData = await redisUtils.getCache(`cache:email_verification:${token}`);
    if (!tokenData) {
      return false;
    }
    
    const result = await pool.query(
      'UPDATE users SET is_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [tokenData.userId]
    );
    
    // Delete the used token
    await redisUtils.deleteCache(`cache:email_verification:${token}`);
    
    return (result.rowCount ?? 0) > 0;
  }
}
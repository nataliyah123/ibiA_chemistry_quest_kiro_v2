import { Request, Response } from 'express';
import { UserService, CreateUserData } from '../services/userService';
import { generateTokens, verifyRefreshToken, AuthenticatedRequest } from '../middleware/auth';
import { redisUtils } from '../config/redis';
import { emailService } from '../services/emailService';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      console.log('ibia******Registration request body:', req.body);

      const userData: CreateUserData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        educationLevel: req.body.educationLevel,
        school: req.body.school
      };

      // Check if user already exists
      const existingUserByEmail = await UserService.findUserByEmail(userData.email);
      if (existingUserByEmail) {
        res.status(409).json({ message: 'User with this email already exists' });
        return;
      }
      console.log('Existing user by email:', existingUserByEmail);

      const existingUserByUsername = await UserService.findUserByUsername(userData.username);
      if (existingUserByUsername) {
        res.status(409).json({ message: 'Username is already taken' });
        return;
      }
      console.log('Existing user by username:', existingUserByUsername);

      // Create user and character
      const { user, character } = await UserService.createUser(userData);

      // Generate email verification token
      const verificationToken = await UserService.createEmailVerificationToken(user.id);

      // Send verification email
      try {
        console.log(`📧 Attempting to send verification email to ${user.email}`);
        await emailService.sendVerificationEmail(user.email, verificationToken, user.username);
        console.log(`📧 Verification email sent to ${user.email}`);
      } catch (error) {
        console.error('📧 Failed to send verification email:', error);
        console.log('📧 Continuing registration without email...');
        // Don't fail registration if email fails
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        email: user.email,
        username: user.username
      });

      // Store refresh token in Redis
      await redisUtils.setSession(`refresh_token:${user.id}`, { token: refreshToken }, 7 * 24 * 3600); // 7 days

      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          educationLevel: user.educationLevel,
          school: user.school,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        },
        character,
        tokens: {
          accessToken,
          refreshToken
        },
        verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.constraint?.includes('email')) {
          res.status(409).json({ message: 'User with this email already exists' });
          return;
        } else if (error.constraint?.includes('username')) {
          res.status(409).json({ message: 'Username is already taken' });
          return;
        }
      }
      
      res.status(500).json({ message: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate user credentials
      const user = await UserService.validatePassword(email, password);
      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ message: 'Account is deactivated' });
        return;
      }

      // Update last login
      await UserService.updateLastLogin(user.id);

      // Get user's character
      const character = await UserService.getUserCharacter(user.id);

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        email: user.email,
        username: user.username
      });

      // Store refresh token in Redis
      await redisUtils.setSession(`refresh_token:${user.id}`, { token: refreshToken }, 7 * 24 * 3600); // 7 days

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          educationLevel: user.educationLevel,
          school: user.school,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin
        },
        character,
        tokens: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token required' });
        return;
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      const userId = decoded.userId;

      // Check if refresh token exists in Redis
      const storedTokenData = await redisUtils.getSession(`refresh_token:${userId}`);
      if (!storedTokenData || storedTokenData.token !== refreshToken) {
        res.status(403).json({ message: 'Invalid refresh token' });
        return;
      }

      // Get user data
      const user = await UserService.findUserById(userId);
      if (!user || !user.isActive) {
        res.status(403).json({ message: 'User not found or inactive' });
        return;
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        id: user.id,
        email: user.email,
        username: user.username
      });

      // Update refresh token in Redis
      await redisUtils.setSession(`refresh_token:${user.id}`, { token: newRefreshToken }, 7 * 24 * 3600);

      res.json({
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(403).json({ message: 'Invalid refresh token' });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (userId) {
        // Remove refresh token from Redis
        await redisUtils.deleteSession(`refresh_token:${userId}`);
      }

      if (token) {
        // Add access token to blacklist
        await redisUtils.setCache(`blacklist:${token}`, true, 15 * 60); // 15 minutes (token expiry)
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  }

  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const resetToken = await UserService.createPasswordResetToken(email);
      
      if (!resetToken) {
        // Don't reveal if email exists or not for security
        res.json({ message: 'If the email exists, a password reset link has been sent' });
        return;
      }

      // Get user to send personalized email
      const user = await UserService.findUserByEmail(email);
      if (user) {
        try {
          await emailService.sendPasswordResetEmail(user.email, resetToken, user.username);
          console.log(`📧 Password reset email sent to ${user.email}`);
        } catch (error) {
          console.error('📧 Failed to send password reset email:', error);
        }
      }

      res.json({
        message: 'If the email exists, a password reset link has been sent',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Password reset request failed' });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      const success = await UserService.resetPassword(token, password);
      
      if (!success) {
        res.status(400).json({ message: 'Invalid or expired reset token' });
        return;
      }

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Password reset failed' });
    }
  }

  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      const success = await UserService.verifyEmail(token);
      
      if (!success) {
        res.status(400).json({ message: 'Invalid or expired verification token' });
        return;
      }

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Email verification failed' });
    }
  }

  static async resendVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const user = await UserService.findUserById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({ message: 'Email is already verified' });
        return;
      }

      const verificationToken = await UserService.createEmailVerificationToken(userId);

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, verificationToken, user.username);
        console.log(`📧 Verification email resent to ${user.email}`);
      } catch (error) {
        console.error('📧 Failed to resend verification email:', error);
      }

      res.json({
        message: 'Verification email sent. Please check your email.',
        verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification email' });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const user = await UserService.findUserById(userId);
      const character = await UserService.getUserCharacter(userId);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          educationLevel: user.educationLevel,
          school: user.school,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        character
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to get profile' });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        educationLevel: req.body.educationLevel,
        school: req.body.school
      };

      const updatedUser = await UserService.updateUser(userId, updateData);

      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          dateOfBirth: updatedUser.dateOfBirth,
          educationLevel: updatedUser.educationLevel,
          school: updatedUser.school,
          isVerified: updatedUser.isVerified,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }

  static async updateCharacter(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const updateData = {
        characterName: req.body.characterName,
        avatarUrl: req.body.avatarUrl,
        title: req.body.title
      };

      const updatedCharacter = await UserService.updateCharacter(userId, updateData);

      if (!updatedCharacter) {
        res.status(404).json({ message: 'Character not found' });
        return;
      }

      res.json({
        message: 'Character updated successfully',
        character: updatedCharacter
      });
    } catch (error) {
      console.error('Update character error:', error);
      res.status(500).json({ message: 'Failed to update character' });
    }
  }
}
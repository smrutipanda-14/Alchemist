import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_alchemist_master_key_987654321';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    let pfpPath = '/assets/avatars/default_alchemist.png';
    if (req.file) {
      pfpPath = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        tokenVersion: 1,
        isEmailVerified: false,
        verificationCode,
        pfpPath,
        bannerPath: '/assets/banners/mystic_library.jpg',
        gameData: {
          create: {
            xp: 0,
            level: 1,
            gold: 50,
            items: '[]'
          }
        },
        userData: {
          create: {
            dailyTaskPoolIndexes: '[1, 2, 3, 4, 5, 6, 7]',
            todaysDailyTaskIndexes: '[]',
            todaysCompletedDailyTasks: '[]',
            badges: '[]',
            profilePicturePath: pfpPath,
            bannerPath: '/assets/banners/mystic_library.jpg'
          }
        }
      },
      include: {
        gameData: true,
        userData: true
      }
    });

    // Send verification email
    await sendVerificationEmail(email, verificationCode, username);

    // Initial Starter Items into Mailbox
    await prisma.mailboxItem.createMany({
      data: [
        {
          userId: user.id,
          itemId: 8, // Crystal Vial
          message: "Welcome to the Academy! Here is your complimentary Crystal Vial."
        },
        {
          userId: user.id,
          itemId: 9, // Springwater
          message: "Pure mountain springwater for your first brew."
        },
        {
          userId: user.id,
          itemId: 1, // Moonlight Lavender
          message: "Freshly picked Moonlight Lavender from the Grove."
        }
      ]
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, tokenVersion: user.tokenVersion },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful! Verification code sent.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        pfpPath: user.pfpPath,
        bannerPath: user.bannerPath,
        bio: user.bio,
        isEmailVerified: user.isEmailVerified,
        streak: user.streak,
        gameData: user.gameData
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}

export async function verifyEmail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.verificationCode !== code) {
      res.status(400).json({ error: 'Invalid verification code' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true, verificationCode: null }
    });

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify email' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ error: 'Username/Email and password are required' });
      return;
    }

    const user: any = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      },
      include: {
        gameData: true,
        userBadges: { include: { badge: true } },
        userStickers: { include: { sticker: true } }
      } as any
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, tokenVersion: user.tokenVersion },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        pfpPath: user.pfpPath,
        bannerPath: user.bannerPath,
        bio: user.bio,
        isEmailVerified: user.isEmailVerified,
        streak: user.streak,
        gameData: user.gameData,
        badges: user.userBadges?.map((ub: any) => ub.badge) || [],
        stickers: user.userStickers?.map((us: any) => us.sticker) || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 to prevent email enumeration
      res.json({ message: 'If the email exists, a reset code has been sent.' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpires: expires
      }
    });

    await sendPasswordResetEmail(user.email, otp, user.username);
    res.json({ message: 'Reset code sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: 'Email, OTP, and new password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      res.status(400).json({ error: 'Invalid or expired reset code' });
      return;
    }

    if (user.resetOtp !== otp) {
      res.status(400).json({ error: 'Invalid reset code' });
      return;
    }

    if (new Date() > user.resetOtpExpires) {
      res.status(400).json({ error: 'Reset code has expired' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // INCREMENT TOKEN VERSION: invalidates all previous sessions!
    const updatedUser: any = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: user.tokenVersion + 1,
        resetOtp: null,
        resetOtpExpires: null
      },
      include: {
        gameData: true,
        userBadges: { include: { badge: true } },
        userStickers: { include: { sticker: true } }
      } as any
    });

    // Issue a fresh token
    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, tokenVersion: updatedUser.tokenVersion },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Password successfully reset! Old sessions have been invalidated.',
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        pfpPath: updatedUser.pfpPath,
        bannerPath: updatedUser.bannerPath,
        bio: updatedUser.bio,
        streak: updatedUser.streak,
        gameData: updatedUser.gameData,
        badges: updatedUser.userBadges?.map((ub: any) => ub.badge) || [],
        stickers: updatedUser.userStickers?.map((us: any) => us.sticker) || []
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user: any = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gameData: true,
        userData: true,
        userBadges: { include: { badge: true } },
        userStickers: { include: { sticker: true } },
        userInventory: { include: { item: true } }
      } as any
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        pfpPath: user.pfpPath,
        bannerPath: user.bannerPath,
        bio: user.bio,
        isEmailVerified: user.isEmailVerified,
        streak: user.streak,
        createdAt: user.createdAt,
        gameData: user.gameData,
        userData: user.userData,
        badges: user.userBadges?.map((ub: any) => ub.badge) || [],
        stickers: user.userStickers?.map((us: any) => us.sticker) || [],
        inventory: user.userInventory || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { bio, bannerPath } = req.body;

    let pfpPath: string | undefined;
    if (req.file) {
      pfpPath = `/uploads/avatars/${req.file.filename}`;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(bio !== undefined && { bio }),
        ...(bannerPath && { bannerPath }),
        ...(pfpPath && { pfpPath })
      },
      include: { gameData: true }
    });

    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

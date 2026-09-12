import { Router } from 'express';
import { register, login, verifyEmail, forgotPassword, resetPassword, getMe, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/register', upload.single('pfp'), register);
router.post('/login', login);
router.post('/verify-email', authenticateToken, verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, upload.single('pfp'), updateProfile);

export default router;

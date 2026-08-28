const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, refreshToken, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Jina linahitajika'),
  body('email').isEmail().withMessage('Barua pepe si sahihi'),
  body('password').isLength({ min: 6 }).withMessage('Nenosiri liwe na herufi 6+'),
  body('username').trim().notEmpty().withMessage('Username inahitajika'),
  validate,
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Barua pepe si sahihi'),
  body('password').notEmpty().withMessage('Nenosiri linahitajika'),
  validate,
], login);

router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const crypto = require('crypto');

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: 'If this email exists, a reset link has been sent.' });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: 'ASIEP <onboarding@resend.dev>',
      to: email,
      subject: '🔐 Reset Your ASIEP Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F1117;color:white;padding:40px;border-radius:16px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#A78BFA;font-size:32px;margin:0;">ASIEP</h1>
            <p style="color:#6B7280;font-size:14px;">African Student Innovation Ecosystem Platform</p>
          </div>
          <h2 style="color:white;font-size:22px;">Reset Your Password</h2>
          <p style="color:#9CA3AF;line-height:1.6;">You requested a password reset for your ASIEP account. Click the button below to set a new password.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:linear-gradient(135deg,#7C3AED,#06B6D4);color:white;padding:14px 32px;border-radius:99px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">
              🔐 Reset Password
            </a>
          </div>
          <p style="color:#6B7280;font-size:13px;">This link expires in <strong style="color:#F59E0B;">1 hour</strong>. If you did not request this, ignore this email.</p>
          <hr style="border:1px solid #1F2937;margin:30px 0;">
          <p style="color:#4B5563;font-size:12px;text-align:center;">© 2026 ASIEP — Built for Africa, by Africa 🌍</p>
        </div>
      `,
    });

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch(err) { next(err); }
});

// ── RESET PASSWORD ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successfully! You can now login.' });
  } catch(err) { next(err); }
});
module.exports = router;

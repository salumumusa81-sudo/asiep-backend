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

module.exports = router;

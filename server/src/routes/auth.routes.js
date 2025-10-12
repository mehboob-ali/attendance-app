import { Router } from 'express';
import { postLogin, postRegister, requestPasswordReset, resetPassword } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', postRegister);
router.post('/login', postLogin);
router.post('/request-reset', requestPasswordReset); // NEW
router.post('/reset-password', resetPassword); // NEW

export default router;

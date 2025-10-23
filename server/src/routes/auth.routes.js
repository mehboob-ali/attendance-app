import { Router } from 'express';
import { postLogin, postRegister, postEmployeeSignup, requestPasswordReset, resetPassword } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', postRegister);
router.post('/login', postLogin);
router.post('/request-reset', requestPasswordReset); // NEW
router.post('/reset-password', resetPassword); // NEW
router.post('/employee-signup', postEmployeeSignup);

export default router;

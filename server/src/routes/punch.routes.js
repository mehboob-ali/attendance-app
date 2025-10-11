import { Router } from 'express';
import auth from '../middleware/auth.js';
import { postPunch, getMyPunches } from '../controllers/punch.controller.js';

const router = Router();

router.post('/', auth, postPunch);
router.get('/my', auth, getMyPunches);

export default router;

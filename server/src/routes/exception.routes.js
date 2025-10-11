import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import { list, decide } from '../controllers/exception.controller.js';

const router = Router();

router.get('/', auth, allowRoles('admin'), list);
router.post('/:id/decision', auth, allowRoles('admin'), decide);

export default router;

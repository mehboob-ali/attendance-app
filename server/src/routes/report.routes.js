import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import { getDaily, getExport } from '../controllers/report.controller.js';

const router = Router();

router.get('/daily', auth, allowRoles('admin'), getDaily);
router.get('/export', auth, allowRoles('admin'), getExport); // NEW

export default router;

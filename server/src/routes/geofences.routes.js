import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import { getAll, postCreate, putUpdate, delOne } from '../controllers/geofences.controller.js';

const router = Router();

router.get('/', auth, getAll);
router.post('/', auth, allowRoles('admin'), postCreate);
router.put('/:id', auth, allowRoles('admin'), putUpdate);
router.delete('/:id', auth, allowRoles('admin'), delOne);

export default router;

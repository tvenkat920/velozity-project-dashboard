import { Router } from 'express';
import { getActivityFeed } from '../controllers/activityController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Get missed or recent 20 activity events (role-filtered at database level)
router.get('/', getActivityFeed);

export default router;

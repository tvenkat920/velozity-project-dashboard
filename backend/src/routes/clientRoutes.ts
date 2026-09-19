import { Router } from 'express';
import { getClients, createClient } from '../controllers/clientController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { createClientSchema } from '../validations/clientValidation';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.post(
  '/',
  requireRole(['ADMIN', 'PROJECT_MANAGER']),
  validateRequest(createClientSchema),
  createClient
);

export default router;

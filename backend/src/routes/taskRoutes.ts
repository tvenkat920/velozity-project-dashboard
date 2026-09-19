import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import { authenticate, requireRole, checkTaskAccess } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
} from '../validations/taskValidation';

const router = Router();

router.use(authenticate);

// Get tasks (role-filtered, status/priority/date query params supported)
router.get('/', getTasks);

// Get single task (strictly verifies ownership/assignment)
router.get('/:id', checkTaskAccess, getTaskById);

// Create task (Admin & PM only)
router.post(
  '/',
  requireRole(['ADMIN', 'PROJECT_MANAGER']),
  validateRequest(createTaskSchema),
  createTask
);

// Update status (Admin, PM, or assigned Developer)
router.patch(
  '/:id/status',
  checkTaskAccess,
  validateRequest(updateTaskStatusSchema),
  updateTaskStatus
);

// Update task details (Admin & PM only - Developer forbidden)
router.put(
  '/:id',
  requireRole(['ADMIN', 'PROJECT_MANAGER']),
  checkTaskAccess,
  validateRequest(updateTaskSchema),
  updateTask
);

// Delete task (Admin & PM only)
router.delete(
  '/:id',
  requireRole(['ADMIN', 'PROJECT_MANAGER']),
  checkTaskAccess,
  deleteTask
);

export default router;

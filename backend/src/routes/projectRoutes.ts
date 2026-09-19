import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { authenticate, requireRole, checkProjectAccess } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { createProjectSchema, updateProjectSchema } from '../validations/projectValidation';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', checkProjectAccess, getProjectById);

// Only Admin and Project Manager can create projects
router.post(
  '/',
  requireRole(['ADMIN', 'PROJECT_MANAGER']),
  validateRequest(createProjectSchema),
  createProject
);

// Admin or PM (own project) can update
router.put(
  '/:id',
  requireRole(['ADMIN', 'PROJECT_MANAGER']),
  checkProjectAccess,
  validateRequest(updateProjectSchema),
  updateProject
);

// Admin or PM (own project) can delete
router.delete(
  '/:id',
  requireRole(['ADMIN', 'PROJECT_MANAGER']),
  checkProjectAccess,
  deleteProject
);

export default router;

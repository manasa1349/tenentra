import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  getProjectById
} from '../controllers/projectController.js';

const router = express.Router();

router.post('/', authenticate, createProject);
router.get('/', authenticate, listProjects);
router.put('/:projectId', authenticate, updateProject);
router.delete('/:projectId', authenticate, deleteProject);
router.get("/:projectId", authenticate, getProjectById);

export default router;

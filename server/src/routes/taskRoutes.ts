import { Router } from 'express';
import {
  getDailyTaskPool,
  setDailyTasks,
  getDashboardTasks,
  createTodoTask,
  submitTaskProof,
  getItinerary
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);

router.get('/pool', getDailyTaskPool);
router.post('/daily', setDailyTasks);
router.get('/dashboard', getDashboardTasks);
router.post('/todo', createTodoTask);
router.post('/proof', upload.single('proof'), submitTaskProof);
router.get('/itinerary', getItinerary);

export default router;

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { INITIAL_DAILY_TASK_POOL } from '../prisma/seed';
import { taskQueue } from '../services/queueService';

export async function getDailyTaskPool(req: AuthRequest, res: Response): Promise<void> {
  try {
    res.json({ pool: INITIAL_DAILY_TASK_POOL });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily task pool' });
  }
}

export async function setDailyTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { taskIds } = req.body; // Array of template IDs from INITIAL_DAILY_TASK_POOL

    if (!userId || !Array.isArray(taskIds) || taskIds.length === 0) {
      res.status(400).json({ error: 'Please select at least one daily task' });
      return;
    }

    // Convert template IDs to active user tasks for today
    const selectedTemplates = INITIAL_DAILY_TASK_POOL.filter(t => taskIds.includes(t.id));

    // Clear existing uncompleted daily tasks for this user to allow fresh configuration
    await prisma.task.deleteMany({
      where: {
        userId,
        type: 'DAILY',
        isCompleted: false
      }
    });

    // Create new daily tasks
    for (const template of selectedTemplates) {
      await prisma.task.create({
        data: {
          userId,
          title: template.title,
          description: template.description,
          type: 'DAILY',
          xpReward: template.xpReward,
          materialRewards: JSON.stringify(template.materialRewards),
          status: 'PENDING',
          isCompleted: false
        }
      });
    }

    // Update UserData
    await prisma.userData.upsert({
      where: { userId },
      update: {
        todaysDailyTaskIndexes: JSON.stringify(taskIds)
      },
      create: {
        userId,
        dailyTaskPoolIndexes: '[1, 2, 3, 4, 5, 6, 7]',
        todaysDailyTaskIndexes: JSON.stringify(taskIds),
        todaysCompletedDailyTasks: '[]',
        badges: '[]'
      }
    });

    res.json({ message: `Successfully configured ${selectedTemplates.length} daily tasks for today!` });
  } catch (error) {
    console.error('Error setting daily tasks:', error);
    res.status(500).json({ error: 'Failed to configure daily tasks' });
  }
}

export async function getDashboardTasks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const dailyTasks = tasks.filter(t => t.type === 'DAILY');
    const todoTasks = tasks.filter(t => t.type === 'TODO');

    res.json({ dailyTasks, todoTasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load tasks' });
  }
}

export async function createTodoTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { title, description } = req.body;

    if (!userId || !title) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    // Standard fixed anti-cheat XP reward
    const fixedXpReward = 45;

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        description: description ? description.trim() : null,
        type: 'TODO',
        xpReward: fixedXpReward,
        materialRewards: '[]', // Todo tasks reward XP + Gold via queue
        status: 'PENDING',
        isCompleted: false
      }
    });

    res.status(201).json({ message: 'Todo task created', task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo task' });
  }
}

export async function submitTaskProof(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { taskId, proofNote } = req.body;

    if (!userId || !taskId) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }

    const task = await prisma.task.findFirst({
      where: { id: parseInt(taskId), userId }
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.isCompleted || task.status === 'APPROVED') {
      res.status(400).json({ error: 'Task already completed!' });
      return;
    }

    let proofUrl: string | undefined;
    if (req.file) {
      proofUrl = `/uploads/proofs/${req.file.filename}`;
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        proofUrl: proofUrl || task.proofUrl,
        proofNote: proofNote || task.proofNote,
        status: 'PROCESSING',
        submittedAt: new Date()
      }
    });

    // Enqueue for async background verification and reward delivery
    taskQueue.enqueue({ taskId: task.id, userId });

    res.json({
      message: 'Proof submitted! Task dispatched to the Guild verification queue.',
      task: updated
    });
  } catch (error) {
    console.error('Submit proof error:', error);
    res.status(500).json({ error: 'Failed to submit proof' });
  }
}

export async function getItinerary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const itinerary = await prisma.itinerary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ itinerary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch itinerary' });
  }
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyTaskPool = getDailyTaskPool;
exports.setDailyTasks = setDailyTasks;
exports.getDashboardTasks = getDashboardTasks;
exports.createTodoTask = createTodoTask;
exports.submitTaskProof = submitTaskProof;
exports.getItinerary = getItinerary;
const client_1 = __importDefault(require("../prisma/client"));
const seed_1 = require("../prisma/seed");
const queueService_1 = require("../services/queueService");
async function getDailyTaskPool(req, res) {
    try {
        res.json({ pool: seed_1.INITIAL_DAILY_TASK_POOL });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch daily task pool' });
    }
}
async function setDailyTasks(req, res) {
    try {
        const userId = req.user?.id;
        const { taskIds } = req.body; // Array of template IDs from INITIAL_DAILY_TASK_POOL
        if (!userId || !Array.isArray(taskIds) || taskIds.length === 0) {
            res.status(400).json({ error: 'Please select at least one daily task' });
            return;
        }
        // Convert template IDs to active user tasks for today
        const selectedTemplates = seed_1.INITIAL_DAILY_TASK_POOL.filter(t => taskIds.includes(t.id));
        // Clear existing uncompleted daily tasks for this user to allow fresh configuration
        await client_1.default.task.deleteMany({
            where: {
                userId,
                type: 'DAILY',
                isCompleted: false
            }
        });
        // Create new daily tasks
        for (const template of selectedTemplates) {
            await client_1.default.task.create({
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
        await client_1.default.userData.upsert({
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
    }
    catch (error) {
        console.error('Error setting daily tasks:', error);
        res.status(500).json({ error: 'Failed to configure daily tasks' });
    }
}
async function getDashboardTasks(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const tasks = await client_1.default.task.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        const dailyTasks = tasks.filter(t => t.type === 'DAILY');
        const todoTasks = tasks.filter(t => t.type === 'TODO');
        res.json({ dailyTasks, todoTasks });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load tasks' });
    }
}
async function createTodoTask(req, res) {
    try {
        const userId = req.user?.id;
        const { title, description } = req.body;
        if (!userId || !title) {
            res.status(400).json({ error: 'Task title is required' });
            return;
        }
        // Standard fixed anti-cheat XP reward
        const fixedXpReward = 45;
        const task = await client_1.default.task.create({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create todo task' });
    }
}
async function submitTaskProof(req, res) {
    try {
        const userId = req.user?.id;
        const { taskId, proofNote } = req.body;
        if (!userId || !taskId) {
            res.status(400).json({ error: 'Task ID is required' });
            return;
        }
        const task = await client_1.default.task.findFirst({
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
        let proofUrl;
        if (req.file) {
            proofUrl = `/uploads/proofs/${req.file.filename}`;
        }
        const updated = await client_1.default.task.update({
            where: { id: task.id },
            data: {
                proofUrl: proofUrl || task.proofUrl,
                proofNote: proofNote || task.proofNote,
                status: 'PROCESSING',
                submittedAt: new Date()
            }
        });
        // Enqueue for async background verification and reward delivery
        queueService_1.taskQueue.enqueue({ taskId: task.id, userId });
        res.json({
            message: 'Proof submitted! Task dispatched to the Guild verification queue.',
            task: updated
        });
    }
    catch (error) {
        console.error('Submit proof error:', error);
        res.status(500).json({ error: 'Failed to submit proof' });
    }
}
async function getItinerary(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const itinerary = await client_1.default.itinerary.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ itinerary });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
}

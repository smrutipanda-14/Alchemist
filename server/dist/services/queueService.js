"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskQueue = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class TaskQueue {
    queue = [];
    isProcessing = false;
    enqueue(job) {
        this.queue.push(job);
        console.log(`📥 [TaskQueue] Enqueued Task #${job.taskId} for User ${job.userId}. Queue length: ${this.queue.length}`);
        this.processNext();
    }
    async processNext() {
        if (this.isProcessing || this.queue.length === 0)
            return;
        this.isProcessing = true;
        const currentJob = this.queue.shift();
        if (!currentJob) {
            this.isProcessing = false;
            return;
        }
        try {
            console.log(`⚙️ [TaskQueue] Processing proof for Task #${currentJob.taskId}...`);
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 3000));
            const task = await client_1.default.task.findUnique({
                where: { id: currentJob.taskId },
                include: { user: { include: { gameData: true, userData: true } } }
            });
            if (!task || task.status === 'APPROVED') {
                this.isProcessing = false;
                this.processNext();
                return;
            }
            // 1. Calculate Streak & Multipliers
            const now = new Date();
            let streak = task.user.streak;
            const lastDate = task.user.lastStreakDate ? new Date(task.user.lastStreakDate) : null;
            const isSameDay = lastDate && (lastDate.getFullYear() === now.getFullYear() &&
                lastDate.getMonth() === now.getMonth() &&
                lastDate.getDate() === now.getDate());
            if (!isSameDay) {
                // Check if yesterday or first time
                if (lastDate) {
                    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 2) {
                        streak += 1;
                    }
                    else {
                        streak = 1;
                    }
                }
                else {
                    streak = 1;
                }
                await client_1.default.user.update({
                    where: { id: task.userId },
                    data: { streak, lastStreakDate: now }
                });
            }
            // XP Multiplier: 1.0 + (streak * 0.1) max 3.0x
            const multiplier = Math.min(3.0, 1.0 + (streak * 0.1));
            const calculatedXp = Math.round(task.xpReward * multiplier);
            // 2. Mark Task as Approved
            await client_1.default.task.update({
                where: { id: task.id },
                data: {
                    status: 'APPROVED',
                    isCompleted: true,
                    completedAt: now
                }
            });
            // 3. Add to Itinerary if it's a TODO task
            if (task.type === 'TODO') {
                await client_1.default.itinerary.create({
                    data: {
                        userId: task.userId,
                        todoTaskHeading: task.title,
                        timeOfCompletion: now
                    }
                });
            }
            // 4. Update Game Profile (XP, Level)
            const currentXp = (task.user.gameData?.xp || 0) + calculatedXp;
            const newLevel = Math.floor(currentXp / 100) + 1; // 100 XP per level
            await client_1.default.gameData.upsert({
                where: { userId: task.userId },
                update: {
                    xp: currentXp,
                    level: newLevel
                },
                create: {
                    userId: task.userId,
                    xp: calculatedXp,
                    level: newLevel,
                    gold: 50
                }
            });
            // 5. Send Materials to Mailbox
            let materialIds = [];
            try {
                materialIds = JSON.parse(task.materialRewards);
            }
            catch (e) {
                materialIds = [];
            }
            if (materialIds.length > 0) {
                for (const itemId of materialIds) {
                    const item = await client_1.default.item.findUnique({ where: { id: itemId } });
                    await client_1.default.mailboxItem.create({
                        data: {
                            userId: task.userId,
                            itemId: itemId,
                            xp: 0,
                            gold: 0,
                            message: `Reward package for completing [${task.title}]: 1x ${item?.name || 'Alchemical Material'}`
                        }
                    });
                }
            }
            else {
                await client_1.default.mailboxItem.create({
                    data: {
                        userId: task.userId,
                        xp: calculatedXp,
                        gold: 15,
                        message: `Honorary commendation for completing [${task.title}]: +${calculatedXp} XP (${multiplier.toFixed(1)}x Streak Multiplier) and +15 Gold!`
                    }
                });
            }
            // 6. Check Streak Badges (3-day and 7-day)
            if (streak >= 3) {
                const badge3 = await client_1.default.userBadge.findUnique({
                    where: { userId_badgeId: { userId: task.userId, badgeId: 2 } }
                });
                if (!badge3) {
                    await client_1.default.userBadge.create({
                        data: { userId: task.userId, badgeId: 2 }
                    });
                    await client_1.default.mailboxItem.create({
                        data: {
                            userId: task.userId,
                            badgeId: 2,
                            badgeName: "Focus Flame (3-Day)",
                            message: "🎖️ Mail delivery: You've earned the 3-Day Focus Flame Badge!"
                        }
                    });
                }
            }
            if (streak >= 7) {
                const badge7 = await client_1.default.userBadge.findUnique({
                    where: { userId_badgeId: { userId: task.userId, badgeId: 3 } }
                });
                if (!badge7) {
                    await client_1.default.userBadge.create({
                        data: { userId: task.userId, badgeId: 3 }
                    });
                    await client_1.default.mailboxItem.create({
                        data: {
                            userId: task.userId,
                            badgeId: 3,
                            badgeName: "Master of the Flame (7-Day)",
                            message: "🔥 Mail delivery: You've earned the 7-Day Master of the Flame Badge!"
                        }
                    });
                }
            }
            console.log(`✅ [TaskQueue] Task #${task.id} verified & processed. User rewarded ${calculatedXp} XP & materials dispatched to Mailbox.`);
        }
        catch (error) {
            console.error(`❌ [TaskQueue] Error processing task #${currentJob.taskId}:`, error);
        }
        finally {
            this.isProcessing = false;
            this.processNext();
        }
    }
}
exports.taskQueue = new TaskQueue();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventory = getInventory;
exports.getMailbox = getMailbox;
exports.claimMailbox = claimMailbox;
exports.craftPotion = craftPotion;
exports.getNpcOrders = getNpcOrders;
exports.fulfillNpcOrder = fulfillNpcOrder;
exports.completeGardenFocus = completeGardenFocus;
exports.getShop = getShop;
exports.getStickers = getStickers;
exports.buyBanner = buyBanner;
exports.buySticker = buySticker;
const client_1 = __importDefault(require("../prisma/client"));
const seed_1 = require("../prisma/seed");
async function getInventory(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const inventory = await client_1.default.userInventory.findMany({
            where: { userId },
            include: { item: true }
        });
        res.json({ inventory });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
}
async function getMailbox(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const mail = await client_1.default.mailboxItem.findMany({
            where: { userId },
            include: { item: true },
            orderBy: { createdAt: 'desc' }
        });
        const unclaimedCount = mail.filter(m => !m.isClaimed).length;
        res.json({ mail, unclaimedCount });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch mailbox' });
    }
}
async function claimMailbox(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const unclaimed = await client_1.default.mailboxItem.findMany({
            where: { userId, isClaimed: false },
            include: { item: true }
        });
        if (unclaimed.length === 0) {
            res.json({ message: 'No new mail to claim!' });
            return;
        }
        let addedGold = 0;
        let addedXp = 0;
        for (const mail of unclaimed) {
            if (mail.itemId) {
                // Upsert inventory
                const existing = await client_1.default.userInventory.findUnique({
                    where: { userId_itemId: { userId, itemId: mail.itemId } }
                });
                if (existing) {
                    await client_1.default.userInventory.update({
                        where: { id: existing.id },
                        data: { quantity: existing.quantity + 1 }
                    });
                }
                else {
                    await client_1.default.userInventory.create({
                        data: { userId, itemId: mail.itemId, quantity: 1 }
                    });
                }
            }
            if (mail.badgeId) {
                // Award badge
                await client_1.default.userBadge.upsert({
                    where: { userId_badgeId: { userId, badgeId: mail.badgeId } },
                    update: {},
                    create: { userId, badgeId: mail.badgeId }
                });
            }
            addedGold += mail.gold;
            addedXp += mail.xp;
        }
        // Mark all as claimed
        await client_1.default.mailboxItem.updateMany({
            where: { userId, isClaimed: false },
            data: { isClaimed: true }
        });
        // Update gold and XP in GameData
        if (addedGold > 0 || addedXp > 0) {
            const gameData = await client_1.default.gameData.findUnique({ where: { userId } });
            const newXp = (gameData?.xp || 0) + addedXp;
            const newGold = (gameData?.gold || 0) + addedGold;
            const newLevel = Math.floor(newXp / 100) + 1;
            await client_1.default.gameData.update({
                where: { userId },
                data: { xp: newXp, gold: newGold, level: newLevel }
            });
        }
        res.json({
            message: `Claimed ${unclaimed.length} delivery packages!`,
            claimedItems: unclaimed
        });
    }
    catch (error) {
        console.error('Claim mailbox error:', error);
        res.status(500).json({ error: 'Failed to claim mail' });
    }
}
async function craftPotion(req, res) {
    try {
        const userId = req.user?.id;
        const { potionId } = req.body;
        if (!userId || !potionId) {
            res.status(400).json({ error: 'Potion ID is required' });
            return;
        }
        const recipe = seed_1.RECIPES[potionId];
        if (!recipe) {
            res.status(400).json({ error: 'Unknown potion recipe' });
            return;
        }
        // Check user inventory for required ingredients
        const inventory = await client_1.default.userInventory.findMany({
            where: { userId }
        });
        const inventoryMap = new Map();
        inventory.forEach(inv => inventoryMap.set(inv.itemId, inv.quantity));
        for (const reqItem of recipe.ingredients) {
            const currentQty = inventoryMap.get(reqItem.itemId) || 0;
            if (currentQty < reqItem.qty) {
                const itemInfo = await client_1.default.item.findUnique({ where: { id: reqItem.itemId } });
                res.status(400).json({
                    error: `Missing ingredients: Need ${reqItem.qty}x ${itemInfo?.name || 'Material'} (You have ${currentQty})`
                });
                return;
            }
        }
        // Deduct ingredients
        for (const reqItem of recipe.ingredients) {
            const invRecord = inventory.find(i => i.itemId === reqItem.itemId);
            if (invRecord) {
                if (invRecord.quantity <= reqItem.qty) {
                    await client_1.default.userInventory.delete({ where: { id: invRecord.id } });
                }
                else {
                    await client_1.default.userInventory.update({
                        where: { id: invRecord.id },
                        data: { quantity: invRecord.quantity - reqItem.qty }
                    });
                }
            }
        }
        // Add crafted potion to inventory
        const existingPotion = await client_1.default.userInventory.findUnique({
            where: { userId_itemId: { userId, itemId: potionId } }
        });
        if (existingPotion) {
            await client_1.default.userInventory.update({
                where: { id: existingPotion.id },
                data: { quantity: existingPotion.quantity + 1 }
            });
        }
        else {
            await client_1.default.userInventory.create({
                data: { userId, itemId: potionId, quantity: 1 }
            });
        }
        // Grant Crafting XP
        const gameData = await client_1.default.gameData.findUnique({ where: { userId } });
        const newXp = (gameData?.xp || 0) + recipe.xpYield;
        const newLevel = Math.floor(newXp / 100) + 1;
        await client_1.default.gameData.update({
            where: { userId },
            data: { xp: newXp, level: newLevel }
        });
        // Check Novice Alchemist Badge (id: 1)
        await client_1.default.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId: 1 } },
            update: {},
            create: { userId, badgeId: 1 }
        });
        // Check Grand Brewmaster Badge (id: 4) if potion is rare/legendary (potionId 15 or 16)
        if (potionId >= 15) {
            await client_1.default.userBadge.upsert({
                where: { userId_badgeId: { userId, badgeId: 4 } },
                update: {},
                create: { userId, badgeId: 4 }
            });
        }
        const potionItem = await client_1.default.item.findUnique({ where: { id: potionId } });
        res.json({
            message: `✨ Successfully brewed ${recipe.name}! (+${recipe.xpYield} XP)`,
            craftedPotion: potionItem,
            xpGained: recipe.xpYield
        });
    }
    catch (error) {
        console.error('Crafting error:', error);
        res.status(500).json({ error: 'Failed to brew potion' });
    }
}
async function getNpcOrders(req, res) {
    try {
        const orders = await client_1.default.npcOrder.findMany();
        // Include potion item details
        const items = await client_1.default.item.findMany();
        const itemMap = new Map(items.map(i => [i.id, i]));
        const enrichedOrders = orders.map(o => ({
            ...o,
            requestedPotion: itemMap.get(o.requestedPotionId),
            rareHerbReward: o.rareHerbRewardId ? itemMap.get(o.rareHerbRewardId) : null
        }));
        res.json({ orders: enrichedOrders });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer orders' });
    }
}
async function fulfillNpcOrder(req, res) {
    try {
        const userId = req.user?.id;
        const { orderId } = req.body;
        if (!userId || !orderId) {
            res.status(400).json({ error: 'Order ID is required' });
            return;
        }
        const order = await client_1.default.npcOrder.findUnique({ where: { id: orderId } });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        // Check if user has requested potion
        const potionInv = await client_1.default.userInventory.findUnique({
            where: { userId_itemId: { userId, itemId: order.requestedPotionId } }
        });
        if (!potionInv || potionInv.quantity < order.requestedPotionQty) {
            const potion = await client_1.default.item.findUnique({ where: { id: order.requestedPotionId } });
            res.status(400).json({
                error: `You do not have the required potion: ${potion?.name || 'Requested Potion'}`
            });
            return;
        }
        // Deduct potion
        if (potionInv.quantity <= order.requestedPotionQty) {
            await client_1.default.userInventory.delete({ where: { id: potionInv.id } });
        }
        else {
            await client_1.default.userInventory.update({
                where: { id: potionInv.id },
                data: { quantity: potionInv.quantity - order.requestedPotionQty }
            });
        }
        // Grant Gold & XP
        const gameData = await client_1.default.gameData.findUnique({ where: { userId } });
        const newGold = (gameData?.gold || 0) + order.goldReward;
        const newXp = (gameData?.xp || 0) + 40;
        const newLevel = Math.floor(newXp / 100) + 1;
        await client_1.default.gameData.update({
            where: { userId },
            data: { gold: newGold, xp: newXp, level: newLevel }
        });
        // Grant Rare Herb if any
        let grantedHerbName = null;
        if (order.rareHerbRewardId) {
            const rareHerb = await client_1.default.item.findUnique({ where: { id: order.rareHerbRewardId } });
            grantedHerbName = rareHerb?.name;
            const existingHerb = await client_1.default.userInventory.findUnique({
                where: { userId_itemId: { userId, itemId: order.rareHerbRewardId } }
            });
            if (existingHerb) {
                await client_1.default.userInventory.update({
                    where: { id: existingHerb.id },
                    data: { quantity: existingHerb.quantity + 1 }
                });
            }
            else {
                await client_1.default.userInventory.create({
                    data: { userId, itemId: order.rareHerbRewardId, quantity: 1 }
                });
            }
        }
        // Grant Badge if any
        if (order.badgeRewardId) {
            await client_1.default.userBadge.upsert({
                where: { userId_badgeId: { userId, badgeId: order.badgeRewardId } },
                update: {},
                create: { userId, badgeId: order.badgeRewardId }
            });
        }
        // Check Town Benefactor Badge (id: 6)
        await client_1.default.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId: 6 } },
            update: {},
            create: { userId, badgeId: 6 }
        });
        res.json({
            message: `🎉 Order fulfilled for ${order.npcName}! Received +${order.goldReward} Gold!`,
            goldEarned: order.goldReward,
            rareHerbName: grantedHerbName
        });
    }
    catch (error) {
        console.error('Order fulfillment error:', error);
        res.status(500).json({ error: 'Failed to fulfill order' });
    }
}
async function completeGardenFocus(req, res) {
    try {
        const userId = req.user?.id;
        const { durationMinutes } = req.body;
        if (!userId || !durationMinutes || durationMinutes < 5) {
            res.status(400).json({ error: 'Focus session must be at least 5 minutes' });
            return;
        }
        // Yield calculation: 1 herb per 5 minutes + chance for rare herb
        const commonHerbCount = Math.floor(durationMinutes / 5);
        const harvestedItems = [];
        // Randomly pick common herbs (id: 1..4)
        for (let i = 0; i < commonHerbCount; i++) {
            const herbId = Math.floor(Math.random() * 4) + 1;
            const herb = await client_1.default.item.findUnique({ where: { id: herbId } });
            const existingInv = await client_1.default.userInventory.findUnique({
                where: { userId_itemId: { userId, itemId: herbId } }
            });
            if (existingInv) {
                await client_1.default.userInventory.update({
                    where: { id: existingInv.id },
                    data: { quantity: existingInv.quantity + 1 }
                });
            }
            else {
                await client_1.default.userInventory.create({
                    data: { userId, itemId: herbId, quantity: 1 }
                });
            }
            const existingInHarvest = harvestedItems.find(h => h.id === herbId);
            if (existingInHarvest) {
                existingInHarvest.qty += 1;
            }
            else if (herb) {
                harvestedItems.push({ id: herb.id, name: herb.name, qty: 1 });
            }
        }
        // Chance for rare herb (increases with focus duration)
        const rareChance = Math.min(0.8, durationMinutes * 0.02);
        let rareYieldName = null;
        if (Math.random() < rareChance) {
            const rareHerbIds = [5, 6, 7]; // Starfall Lotus, Dragon's Ember Leaf, Void Shroom
            const rareId = rareHerbIds[Math.floor(Math.random() * rareHerbIds.length)];
            const rareHerb = await client_1.default.item.findUnique({ where: { id: rareId } });
            if (rareHerb) {
                const existingInv = await client_1.default.userInventory.findUnique({
                    where: { userId_itemId: { userId, itemId: rareId } }
                });
                if (existingInv) {
                    await client_1.default.userInventory.update({
                        where: { id: existingInv.id },
                        data: { quantity: existingInv.quantity + 1 }
                    });
                }
                else {
                    await client_1.default.userInventory.create({
                        data: { userId, itemId: rareId, quantity: 1 }
                    });
                }
                rareYieldName = rareHerb.name;
                harvestedItems.push({ id: rareHerb.id, name: rareHerb.name, qty: 1 });
            }
        }
        // Award Herbalist badge if total focus >= 60 min
        if (durationMinutes >= 25) {
            await client_1.default.userBadge.upsert({
                where: { userId_badgeId: { userId, badgeId: 5 } },
                update: {},
                create: { userId, badgeId: 5 }
            });
        }
        // Record session
        await client_1.default.focusSession.create({
            data: {
                userId,
                durationMinutes,
                herbsYielded: JSON.stringify(harvestedItems)
            }
        });
        res.json({
            message: `🌿 Focus session complete! Harvested ${commonHerbCount} herbs from the sacred soil.`,
            harvestedItems,
            rareHerb: rareYieldName
        });
    }
    catch (error) {
        console.error('Garden focus error:', error);
        res.status(500).json({ error: 'Failed to record garden harvest' });
    }
}
async function getShop(req, res) {
    try {
        const userId = req.user?.id;
        const banners = await client_1.default.bannerCosmetic.findMany();
        const stickers = await client_1.default.sticker.findMany();
        let ownedStickerIds = [];
        if (userId) {
            const userStickers = await client_1.default.userSticker.findMany({
                where: { userId },
                select: { stickerId: true }
            });
            ownedStickerIds = userStickers.map(us => us.stickerId);
        }
        const enrichedStickers = stickers.map(s => ({
            ...s,
            priceGold: s.goldCost,
            isOwned: ownedStickerIds.includes(s.id)
        }));
        res.json({ banners, stickers: enrichedStickers });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch shop items' });
    }
}
async function getStickers(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const stickers = await client_1.default.sticker.findMany();
        const userStickers = await client_1.default.userSticker.findMany({
            where: { userId },
            select: { stickerId: true }
        });
        const ownedSet = new Set(userStickers.map(us => us.stickerId));
        const enriched = stickers.map(s => ({
            ...s,
            priceGold: s.goldCost,
            isOwned: ownedSet.has(s.id)
        }));
        res.json({ stickers: enriched });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch stickers' });
    }
}
async function buyBanner(req, res) {
    try {
        const userId = req.user?.id;
        const { bannerId } = req.body;
        if (!userId || !bannerId) {
            res.status(400).json({ error: 'Banner ID is required' });
            return;
        }
        const banner = await client_1.default.bannerCosmetic.findUnique({ where: { id: bannerId } });
        if (!banner) {
            res.status(404).json({ error: 'Banner not found' });
            return;
        }
        const gameData = await client_1.default.gameData.findUnique({ where: { userId } });
        if (!gameData || gameData.gold < banner.priceGold) {
            res.status(400).json({ error: `Insufficient Gold! Need ${banner.priceGold} Gold.` });
            return;
        }
        // Deduct gold
        await client_1.default.gameData.update({
            where: { userId },
            data: { gold: gameData.gold - banner.priceGold }
        });
        // Equip banner immediately
        await client_1.default.user.update({
            where: { id: userId },
            data: { bannerPath: banner.imagePath }
        });
        res.json({
            message: `✨ Purchased and equipped ${banner.name}!`,
            newGold: gameData.gold - banner.priceGold,
            bannerPath: banner.imagePath
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to buy banner' });
    }
}
async function buySticker(req, res) {
    try {
        const userId = req.user?.id;
        const { stickerId } = req.body;
        if (!userId || !stickerId) {
            res.status(400).json({ error: 'Sticker ID is required' });
            return;
        }
        // Execute atomic transaction for gold deduction & duplicate-free purchase
        const result = await client_1.default.$transaction(async (tx) => {
            const sticker = await tx.sticker.findUnique({
                where: { id: stickerId }
            });
            if (!sticker) {
                throw new Error('NOT_FOUND: Sticker not found');
            }
            // Check if already owned
            const existing = await tx.userSticker.findUnique({
                where: {
                    userId_stickerId: { userId, stickerId }
                }
            });
            if (existing) {
                throw new Error('ALREADY_OWNED: You already own this mystical sticker!');
            }
            // Check user gold
            const gameData = await tx.gameData.findUnique({
                where: { userId }
            });
            if (!gameData || gameData.gold < sticker.goldCost) {
                throw new Error(`INSUFFICIENT_GOLD: Need ${sticker.goldCost} Gold (You have ${gameData?.gold || 0} Gold).`);
            }
            // 1. Deduct gold
            const updatedGameData = await tx.gameData.update({
                where: { userId },
                data: { gold: gameData.gold - sticker.goldCost }
            });
            // 2. Insert UserSticker
            const userSticker = await tx.userSticker.create({
                data: {
                    userId,
                    stickerId
                },
                include: { sticker: true }
            });
            return {
                sticker,
                userSticker,
                newGold: updatedGameData.gold
            };
        });
        res.json({
            message: `✨ Successfully acquired ${result.sticker.name}!`,
            sticker: result.sticker,
            newGold: result.newGold
        });
    }
    catch (error) {
        const errMsg = error.message || '';
        if (errMsg.startsWith('NOT_FOUND:')) {
            res.status(404).json({ error: errMsg.replace('NOT_FOUND: ', '') });
        }
        else if (errMsg.startsWith('ALREADY_OWNED:')) {
            res.status(400).json({ error: errMsg.replace('ALREADY_OWNED: ', '') });
        }
        else if (errMsg.startsWith('INSUFFICIENT_GOLD:')) {
            res.status(400).json({ error: errMsg.replace('INSUFFICIENT_GOLD: ', '') });
        }
        else {
            console.error('buySticker transaction error:', error);
            res.status(500).json({ error: 'Failed to complete sticker purchase' });
        }
    }
}

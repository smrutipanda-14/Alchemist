import { Router } from 'express';
import {
  getInventory,
  getMailbox,
  claimMailbox,
  craftPotion,
  getNpcOrders,
  fulfillNpcOrder,
  completeGardenFocus,
  getShop,
  getStickers,
  buyBanner,
  buySticker,
  getLeaderboard
} from '../controllers/gameController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/inventory', getInventory);
router.get('/mailbox', getMailbox);
router.post('/mailbox/claim', claimMailbox);
router.post('/craft', craftPotion);
router.get('/orders', getNpcOrders);
router.post('/orders/fulfill', fulfillNpcOrder);
router.post('/garden/harvest', completeGardenFocus);
router.get('/shop', getShop);
router.get('/stickers', getStickers);
router.post('/shop/buy-banner', buyBanner);
router.post('/shop/buy-sticker', buySticker);
router.get('/leaderboard', getLeaderboard);

export default router;


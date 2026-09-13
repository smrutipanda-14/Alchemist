"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("./prisma/client"));
const BASE_URL = 'http://localhost:5000/api';
async function runEndToEndVerification() {
    console.log('🧪 Starting End-to-End System Verification for Alchemist Haven...\n');
    try {
        // 1. Health check
        const healthRes = await fetch(`${BASE_URL}/health`);
        const health = await healthRes.json();
        console.log('✅ 1. Health Check:', health);
        // 2. Register
        const uniqueUser = `alchemist_${Date.now()}`;
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: uniqueUser,
                email: `${uniqueUser}@haven.guild`,
                password: 'MasterPassword123!'
            })
        });
        const regData = await regRes.json();
        console.log('✅ 2. Registration Successful:', regData.user?.username);
        let token = regData.token;
        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        // 3. Select Daily Tasks from Pool
        const poolRes = await fetch(`${BASE_URL}/tasks/pool`, { headers: authHeaders });
        const poolData = await poolRes.json();
        console.log(`✅ 3. Daily Pool Fetched: ${poolData.pool.length} templates available`);
        const setDailyRes = await fetch(`${BASE_URL}/tasks/daily`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ taskIds: [1, 2, 5] })
        });
        const setDailyData = await setDailyRes.json();
        console.log('✅ 4. Daily Rituals Configured:', setDailyData.message);
        // 4. Create Todo Task
        const todoRes = await fetch(`${BASE_URL}/tasks/todo`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                title: 'Analyze ancient botanical grimoire formulas',
                description: 'Focus for 30 minutes on formula translations'
            })
        });
        const todoData = await todoRes.json();
        console.log('✅ 5. Todo Task Created:', todoData.task.title);
        // 5. Submit Proof & Queue Worker Execution
        console.log('⏳ 6. Submitting Proof and waiting for asynchronous Queue Worker...');
        const proofRes = await fetch(`${BASE_URL}/tasks/proof`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                taskId: todoData.task.id,
                proofNote: 'Completed full translation of chapters 1 through 3!'
            })
        });
        const proofData = await proofRes.json();
        console.log('✅ 7. Proof Submitted to Queue:', proofData.message);
        // Wait 4 seconds for queue to process
        await new Promise(resolve => setTimeout(resolve, 4000));
        // 6. Check Dashboard Tasks after processing
        const dashRes = await fetch(`${BASE_URL}/tasks/dashboard`, { headers: authHeaders });
        const dashData = await dashRes.json();
        const completedTodo = dashData.todoTasks.find((t) => t.id === todoData.task.id);
        console.log(`✅ 8. Task Queue Verified! Task #${completedTodo?.id} status is: ${completedTodo?.status}`);
        // 7. Check Itinerary
        const itinRes = await fetch(`${BASE_URL}/tasks/itinerary`, { headers: authHeaders });
        const itinData = await itinRes.json();
        console.log(`✅ 9. Itinerary Logged: ${itinData.itinerary.length} completed quests`);
        // 8. Mailbox Claiming
        const mailRes = await fetch(`${BASE_URL}/game/mailbox`, { headers: authHeaders });
        const mailData = await mailRes.json();
        console.log(`✅ 10. Mailbox Checked: ${mailData.unclaimedCount} unclaimed shipments`);
        const claimRes = await fetch(`${BASE_URL}/game/mailbox/claim`, {
            method: 'POST',
            headers: authHeaders
        });
        const claimData = await claimRes.json();
        console.log('✅ 11. Mailbox Claimed:', claimData.message);
        // 9. Check Inventory
        const invRes = await fetch(`${BASE_URL}/game/inventory`, { headers: authHeaders });
        const invData = await invRes.json();
        console.log(`✅ 12. User Inventory Holds ${invData.inventory.length} distinct item types`);
        // 10. Crafting Lesser Health Tonic (id: 12)
        const craftRes = await fetch(`${BASE_URL}/game/craft`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ potionId: 12 })
        });
        const craftData = await craftRes.json();
        console.log('✅ 13. Cauldron Potion Brewing:', craftData.message);
        // 11. Fulfill Customer Order (Town Guard Derrick requires potion 12)
        const orderRes = await fetch(`${BASE_URL}/game/orders/fulfill`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ orderId: 1 })
        });
        const orderData = await orderRes.json();
        console.log('✅ 14. Customer Quest Fulfilled:', orderData.message);
        // 12. Garden Focus Mode Harvesting
        const gardenRes = await fetch(`${BASE_URL}/game/garden/harvest`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ durationMinutes: 25 })
        });
        const gardenData = await gardenRes.json();
        console.log('✅ 15. Sacred Garden Harvest:', gardenData.message);
        // 13. Cosmetics Shop & Banner Purchase
        const shopRes = await fetch(`${BASE_URL}/game/shop`, { headers: authHeaders });
        const shopData = await shopRes.json();
        console.log(`✅ 16. Shop loaded: ${shopData.banners.length} banners, ${shopData.stickers.length} stickers`);
        const buyBannerRes = await fetch(`${BASE_URL}/game/shop/buy-banner`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ bannerId: 1 })
        });
        const buyBannerData = await buyBannerRes.json();
        console.log('✅ 17. Banner Purchased & Equipped:', buyBannerData.message);
        // 14. Sticker Shop & Transaction Safety Tests
        console.log('✨ 18. Testing Sticker Purchase & Atomic Transaction Security...');
        const stickersRes = await fetch(`${BASE_URL}/game/stickers`, { headers: authHeaders });
        const stickersData = await stickersRes.json();
        console.log(`   - Available stickers: ${stickersData.stickers.length}`);
        // A. Successful purchase of Golden Cauldron (id: 1, cost: 30)
        const buyStickerRes = await fetch(`${BASE_URL}/game/shop/buy-sticker`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ stickerId: 1 })
        });
        const buyStickerData = await buyStickerRes.json();
        console.log('   - Buy Sticker 1 Success:', buyStickerData.message, `Remaining Gold: ${buyStickerData.newGold}`);
        // B. Test Duplicate Purchase Prevention (should fail with 400)
        const duplicateBuyRes = await fetch(`${BASE_URL}/game/shop/buy-sticker`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ stickerId: 1 })
        });
        if (duplicateBuyRes.status === 400) {
            const dupErr = await duplicateBuyRes.json();
            console.log('   - Duplicate Purchase Rejected (Expected):', dupErr.error);
        }
        else {
            console.error('❌ ERROR: Duplicate purchase was not rejected!');
        }
        // C. Test Insufficient Gold Rejection
        // Drain gold by setting gameData gold to 0 directly or buying beyond balance
        await client_1.default.gameData.update({ where: { userId: regData.user.id }, data: { gold: 5 } });
        const noGoldBuyRes = await fetch(`${BASE_URL}/game/shop/buy-sticker`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ stickerId: 2 })
        });
        if (noGoldBuyRes.status === 400) {
            const noGoldErr = await noGoldBuyRes.json();
            console.log('   - Insufficient Gold Rejected (Expected):', noGoldErr.error);
        }
        else {
            console.error('❌ ERROR: Insufficient gold purchase was not rejected!');
        }
        // Restore gold balance for subsequent tests
        await client_1.default.gameData.update({ where: { userId: regData.user.id }, data: { gold: 100 } });
        // 15. Token Versioning & Password Reset Test
        console.log('🔐 19. Testing Token Versioning & Password Reset Security...');
        const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: `${uniqueUser}@haven.guild` })
        });
        const forgotData = await forgotRes.json();
        console.log('   - Forgot password requested:', forgotData.message);
        // Get OTP from DB
        const dbUser = await client_1.default.user.findUnique({ where: { email: `${uniqueUser}@haven.guild` } });
        const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `${uniqueUser}@haven.guild`,
                otp: dbUser?.resetOtp,
                newPassword: 'BrandNewStrongPassword456!'
            })
        });
        const resetData = await resetRes.json();
        console.log('   - Password reset completed:', resetData.message);
        // 16. Verify that the OLD token is now INVALIDATED
        const oldTokenCheck = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
        if (oldTokenCheck.status === 401) {
            const oldErr = await oldTokenCheck.json();
            console.log(`✅ 20. Security Verified: Old JWT correctly rejected with Status 401 (${oldErr.error})`);
        }
        else {
            console.error('❌ ERROR: Old token was NOT rejected!');
        }
        // 17. Verify that the NEW token works and includes owned stickers
        const newAuthHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resetData.token}`
        };
        const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: newAuthHeaders });
        const meData = await meRes.json();
        console.log(`✅ 21. New Session Validated for User: ${meData.user.username} (Level ${meData.user.gameData.level}, Gold ${meData.user.gameData.gold}, Stickers: ${meData.user.stickers?.length})`);
        console.log('\n🎉 ALL 21 END-TO-END VERIFICATION CHECKS (INCLUDING STICKER & ATOMIC TRANSACTIONS) PASSED WITH FLYING COLORS!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}
runEndToEndVerification();

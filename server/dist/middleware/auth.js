"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = __importDefault(require("../prisma/client"));
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET || 'super_secret_alchemist_master_key_987654321';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Validate token version against DB to ensure revoked/reset sessions cannot be used
        const user = await client_1.default.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true, email: true, tokenVersion: true }
        });
        if (!user) {
            res.status(401).json({ error: 'User no longer exists' });
            return;
        }
        if (user.tokenVersion !== decoded.tokenVersion) {
            res.status(401).json({ error: 'Session invalidated. Please log in again.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
}

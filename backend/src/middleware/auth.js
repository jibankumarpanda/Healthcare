import { verifyToken } from './jwtAuth.js';

// For backwards compatibility, export requireAuth as an alias to verifyToken
export const requireAuth = verifyToken;

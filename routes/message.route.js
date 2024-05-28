import express from 'express';
import sendMessage from '../controller/sendMessage.js';
import protectedRoute from '../middleware/protectedRoute.js';

const router = express.Router();

router.post('/sent/:id', protectedRoute, sendMessage);

export default router;

import express from 'express';
import ChatController from '../Controllers/ChatController.js';
import ChatRepository from '../Persistence/ChatRepository.js';

const router = express.Router();
const chatController = new ChatController(new ChatRepository());

router.post('/', (req, res) => chatController.saveHistory(req, res));
router.get('/', (req, res) => chatController.getHistory(req, res));
router.get('/recent', (req, res) => chatController.getRecentHistory(req, res));

export default router;
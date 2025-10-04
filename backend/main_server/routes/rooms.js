import express from 'express';
const router = express.Router();
import {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  addMemberToRoom as addMember,
  removeMember,
  addCodeSnippet,
  addChatMessage
} from '../controllers/Room.controller.js';
import { protect } from '../middleware/auth.js';

// Base route: /api/v1/rooms
router
  .route('/')
  .get(getRooms)
  .post(protect, createRoom);

router
  .route('/:id')
  .get(getRoom)
  .put(protect, updateRoom)
  .delete(protect, deleteRoom);

// Room members
router
  .route('/:id/members')
  .post(protect, addMember);

router
  .route('/:id/members/:userId')
  .delete(protect, removeMember);

// Code snippets
router
  .route('/:id/code')
  .post(protect, addCodeSnippet);

// Chat messages
router
  .route('/:id/chat')
  .post(protect, addChatMessage);

export default router;

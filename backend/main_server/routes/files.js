import express from "express";
const router = express.Router();

import { 
  uploadFile, 
  getRoomFiles, 
  deleteFile,
  saveFileMeta   // ✅ make sure to import it
} from "../controllers/Room.controller.js";

import { protect } from "../middleware/auth.js";
import multer from "multer";
import path from "path";

// Multer storage (only needed if you still want backend uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const filetypes =
      /jpeg|jpg|png|gif|pdf|doc|docx|txt|md|csv|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz|js|jsx|ts|tsx|json|css|html|xml|yaml|yml/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("File type not allowed"));
  },
});

// ---------------- ROUTES ----------------

// Get all files for a room
router.get("/:roomCode", getRoomFiles);

// Option A: Upload via backend (multer + local upload → Cloudinary later)
router.post("/:roomCode", protect, upload.single("file"), uploadFile);

// Option B: Save file metadata from frontend (Cloudinary direct upload)
router.post("/:roomCode/upload", saveFileMeta);

// Delete a specific file
router.delete("/:fileId", protect, deleteFile);

export default router;

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, unique + '-' + safe);
  }
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['image/png','image/jpeg','image/gif','application/pdf','image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error('Unsupported file type'));
}

export const attachmentsUpload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024, files: 10 } });

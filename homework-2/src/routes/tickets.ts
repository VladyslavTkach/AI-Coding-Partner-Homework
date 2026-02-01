import { Router } from 'express';
import multer from 'multer';
import * as ticketController from '../controllers/ticketController';
import { classificationController } from '../controllers/classificationController';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/json',
      'application/xml',
      'text/xml',
      'application/octet-stream' // For files without proper MIME type
    ];

    const allowedExtensions = ['csv', 'json', 'xml'];
    const extension = file.originalname.toLowerCase().split('.').pop();

    if (allowedMimes.includes(file.mimetype) || (extension && allowedExtensions.includes(extension))) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, and XML files are allowed.'));
    }
  }
});

// POST /tickets - Create a new ticket
router.post('/', ticketController.create);

// POST /tickets/import - Bulk import tickets from file
router.post('/import', upload.single('file'), ticketController.importTickets);

// GET /tickets - List all tickets with optional filtering
router.get('/', ticketController.getAll);

// POST /tickets/:id/auto-classify - Auto-classify a ticket
router.post('/:id/auto-classify', classificationController.autoClassify);

// GET /tickets/:id/classification-history - Get classification history
router.get('/:id/classification-history', classificationController.getHistory);

// GET /tickets/:id - Get specific ticket by ID
router.get('/:id', ticketController.getById);

// PUT /tickets/:id - Update ticket
router.put('/:id', ticketController.update);

// DELETE /tickets/:id - Delete ticket
router.delete('/:id', ticketController.remove);

export default router;

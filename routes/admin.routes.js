import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
const router = express.Router();

// 
router
    .post('/create', adminController.createAdmin);

export default router;
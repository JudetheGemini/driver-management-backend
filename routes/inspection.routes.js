import express from 'express';
const router = express.Router();
import * as inspectionController from '../controllers/inspection.controller.js';

// Daily inspection routes
router
    .route('/daily')
    .post(inspectionController.createDailyInspection);

// Get today's inspections  
router
    .route('/today')
    .get(inspectionController.getTodaysInspections);

// Get all inspections
router
    .route('/')
    .get(inspectionController.getAllInspections);

// Get inspection by ID
router
    .route('/:id')
    .get(inspectionController.getInspection);

// Route to create detailed inspection
// This route allows the creation of a detailed inspection
router
    .route('/create')
    .post(inspectionController.createDetailedInspection);

export default router;
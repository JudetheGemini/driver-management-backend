import express from 'express';
const router = express.Router();
import * as vehicleController from '../controllers/vehicle.controller.js';
import validateVehicle from '../utils/vehicleValidation.js';

// This route allows you to get all vehicles
router
  .route('/')
  .get(vehicleController.getAllVehicles)

// Route to create a new vehicle
router
  .route('/create')
  .post(validateVehicle, vehicleController.createVehicle);

// Route to get, update, or delete a vehicle by ID
// This route allows you to get, update, or delete a vehicle by its ID
router
  .route('/:id')
  .get(vehicleController.getVehicle)
  .patch(validateVehicle, vehicleController.updateVehicle)
  .delete(vehicleController.deleteVehicle);

// Route to get all inspections for a specific vehicle
router
  .route('/:id/inspections')
  .get(vehicleController.getVehicleInspections)   


export default router;
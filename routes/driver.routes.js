import express from 'express';
import * as driverController from '../controllers/driver.controller.js';
const router = express.Router();

// This route allows you to get all drivers
router
  .route('/') // on this route you can do only GET and POST
  .get(driverController.getAllDrivers)
  
// Route to create a new driver
router
  .route('/register')
  .post(driverController.registerDriver);

// Route to get, update, or delete a driver by ID
// This route allows you to get, update, or delete a driver by its ID
router
  .route('/:id') // on this route you can do only GET, PATCH and DELETE
  .get(driverController.getDriver)
  .patch(driverController.updateDriver)
  .delete(driverController.deleteDriver);

export default router;
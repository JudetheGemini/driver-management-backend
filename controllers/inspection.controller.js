import pool from '../config/db.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { nanoid } from 'nanoid';

export const createDailyInspection = catchAsync(async (req, res, next) => {
  const { driver_id, vehicle_id } = req.body;
  
  // Verify driver and vehicle exist
  const [driver] = await pool.execute(
    'SELECT 1 FROM drivers WHERE driver_id = ?',
    [driver_id]
  );
  
  const [vehicle] = await pool.execute(
    'SELECT 1 FROM vehicles WHERE vehicle_id = ?',
    [vehicle_id]
  );

  if (!driver[0] || !vehicle[0]) {
    return next(new AppError('Driver or vehicle not found', 404));
  }

  // Check if inspection already exists today
  const [existing] = await pool.execute(
    `SELECT 1 FROM inspections 
     WHERE driver_id = ? AND vehicle_id = ? 
     AND DATE(inspection_date) = CURDATE()`,
    [driver_id, vehicle_id]
  );

  if (existing[0]) {
    return next(new AppError('Daily inspection already logged for this vehicle', 400));
  }

  // Create inspection record
  const inspectionId = nanoid(6);
  const [result] = await pool.execute(
    `INSERT INTO inspections 
    (inspection_id, driver_id, vehicle_id) 
    VALUES (?, ?, ?, ?)`,
    [inspectionId, driver_id, vehicle_id, mileage]
  );
  
  // Return minimal response
  res.status(201).json({
    status: 'success',
    data: {
      inspection_id: inspectionId,
      message: 'Daily inspection logged successfully'
    }
  });
});

// Get inspections for present day
export const getTodaysInspections = catchAsync(async (req, res, next) => {
  const [inspections] = await pool.execute(
    `SELECT i.inspection_id, i.inspection_date,
     d.first_name, d.last_name, d.license_number,
     v.make, v.model, v.registration_number
     FROM inspections i
     JOIN drivers d ON i.driver_id = d.driver_id
     JOIN vehicles v ON i.vehicle_id = v.vehicle_id
     WHERE DATE(i.inspection_date) = CURDATE()`
  );

  res.status(200).json({
    status: 'success',
    results: inspections.length,
    data: {
      inspections
    }
  });
});

// Get inspection by ID
export const getInspection = catchAsync(async (req, res, next) => {
 const inspectionId = req.params.id;

  // 1. Fetch main inspection record
  const [inspection] = await pool.execute(
    `SELECT i.*, 
     d.first_name AS driver_name,
     v.registration_number AS vehicle_plate
     FROM inspections i
     JOIN drivers d ON i.driver_id = d.driver_id
     JOIN vehicles v ON i.vehicle_id = v.vehicle_id
     WHERE i.inspection_id = ?`,
    [inspectionId]
  );

  if (!inspection[0]) throw new AppError('Inspection not found', 404);

  // 2. Fetch all related data in parallel
  const [
    engineChecks,
    acStatus,
    bodyDamages,
    tireChecks,
    lightChecks,
    groundChecks,
    seatbeltChecks,
    toolsChecks,
  ] = await Promise.all([
    pool.execute('SELECT * FROM engine_checks WHERE inspection_id = ?', [inspectionId]),
    pool.execute('SELECT * FROM ac_status WHERE inspection_id = ?', [inspectionId]),
    pool.execute('SELECT * FROM body_damages WHERE inspection_id = ?', [inspectionId]),
    pool.execute('SELECT * FROM tire_checks WHERE inspection_id = ?', [inspectionId]),
    pool.execute('SELECT * FROM light_checks WHERE inspection_id = ?', [inspectionId]),
    pool.execute('SELECT * FROM ground_checks WHERE inspection_id = ?', [inspectionId]),
    pool.execute('SELECT * FROM seatbelt_checks WHERE inspection_id = ?', [inspectionId]),
    pool.execute('SELECT * FROM tools_check WHERE inspection_id = ?', [inspectionId])
  ]);

  // 3. Return unified response
  res.json({
    status: 'success',
    data: {
      ...inspection[0],
      engine_checks: engineChecks[0][0] || null,
      ac_status: acStatus[0][0] || null,
      body_damages: bodyDamages[0],
      tire_checks: tireChecks[0][0] || null,
      light_checks: lightChecks[0][0] || null,
      ground_checks: groundChecks[0][0] || null,
      seatbelt_checks: seatbeltChecks[0][0] || null,
      tools_check: toolsChecks[0][0] || null
    }
  });
})

// Create detailed inspection
// This function creates a detailed inspection record
export const createDetailedInspection = catchAsync(async (req, res, next) => {
  const {
    driver_id,
    vehicle_id,
    engine_checks,
    ac_status,
    body_damages = [],
    tire_checks,
    ground_checks,
    light_checks,
    seatbelt_checks,
    tools_checks
  } = req.body;

  // 1. Validate required fields
  if (!driver_id || !vehicle_id) {
    return next(new AppError('Driver ID and Vehicle ID are required', 400));
  }

  // 2. Verify driver and vehicle exist
  const [driver, vehicle] = await Promise.all([
    pool.execute('SELECT 1 FROM drivers WHERE driver_id = ?', [driver_id]),
    pool.execute('SELECT 1 FROM vehicles WHERE vehicle_id = ?', [vehicle_id])
  ]);

  if (!driver[0]?.[0] || !vehicle[0]?.[0]) {
    return next(new AppError('Driver or vehicle not found', 404));
  }

  // Check if inspection already exists today
  const [existing] = await pool.execute(
    `SELECT 1 FROM inspections 
     WHERE driver_id = ? AND vehicle_id = ? 
     AND DATE(inspection_date) = CURDATE()`,
    [driver_id, vehicle_id]
  );

  if (existing[0]) {
    return next(new AppError('Daily inspection already logged for this vehicle', 400));
  }

  // 3. Start transaction
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 4. Create main inspection record
    const inspectionId = nanoid(8);
    await connection.execute(
      `INSERT INTO inspections (inspection_id, driver_id, vehicle_id) 
       VALUES (?, ?, ?)`,
      [inspectionId, driver_id, vehicle_id]
    );

    // 5. Insert all inspection components in parallel
    await Promise.all([
      // Engine checks
      engine_checks && connection.execute(
        `INSERT INTO engine_checks 
         (inspection_id, engine_oil_level, engine_oil_color, brake_oil_level) 
         VALUES (?, ?, ?, ?)`,
        [
          inspectionId,
          engine_checks.engine_oil_level,
          engine_checks.engine_oil_color,
          engine_checks.brake_oil_level
        ]
      ),
      
      // AC status
      ac_status && connection.execute(
        `INSERT INTO ac_status (inspection_id, status) 
         VALUES (?, ?)`,
        [inspectionId, ac_status.status]
      ),
      
      // Body damages (multiple records)
      body_damages.length > 0 && Promise.all(
        body_damages.map(damage => connection.execute(
          `INSERT INTO body_damages 
           (inspection_id, damage_type, location, is_recent) 
           VALUES (?, ?, ?, ?)`,
          [inspectionId, damage.damage_type, damage.location, damage.is_recent]
        ))
      ),
      
      // Tire checks
      tire_checks && connection.execute(
        `INSERT INTO tire_checks 
         (inspection_id, front_left_condition, front_right_condition, 
          back_left_condition, back_right_condition) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          inspectionId,
          tire_checks.front_left_condition,
          tire_checks.front_right_condition,
          tire_checks.back_left_condition,
          tire_checks.back_right_condition
        ]
      ),
      
      // Ground checks
      ground_checks && connection.execute(
        `INSERT INTO ground_checks 
         (inspection_id, oil_on_floor, oil_on_tires) 
         VALUES (?, ?, ?)`,
        [inspectionId, ground_checks.oil_on_floor, ground_checks.oil_on_tires]
      ),
      
      // Light checks
      light_checks && connection.execute(
        `INSERT INTO light_checks 
         (inspection_id, full_light, dim_light, brake_light) 
         VALUES (?, ?, ?, ?)`,
        [
          inspectionId,
          light_checks.full_light,
          light_checks.dim_light,
          light_checks.brake_light
        ]
      ),
      
      // Seatbelt checks
      seatbelt_checks && connection.execute(
        `INSERT INTO seatbelt_checks 
         (inspection_id, front_left, front_right, back_left, back_right, back_middle) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          inspectionId,
          seatbelt_checks.front_left,
          seatbelt_checks.front_right,
          seatbelt_checks.back_left,
          seatbelt_checks.back_right,
          seatbelt_checks.back_middle
        ]
      ),
      
      // Tools checks
      tools_checks && connection.execute(
        `INSERT INTO tools_check 
         (inspection_id, spare_tire, jack_wheel_spanner, caution_triangle, fire_extinguisher) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          inspectionId,
          tools_checks.spare_tire,
          tools_checks.jack_wheel_spanner,
          tools_checks.caution_triangle,
          tools_checks.fire_extinguisher
        ]
      )
    ]);

    // 6. Commit transaction
    await connection.commit();
    
    res.status(201).json({
      status: 'success',
      data: {
        inspection_id: inspectionId,
        message: 'Full inspection recorded successfully'
      }
    });

  } catch (err) {
    await connection.rollback();
    next(new AppError(`Inspection creation failed: ${err.message}`, 500));
  } finally {
    connection.release();
  }
});
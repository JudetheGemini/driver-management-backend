import { hashPassword } from "../utils/authUtils.js"
import pool from '../config/db.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

// This endpoint creates an admin in the DB
export const createAdmin = catchAsync(async (req, res) => {
  const { firstname, lastname, email, phone_number, password } = req.body;
  
  // 1. Generate credentials
  const { hash, salt } = await hashPassword(password);
  const adminId = email.split('@')[0]; // Or use nanoid()

  // 2. Store in database
  await pool.execute(
    `INSERT INTO admins 
     (admin_id, firstname, lastname, email, phone_number, password_hash, password_salt) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [adminId, firstname, lastname, email, phone_number, hash, salt]
  );

  res.status(201).json({
    status: 'success',
    data: { adminId }
  });
});
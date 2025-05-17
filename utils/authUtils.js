// utils/authUtils.js
import bcrypt from 'bcryptjs';
const saltRounds = 12;

export const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(saltRounds); // creates a salt
  const hash = await bcrypt.hash(plainPassword, salt); // creates a hash
  return { hash, salt }; // returns the hash and the salt
};

export const verifyPassword = async (plainPassword, storedHash, salt) => {
  return await bcrypt.compare(plainPassword, storedHash);
};
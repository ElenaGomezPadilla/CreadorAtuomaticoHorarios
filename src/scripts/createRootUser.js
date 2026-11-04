import mongoose from 'mongoose';
import User from '../models/user.models.js';
import bcrypt from 'bcryptjs';

const createRootUser = async () => {
  const existingRoot = await User.findOne({ username: 'root' });
  if (!existingRoot) {
    const hashedPassword = await bcrypt.hash('123', 10);
    await User.create({
      username: 'root',
      email: 'root@example.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Usuario root creado');
  } else {
    console.log('Usuario root ya existe');
  }
};

export default createRootUser;

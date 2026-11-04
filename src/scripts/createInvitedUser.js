import mongoose from 'mongoose';
import User from '../models/user.models.js';
import bcrypt from 'bcryptjs';

const createInvitadoUser = async () => {
  const existingRoot = await User.findOne({ username: 'invitado' });
  if (!existingRoot) {
    const hashedPassword = await bcrypt.hash('123', 10);
    await User.create({
      username: 'invitado',
      email: 'invitado@example.com',
      password: hashedPassword,
      role: 'invitado',
    });
    console.log('✅ Usuario invitado creado');
  } else {
    console.log('ℹ️ Usuario invitado ya existe');
  }
};

export default createInvitadoUser;

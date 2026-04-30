import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Role, User } from './models/User.model';

interface SeedUser {
  email: string;
  password: string;
  role: Role;
}

const seeds: SeedUser[] = [
  { email: 'admin@lms.com', password: 'Admin@123', role: 'admin' },
  { email: 'sales@lms.com', password: 'Sales@123', role: 'sales' },
  { email: 'sanction@lms.com', password: 'Sanction@123', role: 'sanction' },
  { email: 'disburse@lms.com', password: 'Disburse@123', role: 'disbursement' },
  { email: 'collection@lms.com', password: 'Collection@123', role: 'collection' },
  { email: 'borrower@lms.com', password: 'Borrower@123', role: 'borrower' },
];

async function seed(): Promise<void> {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    for (const account of seeds) {
      const hashedPassword = await bcrypt.hash(account.password, 10);

      await User.findOneAndUpdate(
        { email: account.email },
        {
          $set: {
            email: account.email,
            password: hashedPassword,
            role: account.role,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`[${account.role.padEnd(12)}] ${account.email} / ${account.password}`);
    }

    console.log('Seed completed');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

void seed();

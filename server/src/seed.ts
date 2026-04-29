import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User.model';

interface SeedUser { email: string; password: string; role: string; }

const seeds: SeedUser[] = [
  { email: 'admin@lms.com',      password: 'Admin@123',      role: 'admin'       },
  { email: 'sales@lms.com',      password: 'Sales@123',      role: 'sales'       },
  { email: 'sanction@lms.com',   password: 'Sanction@123',   role: 'sanction'    },
  { email: 'disburse@lms.com',   password: 'Disburse@123',   role: 'disbursement'},
  { email: 'collection@lms.com', password: 'Collection@123', role: 'collection'  },
  { email: 'borrower@lms.com',   password: 'Borrower@123',   role: 'borrower'    },
];

async function seed(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('❌ MONGO_URI not set'); process.exit(1); }

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    for (const s of seeds) {
      await User.deleteOne({ email: s.email });
      // User.create() triggers the pre-save bcrypt hook automatically
      await User.create({ email: s.email, password: s.password, role: s.role });
      console.log(`  ✓ [${s.role.padEnd(12)}] ${s.email}  /  ${s.password}`);
    }

    console.log('\n🎉 Seed completed!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

void seed();
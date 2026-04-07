import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Ensure we look for the .env in the current directory (backend/)
dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI is not defined in .env');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('🚀 MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export { mongoose };
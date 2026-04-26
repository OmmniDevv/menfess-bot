import mongoose from 'mongoose';
import { config } from '../config';

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Connected successfully');
  });

  mongoose.connection.on('error', (err: Error) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected');
  });

  await mongoose.connect(config.mongodbUri, {
    serverSelectionTimeoutMS: 10_000,
  });
}

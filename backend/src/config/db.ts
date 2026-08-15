import mongoose from 'mongoose';

export default async function connectDB(uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce_starter') {
  try {
    const connection = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

const mongoose = require('mongoose');

let isConnecting = false;
let connectionPromise = null;

const connectDatabase = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return;
  }

  // If already connecting, return the existing promise
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;

  connectionPromise = (async () => {
    try {
      const mongoURI = process.env.MONGODB_URI;

      if (!mongoURI) {
        console.error('❌ MONGODB_URI environment variable is not set!');
        console.error('Please set MONGODB_URI in your environment variables.');
        isConnecting = false;
        return;
      }

      console.log('🔄 Attempting to connect to MongoDB...');
      console.log('MongoDB URI:', mongoURI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs

      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      isConnecting = false;
      
      // Handle connection errors
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
        isConnecting = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        isConnecting = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      return conn;
    } catch (error) {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
      isConnecting = false;
      throw error;
    }
  })();

  return connectionPromise;
};

module.exports = connectDatabase;


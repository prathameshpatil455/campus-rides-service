import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in environment variables. Please create a .env file with MONGODB_URI."
      );
    }

    const dbName = process.env.DB_NAME || "campusRides";

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: dbName,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

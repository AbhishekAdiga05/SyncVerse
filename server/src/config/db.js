import mongoose from "mongoose";
import dotenv from "dotenv"
import dns from "dns"

// Force Node.js to use Google DNS to bypass local network DNS blocking
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config()
export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if IP is blocked
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

import mongoose from "mongoose";
import { User } from "../shared/schema"; // Adjust path based on your structure
import { AuthService } from "../services/auth";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/codegrade";

async function registerAdmin() {
  await mongoose.connect(MONGODB_URI);
  
  const adminPassword = await AuthService.hashPassword("chetan@123");
  
  await User.findOneAndUpdate(
    { username: "chetan" },
    {
      username: "chetan",
      passwordHash: adminPassword,
      role: "admin",
      isVerified: true,
      firstName: "Chetan",
      lastName: "Admin",
      email: "chetan1163.be23@chitkarauniversity.edu.in"
    },
    { upsert: true, new: true }
  );

  console.log("✅ Admin user created/updated successfully");
  process.exit(0);
}

registerAdmin().catch(console.error);
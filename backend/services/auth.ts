import bcrypt from 'bcryptjs'; // Using bcryptjs for better cross-platform stability
import jwt from 'jsonwebtoken';
import { type User } from "../shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user: any): string {
    // FIX: MongoDB uses _id. We ensure the token gets a string ID.
    const id = user.id || user._id;
    
    return jwt.sign(
      { 
        id: id.toString(), 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
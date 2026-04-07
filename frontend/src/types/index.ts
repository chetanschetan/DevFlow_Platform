export interface IActivityLogEntry {
  type: 'run' | 'submit' | 'editor' | 'login';
  timestamp: Date;
  details: Record<string, any>;
}

export interface IUser {
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string;
  course: string;
  section: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  registerDate: Date;
  lastLogin?: Date;
  activityLog: IActivityLogEntry[];
}
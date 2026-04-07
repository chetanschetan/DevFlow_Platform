import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// FIX: Use a relative path to your schema from the scripts folder
import { User } from '../shared/schema'; 
import dotenv from 'dotenv';

dotenv.config();


const emailIds = [
'alisha1054.be23@chitkarauniversity.edu.in',
'ashutosh1132.be23@chitkarauniversity.edu.in',
'atharva1135.be23@chitkarauniversity.edu.in',
'atishya1136.be23@chitkarauniversity.edu.in',
'atul1137.be23@chitkarauniversity.edu.in',
'avinash1138.be23@chitkarauniversity.edu.in',
'ayush1143.be23@chitkarauniversity.edu.in',
'ayush1145.be23@chitkarauniversity.edu.in',
'ayush1148.be23@chitkarauniversity.edu.in',
'bharat1151.be23@chitkarauniversity.edu.in',
'bhavya1152.be23@chitkarauniversity.edu.in',
'bhavya1153.be23@chitkarauniversity.edu.in',
'bhoomi1157.be23@chitkarauniversity.edu.in',
'bhoomika1158.be23@chitkarauniversity.edu.in',
'bhupesh1159.be23@chitkarauniversity.edu.in',
'brinda1161.be23@chitkarauniversity.edu.in',
'chirag1165.be23@chitkarauniversity.edu.in',
'daksh1170.be23@chitkarauniversity.edu.in',
'darshit1171.be23@chitkarauniversity.edu.in',
'debjit1172.be23@chitkarauniversity.edu.in',
'deepak1173.be23@chitkarauniversity.edu.in',
'deepak1175.be23@chitkarauniversity.edu.in',
'deepanshu1178.be23@chitkarauniversity.edu.in',
'deepanshu1179.be23@chitkarauniversity.edu.in',
'deesh1180.be23@chitkarauniversity.edu.in',
'devang1181.be23@chitkarauniversity.edu.in',
'devansh1182.be23@chitkarauniversity.edu.in',
'devansh1184.be23@chitkarauniversity.edu.in',
'dharambir1186.be23@chitkarauniversity.edu.in',
'dishant1188.be23@chitkarauniversity.edu.in',
'divya1190.be23@chitkarauniversity.edu.in',
'divyansh1191.be23@chitkarauniversity.edu.in',
'dixit1192.be23@chitkarauniversity.edu.in',
'diya1193.be23@chitkarauniversity.edu.in',
'diya1194.be23@chitkarauniversity.edu.in',
'garvit1199.be23@chitkarauniversity.edu.in',
'gaurav1201.be23@chitkarauniversity.edu.in',
'gaurav1202.be23@chitkarauniversity.edu.in',
'gautam1203.be23@chitkarauniversity.edu.in',
'gautam1204.be23@chitkarauniversity.edu.in',
'geetansha1206.be23@chitkarauniversity.edu.in',
'guddu1209.be23@chitkarauniversity.edu.in',
'gurdev1210.be23@chitkarauniversity.edu.in',
'hansika1214.be23@chitkarauniversity.edu.in',
'harash1215.be23@chitkarauniversity.edu.in',
'hardik1216.be23@chitkarauniversity.edu.in',
'hari1217.be23@chitkarauniversity.edu.in',
'harsh1219.be23@chitkarauniversity.edu.in',
'harsh1220.be23@chitkarauniversity.edu.in',
'harsh1222.be23@chitkarauniversity.edu.in',
'harsh1225.be23@chitkarauniversity.edu.in',
'harsha1227.be23@chitkarauniversity.edu.in',
'harshdeep1228.be23@chitkarauniversity.edu.in',
'harshit1229.be23@chitkarauniversity.edu.in',
'harshit1230.be23@chitkarauniversity.edu.in',
'harshita1235.be23@chitkarauniversity.edu.in',
'harshita1236.be23@chitkarauniversity.edu.in',
'hemanshu1238.be23@chitkarauniversity.edu.in',
'himanshu1241.be23@chitkarauniversity.edu.in',
'himanshu1242.be23@chitkarauniversity.edu.in',
'hiten1243.be23@chitkarauniversity.edu.in',
'huma1244.be23@chitkarauniversity.edu.in',
'irfan1245.be23@chitkarauniversity.edu.in',
'ishan1246.be23@chitkarauniversity.edu.in',
'jaideep1252.be23@chitkarauniversity.edu.in',
'janvi1253.be23@chitkarauniversity.edu.in',
'jaspreet1254.be23@chitkarauniversity.edu.in',
'jatin1255.be23@chitkarauniversity.edu.in',
'jatin1257.be23@chitkarauniversity.edu.in',
'jatin1258.be23@chitkarauniversity.edu.in',
'jitashi1260.be23@chitkarauniversity.edu.in',
'jyoti1263.be23@chitkarauniversity.edu.in',
'kanika1266.be23@chitkarauniversity.edu.in',
'kanishka1267.be23@chitkarauniversity.edu.in',
'katyaini1624.be23@chitkarauniversity.edu.in'
];

const registerStudents = async () => {
  try {
    // Use your .env URI or the fallback
    const uri = process.env.MONGODB_URI || 'mongodb+srv://codegradecg:4u48sTg2gl2wHwQl@codegrade.snmmdrv.mongodb.net/codegrade?retryWrites=true';
    
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(uri);

    const currentDate = new Date();

    for (const email of emailIds) {
      const username = email.split('.')[0];
      
      // FIX: Check if user exists before creating to avoid "Duplicate Key" errors
      const exists = await User.findOne({ email });
      if (exists) {
        console.log(`⏩ Skipping: ${username} (Already exists)`);
        continue;
      }

      const passwordHash = await bcrypt.hash(username, 10);

      const newUser = {
        username,
        email,
        passwordHash,
        // Capitalize first letter (e.g., 'alisha' -> 'Alisha')
        firstName: username.charAt(0).toUpperCase() + username.slice(1).replace(/[0-9]/g, ''),
        // FIX: Mongoose required validation fails on an empty string ''
        // Use 'Student' or '.' to satisfy the schema requirement
        lastName: 'Student',
        course: 'BE',
        section: 'B',
        role: 'student',
        isVerified: true,
        registerDate: currentDate,
        activityLog: [{
          type: 'login',
          timestamp: currentDate,
          details: { message: 'Initial registration' }
        }]
      };

      await User.create(newUser);
      console.log(`✅ Registered: ${username}`);
    }

    console.log('🚀 All students processed successfully.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

registerStudents();
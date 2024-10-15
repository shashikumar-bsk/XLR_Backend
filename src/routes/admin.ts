import express, { Request, Response } from 'express';
import Admin from '../db/models/admin';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import redisClient from '../../src/redis/redis'

require('dotenv').config();

const AdminRouter = express.Router();
const API_KEY = process.env.API_KEY;
const CLIENT_ID = process.env.CLIENT_ID; // Ensure your client ID is set in the environment variables
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Ensure your client secret is set in the environment variables
const APP_ID = process.env.APP_ID; // Ensure your app ID is set in the environment variables

dotenv.config();



// Ensure all environment variables are defined
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.BUCKET_REGION || !process.env.BUCKET_NAME) {
  throw new Error('Missing necessary AWS configuration in .env file');
}

// Configure AWS S3 using S3Client
const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer to use S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME as string,
    // acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `admin_image/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Create a new admin with admin_image
AdminRouter.post('/', upload.single('admin_image'), async (req: Request, res: Response) => {
  try {
    const { admin_name, email, password, mobile_number } = req.body;
    const admin_image = (req.file as any)?.location; // Correctly access the file location

    // Validate required fields
    if (!admin_name || !email || !password || !mobile_number) {
      return res.status(400).send({ message: 'Please fill in all required fields.' });
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).send({ message: 'Please enter a valid email address.' });
    }

    // Validate mobile number format
    if (!/^\d{10}$/.test(mobile_number)) {
      return res.status(400).send({ message: 'Please enter a valid 10-digit mobile number.' });
    }

    // Check if admin with the same email already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).send({ message: 'Admin with this email already exists.' });
    }

    // Check if admin with the same mobile number already exists
    const existingAdminByMobile = await Admin.findOne({ where: { mobile_number } });
    if (existingAdminByMobile) {
      return res.status(400).send({ message: 'Admin with this mobile number already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const createAdmin = await Admin.create({
      admin_name,
      email,
      password: hashedPassword,
      mobile_number,
      admin_image // Include the image URL in the creation
    });
    

    return res.status(200).send({ message: 'Admin created successfully', data: createAdmin });
  } catch (error: any) {
    console.error('Error in creating admin:', error);
    return res.status(500).send({ message: `Error in creating admin: ${error.message}` });
  }
});



// Admin login
AdminRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).send({ message: 'Please fill in all required fields.' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(400).send({ message: 'Invalid email or password.' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).send({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: admin.admin_id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    return res.status(200).send({ message: 'Login successful', token });
  } catch (error: any) {
    console.error('Error in admin login:', error);
    return res.status(500).send({ message: `Error in admin login: ${error.message}` });
  }
});

// Get admin by ID
AdminRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(id)
    // Check if the admin details are already in Redis
    redisClient.get(`admin:${id}`, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (cachedData) {
        // If data is found in Redis, parse it and send the response
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      // If data is not in Redis, fetch it from the database
      const admin = await Admin.findOne({ where: { admin_id: id } });

      if (!admin) {
        return res.status(404).send({ message: 'Admin not found.' });
      }

      // Store the admin details in Redis with an expiration time (e.g., 60 seconds)
      // redisClient.setex(`admin:${id}`, 60, JSON.stringify(admin), (redisErr) => {
      //   if (redisErr) {
      //     console.error('Error setting data in Redis:', redisErr);
      //   }
      // });
     await redisClient.set(`admin:${id}`,JSON.stringify(admin));
     await redisClient.expire(`admin:${id}`,2)
     console.log(redisClient.get(`admin:${id}`))
      return res.status(200).send("admin");
    });
  } catch (error: any) {
    console.error('Error in fetching admin by ID:', error);
    return res.status(500).send({ message: `Error in fetching admin: ${error.message}` });
  }
});
// Get all admins
AdminRouter.get('/', async (req: Request, res: Response) => {
  const cacheKey = 'allAdmins'; // Define a cache key for all admins

  try {
    // Check if the admins data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Fetch the admins data from the database
      const admins = await Admin.findAll();

      // Store the admins data in Redis with an expiration time of 5 minutes
      await redisClient.set(cacheKey, JSON.stringify(admins));
      await redisClient.expire(cacheKey, 150); // Cache expiration time in seconds (5 minutes)

      // Respond with the admins data
      res.status(200).json(admins);
    });
  } catch (error: any) {
    console.error('Error in fetching admins:', error);
    res.status(500).json({ message: `Error in fetching admins: ${error.message}` });
  }
});

// Update admin
AdminRouter.patch('/:id', upload.single('admin_image'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { admin_name, email, password, mobile_number } = req.body;
    // console.log(req.body)
    const admin_image = (req.file as any)?.location;

    const admin = await Admin.findOne({ where: { admin_id: id } });
    if (!admin) {
      return res.status(404).send({ message: 'Admin not found.' });
    }

    // Validate email format
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).send({ message: 'Please enter a valid email address.' });
    }

    // Validate mobile number format
    if (mobile_number && !/^\d{10}$/.test(mobile_number)) {
      return res.status(400).send({ message: 'Please enter a valid 10-digit mobile number.' });
    }

    // Check if admin with the same email already exists
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ where: { email } });
      if (existingAdmin) {
        return res.status(400).send({ message: 'Admin with this email already exists.' });
      }
    }

    // Check if admin with the same mobile number already exists
    if (mobile_number && mobile_number !== admin.mobile_number) {
      const existingAdminByMobile = await Admin.findOne({ where: { mobile_number } });
      if (existingAdminByMobile) {
        return res.status(400).send({ message: 'Admin with this mobile number already exists.' });
      }
    }

    // Hash new password if provided
    let updatedPassword = admin.password;
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    // Update admin
    const updateData: any = { admin_name, email, password: updatedPassword, mobile_number };
    console.log(updateData)
    if (admin_image) {
      updateData.admin_image = admin_image;
    }
    await Admin.update(updateData, { where: { admin_id: id } });

    return res.status(200).send({ message: 'Admin updated successfully' });
  } catch (error: any) {
    console.error('Error in updating admin:', error);
    return res.status(500).send({ message: `Error in updating admin: ${error.message}` });
  }
});

//Update image route
AdminRouter.patch("/:id/admin_image", upload.single("admin_image"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin_image = (req.file as any)?.location;

    // Check if the image is provided
    if (!admin_image) {
      return res.status(400).send({ message: "Profile image is required." });
    }

    // Find the user by ID
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).send({ message: "Admin not found." });
    }

    // Update only the profile image
    admin.admin_image = admin_image;

    // Save the updated user to the database
    await admin.save();

    return res.status(200).send({ message: "Profile image updated successfully", data: admin });
  } catch (error: any) {
    console.error("Error in updating profile image:", error);
    return res.status(500).send({ message: `Error in updating profile image: ${error.message}` });
  }
});

// Delete (soft delete) admin
AdminRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findOne({ where: { admin_id: id } });
    if (!admin) {
      return res.status(404).send({ message: 'Admin not found.' });
    }

    // Soft delete admin
    await Admin.destroy({ where: { admin_id: id } });

    return res.status(200).send({ message: 'Admin deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleting admin:', error);
    return res.status(500).send({ message: `Error in deleting admin: ${error.message}` });
  }
});

// Delete (soft delete) admin
AdminRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findOne({ where: { admin_id: id } });
    if (!admin) {
      return res.status(404).send({ message: 'Admin not found.' });
    }

    // Soft delete admin
    await Admin.destroy({ where: { admin_id: id } });

    return res.status(200).send({ message: 'Admin deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleting admin:', error);
    return res.status(500).send({ message: `Error in deleting admin: ${error.message}` });
  }
});

/// Reset password
AdminRouter.patch('/reset-password/password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    console.log(req.body);

    // Validate required fields
    if (!email || !newPassword) {
      return res.status(400).send({ message: 'Please fill in all required fields.' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).send({ message: 'Admin not found.' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    await Admin.update({ password: hashedNewPassword }, { where: { admin_id: admin.admin_id } });

    return res.status(200).send({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Error in resetting password:', error);
    return res.status(500).send({ message: `Error in resetting password:" ${error.message}` });
  }
});
// // Check if email exists
// AdminRouter.post('/check-email', async (req: Request, res: Response) => {
//   try {
//     const { email } = req.body;

//     // Validate required fields
//     if (!email) {
//       return res.status(400).send({ message: 'Please fill in the email field.' });
//     }

//     // Find admin by email
//     const admin = await Admin.findOne({ where: { email } });
//     if (!admin) {
//       return res.status(404).send({ message: 'Admin not found.' });
//     }

//     // Send OTP using 2factor API
//     const response = await axios.post(`https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${admin.mobile_number}/AUTOGEN3`);
//     const { Details } = response.data;

//     // Save OTP session ID and timestamp
//     await Admin.update({ otp_session_id: Details, otp_timestamp: new Date() }, { where: { admin_id: admin.admin_id } });

//     return res.status(200).send({ message: 'OTP sent successfully.', email });
//   } catch (error: any) {
//     console.error('Error in checking email:', error);
//     return res.status(500).send({ message: `Error in checking email: ${error.message}` });
//   }
// });


// Send OTP
// AdminRouter.post('/send-otp', async (req: Request, res: Response) => {
//   try {
//     const { email } = req.body;

//    // Validate email
//     if (!email) {
//       return res.status(400).send({ message: 'Email is required.' });
//     }

//     // Check if admin with the email exists
//     const admin = await Admin.findOne({ where: { email } });
//     if (!admin) {
//       return res.status(404).send({ message: 'Admin not found.' });
//     }

//     // Send OTP
//     const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/${admin.mobile_number}/AUTOGEN3/OTP1`);
//     console.log(response)
//     if (response.data.Status !== 'Success') {
//       return res.status(500).send({ message: 'Failed to send OTP.' });
//     }

//     // Save session ID and timestamp
//     await Admin.update(
//       { otp_session_id: response.data.Details, otp_timestamp: new Date() },
//       { where: { email } }
//     );

//     return res.status(200).send({ message: 'OTP sent successfully.', sessionId: response.data.Details });
//   } catch (error: any) {
//     console.error('Error in sending OTP:', error);
//     return res.status(500).send({ message: `Error in sending OTP: ${error.message}` });
//   }
// });



// // Verify OTP
// AdminRouter.post('/verify-otp', async (req: Request, res: Response) => {
//   try {
//     const { email, otp } = req.body;

//     // Validate email and otp
//     if (!email || !otp) {
//       return res.status(400).send({ message: 'Email and OTP are required.' });
//     }

//     // Find admin by email
//     const admin = await Admin.findOne({ where: { email } });
//     if (!admin || !admin.otp_session_id || !admin.otp_timestamp) {
//       return res.status(400).send({ message: 'Invalid request.' });
//     }

//     // Check if OTP is within the valid time window (2 minutes)
//     const currentTime = new Date().getTime();
//     const otpTimestamp = new Date(admin.otp_timestamp).getTime();
//     const timeDifference = currentTime - otpTimestamp;

//     if (timeDifference > 2   60  1000) { // 2 minutes in milliseconds
//       return res.status(400).send({ message: 'OTP has expired.' });
//     }

//     // Verify OTP
//     const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY3/${admin.mobile_number}/${otp}`);

//     if (response.data.Status !== 'Success') {
//       return res.status(400).send({ message: 'Invalid OTP.' });
//     }

//     // Clear OTP session ID and timestamp on successful verification
//     await Admin.update(
//       { otp_session_id: null, otp_timestamp: null },
//       { where: { email } }
//     );

//     return res.status(200).send({ message: 'OTP verified successfully.' });
//   } catch (error: any) {
//     console.error('Error in verifying OTP:', error);
//     return res.status(500).send({ message: `Error in verifying OTP: ${error.message}` });
//   }
// });
//send-otp(whatsapp code)
AdminRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log(email);

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Check if admin with the email exists
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }


    // Send OTP
    const response = await axios.post('https://auth.otpless.app/auth/otp/v1/send', {
      phoneNumber:91+admin.mobile_number,
      otpLength: 4,
      channel: 'WHATSAPP',
      expiry: 600
    }, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': CLIENT_ID,
        'clientSecret': CLIENT_SECRET,
        'appId': APP_ID
      }
    });

    console.log('OTP send response:', response.data); // Log the full response for debugging

    if (response.data.orderId) { // Check if orderId is present
      // Save OTP orderId to database if needed
      await Admin.update(
        { otp_session_id: response.data.orderId, otp_timestamp: new Date() },
        { where: { email } }
      );

      res.json({ message: 'OTP sent successfully', orderId: response.data.orderId });
    } else {
      throw new Error(`Failed to send OTP: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('Error sending OTP:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: `Failed to send OTP: ${error.response?.data?.message || error.message}`
    });
  }
});


AdminRouter.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, otp, orderId } = req.body;

  if (!email || !otp || !orderId) {
    return res.status(400).json({ error: 'Email, OTP, and orderId are required' });
  }

  try {
    // Check if admin with the email exists
    const admin = await Admin.findOne({ where: { email } });
    if (!admin || !admin.otp_session_id || !admin.otp_timestamp) {
      return res.status(400).json({ error: 'Invalid request. OTP was not sent or has expired.' });
    }

    // Check if OTP is within the valid time window (10 minutes)
    const currentTime = new Date().getTime();
    const otpTimestamp = new Date(admin.otp_timestamp).getTime();
    const timeDifference = currentTime - otpTimestamp;

    if (timeDifference > 10 * 60 * 1000) { // 10 minutes in milliseconds
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Verify OTP
    const response = await axios.post('https://auth.otpless.app/auth/otp/v1/verify', {
      phoneNumber: '91' + admin.mobile_number, // Assuming phone number with country code
      otp,
      orderId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': CLIENT_ID,
        'clientSecret': CLIENT_SECRET,
        'appId': APP_ID
      }
    });

    console.log('OTP verify response:', response.data);

    if (response.data.isOTPVerified) {
      // Clear OTP session ID and timestamp on successful verification
      await Admin.update(
        { otp_session_id: null, otp_timestamp: null },
        { where: { email } }
      );

      res.json({ message: 'OTP Verified Successfully!' });
    } else {
      res.status(400).json({ error: 'Invalid OTP or phone number' });
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: `Failed to verify OTP: ${error.response?.data?.message || error.message}`
    });
  }
  

});

export default AdminRouter;
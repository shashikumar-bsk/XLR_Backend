import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../db/models/admin';
import axios from 'axios';
require('dotenv').config();

const AdminRouter = express.Router();
const API_KEY = process.env.API_KEY;
// Create a new admin
AdminRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { admin_name, email, password, mobile_number } = req.body;

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
    const createAdmin = await Admin.create({ admin_name, email, password: hashedPassword, mobile_number });

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

    const admin = await Admin.findOne({ where: { admin_id: id } });

    if (!admin) {
      return res.status(404).send({ message: 'Admin not found.' });
    }

    return res.status(200).send(admin);
  } catch (error: any) {
    console.error('Error in fetching admin by ID:', error);
    return res.status(500).send({ message: `Error in fetching admin: ${error.message}` });
  }
});

// Get all admins
AdminRouter.get('/', async (req: Request, res: Response) => {
  try {
    const admins = await Admin.findAll();

    return res.status(200).send(admins);
  } catch (error: any) {
    console.error('Error in fetching admins:', error);
    return res.status(500).send({ message: `Error in fetching admins: ${error.message}` });
  }
});

// Update admin
AdminRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { admin_name, email, password, mobile_number } = req.body;

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
    await Admin.update({ admin_name, email, password: updatedPassword, mobile_number }, { where: { admin_id: id } });

    return res.status(200).send({ message: 'Admin updated successfully' });
  } catch (error: any) {
    console.error('Error in updating admin:', error);
    return res.status(500).send({ message: `Error in updating admin: ${error.message}` });
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

// Reset password
AdminRouter.patch('/reset-password', async (req: Request, res: Response) => {
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
    return res.status(500).send({ message: `Error in resetting password: ${error.message}` });
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
AdminRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

   // Validate email
    if (!email) {
      return res.status(400).send({ message: 'Email is required.' });
    }

    // Check if admin with the email exists
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).send({ message: 'Admin not found.' });
    }

    // Send OTP
    const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/${admin.mobile_number}/AUTOGEN3/OTP1`);
    console.log(response)
    if (response.data.Status !== 'Success') {
      return res.status(500).send({ message: 'Failed to send OTP.' });
    }

    // Save session ID and timestamp
    await Admin.update(
      { otp_session_id: response.data.Details, otp_timestamp: new Date() },
      { where: { email } }
    );

    return res.status(200).send({ message: 'OTP sent successfully.', sessionId: response.data.Details });
  } catch (error: any) {
    console.error('Error in sending OTP:', error);
    return res.status(500).send({ message: `Error in sending OTP: ${error.message}` });
  }
});



// Verify OTP
AdminRouter.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Validate email and otp
    if (!email || !otp) {
      return res.status(400).send({ message: 'Email and OTP are required.' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    if (!admin || !admin.otp_session_id || !admin.otp_timestamp) {
      return res.status(400).send({ message: 'Invalid request.' });
    }

    // Check if OTP is within the valid time window (2 minutes)
    const currentTime = new Date().getTime();
    const otpTimestamp = new Date(admin.otp_timestamp).getTime();
    const timeDifference = currentTime - otpTimestamp;

    if (timeDifference > 2 *  60 * 1000) { // 2 minutes in milliseconds
      return res.status(400).send({ message: 'OTP has expired.' });
    }

    // Verify OTP
    const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY3/${admin.mobile_number}/${otp}`);

    if (response.data.Status !== 'Success') {
      return res.status(400).send({ message: 'Invalid OTP.' });
    }

    // Clear OTP session ID and timestamp on successful verification
    await Admin.update(
      { otp_session_id: null, otp_timestamp: null },
      { where: { email } }
    );

    return res.status(200).send({ message: 'OTP verified successfully.' });
  } catch (error: any) {
    console.error('Error in verifying OTP:', error);
    return res.status(500).send({ message: `Error in verifying OTP: ${error.message}` });
  }
});
export default AdminRouter;
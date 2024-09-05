import express, { Request, Response } from 'express';
import Driver from '../db/models/driver';
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const DriverOTPRouter = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const APP_ID = process.env.APP_ID;
const JWT_SECRET = process.env.JWT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET || !APP_ID || !JWT_SECRET) {
  throw new Error('CLIENT_ID, CLIENT_SECRET, APP_ID, or JWT_SECRET is not defined in environment variables');
}

// Temporary storage for demonstration purposes
const otpStorage: { [key: string]: { phone: string; orderId: string } } = {};

DriverOTPRouter.post('/send-otp', async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const sanitizedPhone = phone.replace(/\D/g, '');

  try {
    const response = await axios.post('https://auth.otpless.app/auth/otp/v1/send', {
      phoneNumber: 91+sanitizedPhone,
      otpLength: 4,
      channel: 'WHATSAPP',
      expiry: 600,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': CLIENT_ID,
        'clientSecret': CLIENT_SECRET,
        'appId': APP_ID,
      }
    });

    if (response.data.orderId) {
      // Store phone and orderId
      otpStorage[sanitizedPhone] = { phone: sanitizedPhone, orderId: response.data.orderId };

      res.json({ message: 'OTP sent successfully' });
    } else {
      throw new Error(`Failed to send OTP: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: `Failed to send OTP: ${error.response?.data?.message || error.message}`,
    });
  }
});

DriverOTPRouter.post('/verify-otp', async (req: Request, res: Response) => {
  const { otp } = req.body;

  // Assuming phone is known from the session or other storage
  const phone = Object.keys(otpStorage)[0]; // In production, use a better method to retrieve the correct phone number
  const { orderId } = otpStorage[phone];

  try {
    const response = await axios.post('https://auth.otpless.app/auth/otp/v1/verify', {
      phoneNumber: 91+phone,
      otp,
      orderId,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': CLIENT_ID,
        'clientSecret': CLIENT_SECRET,
        'appId': APP_ID,
      }
    });

    if (response.data.isOTPVerified) {
      const driver = await Driver.findOne({ where: { phone, is_deleted: false } });

      if (driver) {
        const token = jwt.sign(
          { id: driver.id, phone },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
        console.log('Generated JWT Token:', token); // Ensure this is in the correct scope

    // res.json({ message: 'OTP Verified Successfully!', token });

        res.json({ message: 'OTP Verified Successfully!', token });
      } else {
        res.status(404).json({ error: 'Driver not found or inactive' });
      }
    } else {
      res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: `Failed to verify OTP: ${error.response?.data?.message || error.message}`,
    });
  }
});


DriverOTPRouter.get('/check-driver', async (req: Request, res: Response) => {
  const phone = req.query.phone as string; // Ensure phoneNumber is treated as a string

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const driver = await Driver.findOne({ where: { phone: phone, is_deleted: false } });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found or inactive' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver details:', error);
    res.status(500).json({ error: 'Failed to fetch driver details' });
  }
});

export default DriverOTPRouter;

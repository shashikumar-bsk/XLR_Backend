import express, { Request, Response } from 'express';
import Driver from '../db/models/driver';
// import OTP from '../db/models/Otpmodel';
import axios from 'axios';

import dotenv from 'dotenv';

dotenv.config();
const DriverOTPRouter = express.Router();

const api_key=process.env.API_KEY

// Generate and send OTP
DriverOTPRouter.post('/send-otp', async (req: Request, res: Response) => {
  const { phone } = req.body;
  console.log(phone,req.body)

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Check if the driver exists and is active
    // const driver = await Driver.findOne({ where: { phone, is_deleted: false } });

    // console.log(driver)

    // if (!driver) {
    //   return res.status(404).json({ error: 'Driver not found or inactive' });
    // }

    // Send OTP using 2Factor.in API
    const response = await axios.get(

      `https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN3/OTP1`

    );

    if (response.data.Status === 'Success') {
      res.json({ message: 'OTP sent successfully' });
    } else {
      throw new Error('Failed to send OTP');
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
DriverOTPRouter.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  try {
    const response = await axios.get(

      `https://2factor.in/API/V1/${api_key}/SMS/VERIFY3/${phone}/${otp}`

    );

    if (response.data.Status === 'Success') {
      res.json({ message: 'OTP Verified Successfully!' });
    } else {
      res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});
// Fetch driver details by phone number
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
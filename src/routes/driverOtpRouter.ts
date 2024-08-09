import express, { Request, Response } from 'express';
import Driver from '../db/models/driver';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const DriverOTPRouter = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const APP_ID = process.env.APP_ID;

if (!CLIENT_ID || !CLIENT_SECRET || !APP_ID) {
  throw new Error('CLIENT_ID, CLIENT_SECRET, or APP_ID is not defined in environment variables');
}

// Generate and send OTP
DriverOTPRouter.post('/send-otp', async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Sanitize and validate phone number
  const sanitizedPhone = phone.replace(/\D/g, '');
  console.log('Sanitized Phone:', sanitizedPhone); // Log sanitized phone number

  if (sanitizedPhone.length < 10 || sanitizedPhone.length > 15) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  try {
    // Send OTP using external API
    const response = await axios.post('https://auth.otpless.app/auth/otp/v1/send', {
      phoneNumber: sanitizedPhone,
      otpLength: 4,
      channel: 'WHATSAPP', // Ensure 'WHATSAPP' is supported by your OTP service
      expiry: 600 // OTP expiry time in seconds
    }, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': CLIENT_ID,
        'clientSecret': CLIENT_SECRET,
        'appId': APP_ID
      }
    });

    console.log('OTP send response:', response.data);

    if (response.data.orderId) {
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

// Verify OTP
DriverOTPRouter.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp, orderId } = req.body;

  if (!phone || !otp || !orderId) {
    return res.status(400).json({ error: 'Phone number, OTP, and orderId are required' });
  }

  // Sanitize and validate phone number
  const sanitizedPhone = phone.replace(/\D/g, '');
  if (sanitizedPhone.length < 10 || sanitizedPhone.length > 15) {
  
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  try {
    const response = await axios.post('https://auth.otpless.app/auth/otp/v1/verify', {
      phoneNumber: sanitizedPhone,
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

// const api_key=process.env.API_KEY

// // Generate and send OTP
// DriverOTPRouter.post('/send-otp', async (req: Request, res: Response) => {
//   const { phone } = req.body;
//   console.log(phone,req.body)

//   if (!phone) {
//     return res.status(400).json({ error: 'Phone number is required' });
//   }

//   try {
//     // Check if the driver exists and is active
//     // const driver = await Driver.findOne({ where: { phone, is_deleted: false } });

//     // console.log(driver)

//     // if (!driver) {
//     //   return res.status(404).json({ error: 'Driver not found or inactive' });
//     // }

//     // Send OTP using 2Factor.in API
//     const response = await axios.get(

//       `https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN3/OTP1`

//     );

//     if (response.data.Status === 'Success') {
//       res.json({ message: 'OTP sent successfully' });
//     } else {
//       throw new Error('Failed to send OTP');
//     }
//   } catch (error) {
//     console.error('Error sending OTP:', error);
//     res.status(500).json({ error: 'Failed to send OTP' });
//   }
// });

// // Verify OTP
// DriverOTPRouter.post('/verify-otp', async (req: Request, res: Response) => {
//   const { phone, otp } = req.body;

//   if (!phone || !otp) {
//     return res.status(400).json({ error: 'Phone number and OTP are required' });
//   }

//   try {
//     const response = await axios.get(

//       `https://2factor.in/API/V1/${api_key}/SMS/VERIFY3/${phone}/${otp}`

//     );

//     if (response.data.Status === 'Success') {
//       res.json({ message: 'OTP Verified Successfully!' });
//     } else {
//       res.status(400).json({ message: 'Invalid OTP' });
//     }
//   } catch (error) {
//     console.error('Error verifying OTP:', error);
//     res.status(500).json({ error: 'Failed to verify OTP' });
//   }
// });
// // Fetch driver details by phone number
// DriverOTPRouter.get('/check-driver', async (req: Request, res: Response) => {
//   const phone = req.query.phone as string; // Ensure phoneNumber is treated as a string

//   if (!phone) {
//     return res.status(400).json({ error: 'Phone number is required' });
//   }

//   try {
//     const driver = await Driver.findOne({ where: { phone: phone, is_deleted: false } });

//     if (!driver) {
//       return res.status(404).json({ error: 'Driver not found or inactive' });
//     }

//     res.json(driver);
//   } catch (error) {
//     console.error('Error fetching driver details:', error);
//     res.status(500).json({ error: 'Failed to fetch driver details' });
//   }
// });

export default DriverOTPRouter;
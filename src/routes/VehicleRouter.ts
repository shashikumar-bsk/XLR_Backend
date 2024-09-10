import express, { Request, Response, NextFunction } from 'express';
import Vehicle from '../db/models/vehicle';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import redisClient from '../../src/redis/redis'

dotenv.config();

const VehicleRouter = express.Router();
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

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
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `vehicles/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Middleware to handle multer errors
function multerErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: `Multer Error: ${err.message}` });
  }
  next(err);
}

// Route to create a new vehicle with image upload
VehicleRouter.post('/post/create', upload.single('image'), async (req: Request, res: Response) => {
  console.log('Request Fields:', req.body);
  console.log('Request File:', req.file);

  try {
    const file = req.file as Express.MulterS3.File;
    const { name, capacity, price } = req.body;

    if (!name || !capacity || !price || !file) {
      return res.status(400).json({ success: false, error: 'All required fields are not provided' });
    }

    const newVehicle = await Vehicle.create({
      name,
      capacity,
      price,
      image: file.location,
    });

    res.status(201).json({ success: true, data: newVehicle });
  } catch (err: any) {
    console.error('Error in /create:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});


// // Create a new vehicle
// VehicleRouter.post('/post', async (req: Request, res: Response) => {
//   try {
//     const { name, capacity, image, price } = req.body;
//     const vehicle = await Vehicle.create({ name, capacity, image, price });
//     res.status(201).json(vehicle);
//   } catch (error) {
//     if (isError(error)) {
//       res.status(400).json({ error: error.message });
//     } else {
//       res.status(500).json({ error: 'An unknown error occurred' });
//     }
//   }
// });

// Get all vehicles
VehicleRouter.get('/vehicles', async (req: Request, res: Response) => {
  const cacheKey = 'vehicles'; // Define a cache key for the vehicles list

  try {
    // Check if the vehicles data is already in Redis
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

      // Fetch the vehicles data from the database
      const vehicles = await Vehicle.findAll();

      // Store the vehicles data in Redis with an expiration time of 10 minutes
      await redisClient.set(cacheKey, JSON.stringify(vehicles));
      await redisClient.expire(cacheKey, 120);

      // Respond with the vehicles data
      res.status(200).json(vehicles);
    });
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});


// Get a vehicle by ID
VehicleRouter.get('/vehicles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `vehicle:${id}`; // Define a cache key for the specific vehicle

  try {
    // Check if the vehicle data is already in Redis
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

      // Fetch the vehicle data from the database
      const vehicle = await Vehicle.findByPk(id);
      
      if (vehicle) {
        // Store the vehicle data in Redis with an expiration time of 10 minutes
        await redisClient.set(cacheKey, JSON.stringify(vehicle));
        await redisClient.expire(cacheKey, 120);

        // Respond with the vehicle data
        res.status(200).json(vehicle);
      } else {
        res.status(404).json({ error: 'Vehicle not found' });
      }
    });
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});


// Update a vehicle by ID
VehicleRouter.put('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, image, price } = req.body;
    const vehicle = await Vehicle.findByPk(id);
    if (vehicle) {
      await vehicle.update({ name, capacity, image, price });
      res.status(200).json(vehicle);
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Delete a vehicle by ID
VehicleRouter.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);
    if (vehicle) {
      await vehicle.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default VehicleRouter;
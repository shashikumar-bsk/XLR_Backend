import express, { Request, Response } from "express";
import User from "../db/models/users";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import redisClient from '../../src/redis/redis';
import { sendNotification } from "./NotificationService";

const UserRouter = express.Router();

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Configure multer to use S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME!,
    key: (req, file, cb) => {
      cb(null, `user_images/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Create a new user
UserRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, email, phone, gender, password, fcm_token } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !phone || !password) {
      return res.status(400).send({ message: "Please fill in all required fields." });
    }

    // Concatenate firstname and lastname to form username
    const username = `${firstname} ${lastname}`;

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).send({ message: "Please enter a valid email address." });
    }

    // Validate mobile number format
    if (!/^\d+$/.test(phone)) {
      return res.status(400).send({ message: "Please enter a valid mobile number." });
    }

    // Validate gender (optional)
    if (gender && !['M', 'F', 'Other'].includes(gender)) {
      return res.status(400).send({ message: "Please enter a valid gender." });
    }

    // Check if user with same email already exists and is active
    const existingUser = await User.findOne({ where: { email, is_deleted: false } });

    if (existingUser) {
      return res.status(400).send({ message: "User with this email already exists." });
    }

    // Create user object to be inserted
    const createUserObject: any = {
      username,
      email,
      phone,
      gender,
      password,
      fcm_token,
    };

    console.log("Creating User with object:", createUserObject);

    // Create user using Sequelize model
    const createUser = await User.create(createUserObject);

    const adminFcmToken = 'emtTTD4AkrVs90xesAtnu0:APA91bFtW5EF7Mg-J8XD4EibBegsrfIIZH2fjIaoZUYrCi4PW9Mrm3g1Jv1tDxovA4aa3b7idpvfHgrm-204TkBQ7n_XEP9cMnazVvMWk2ujemRdgWu31TI6fo7j1nuyNM_Qk05WpVaY'; // Replace with actual admin FCM token

    // Send notification to admin
    try {
      console.log("Sending notification to admin for new user registration");
      await sendNotification(adminFcmToken, 'New User Registration', `A new user has registered: ${username}`);
      console.log("Notification sent successfully");
    } catch (error) {
      console.error("Error sending notification:", error);
    }

    return res.status(200).send({ message: "User created successfully", data: createUser });
  } catch (error: any) {
    console.error("Error in creating user:", error);
    return res.status(500).send({ message: `Error in creating user: ${error.message}` });
  }
});


// Get user by ID
UserRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `user:${id}`; // Define a cache key for the specific user
  console.log(`Received request for user with ID: ${id}`); // Log the received ID

  try {
    // Check if the user data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error while fetching:', err); // Detailed log for Redis error
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis:', cachedData); // Log cached data
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Fetch the user data from the database
      console.log('Cache miss, fetching user from database...'); // Indicate cache miss
      const user = await User.findOne({ where: { id, is_deleted: false } });

      if (!user) {
        console.log(`User not found for ID: ${id}`); // Log if user is not found
        return res.status(404).json({ message: 'User not found.' });
      }

      // Store the user data in Redis with an expiration time of 3 minutes
      await redisClient.set(cacheKey, JSON.stringify(user));
      await redisClient.expire(cacheKey, 180); // Set expiration time to 3 minutes
      console.log(`User data cached for ID: ${id}`); // Log that user data was cached

      // Respond with the user data
      console.log(`Responding with user data for ID: ${id}`); // Log response
      res.status(200).json(user);
    });
  } catch (error: any) {
    console.error('Error in fetching user by ID:', error); // Log the entire error object
    res.status(500).json({ message: `Error in fetching user: ${error.message}` });
  }
});

// Get all users if is_deleted is false
UserRouter.get("/", async (req: Request, res: Response) => {
  const cacheKey = 'users'; // Define a cache key for all users

  try {
    // Check if the user data is already in Redis
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

      // Fetch the user data from the database
      const users = await User.findAll({ where: { is_deleted: false } });

      // Store the user data in Redis with an expiration time of 3 minutes
      await redisClient.set(cacheKey, JSON.stringify(users));
      await redisClient.expire(cacheKey, 180); // Change to 180 seconds for 3 minutes

      // Respond with the user data
      res.status(200).json(users);
    });
  } catch (error: any) {
    console.error('Error in fetching users:', error);
    res.status(500).json({ message: `Error in fetching users: ${error.message}` });
  }
});

// Update user
UserRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, mobile_number, gender, password, fcm_token } = req.body;

    const user = await User.findOne({ where: { id, is_deleted: false } });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Concatenate firstname and lastname to form username
    const username = `${firstname} ${lastname}`;

    // Update user object
    const updateUserObject: any = {
      username,
      email,
      mobile_number,
      gender,
      password,
      fcm_token,  // Include fcm_token in update if necessary
    };

    // Update user using Sequelize model
    await User.update(updateUserObject, { where: { id } });

    return res.status(200).send({ message: "User updated successfully" });
  } catch (error: any) {
    console.error("Error in updating user:", error);
    return res.status(500).send({ message: `Error in updating user: ${error.message}` });
  }
});

// Soft delete user (set is_deleted to true)
UserRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, is_deleted: false } });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Soft delete user
    await User.update({ is_deleted: true }, { where: { id } });

    return res.status(200).send({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error in deleting user:", error);
    return res.status(500).send({ message: `Error in deleting user: ${error.message}` });
  }
});

// Update user's active status
UserRouter.patch("/:id/active", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).send({ message: "Please provide a valid active status." });
    }

    const user = await User.findOne({ where: { id, is_deleted: false } });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Update user's active status
    await User.update({ active }, { where: { id } });

    return res.status(200).send({ message: "User active status updated successfully" });
  } catch (error: any) {
    console.error("Error in updating user's active status:", error);
    return res.status(500).send({ message: `Error in updating user's active status: ${error.message}` });
  }
});

export default UserRouter;

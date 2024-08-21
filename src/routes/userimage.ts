import express, { Request, Response } from "express";
import User from "../db/models/users";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const UsersRouter = express.Router();

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

// Create a new user with profile_image
UsersRouter.post("/", upload.single("profile_image"), async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, email, phone, gender, password } = req.body;
    const profile_image = (req.file as any)?.location;

    // Validate required fields
    if (!firstname || !lastname || !email || !phone || !password) {
      return res.status(400).send({ message: "Please fill in all required fields." });
    }

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

    // Check if user with the same email already exists
    const existingUser = await User.findOne({ where: { email, is_deleted: false } });
    if (existingUser) {
      return res.status(400).send({ message: "User with this email already exists." });
    }

    // Create user object
    const createUserObject: any = {
      username: `${firstname} ${lastname}`,
      email,
      phone,
      gender,
      password,
      profile_image, 
    };

    console.log("Creating User with object:", createUserObject);

    // Create user using Sequelize model
    const createUser = await User.create(createUserObject);

    return res.status(200).send({ message: "User created successfully", data: createUser });
  } catch (error: any) {
    console.error("Error in creating user:", error);
    return res.status(500).send({ message: `Error in creating user: ${error.message}` });
  }
});


  // Get the profile image for a specific user
  UsersRouter.get("/:user_id/profile_image", async (req: Request, res: Response) => {
    try {
        const { user_id } = req.params;

        // Find the user by ID
        const user = await User.findByPk(user_id, {
            attributes: ['profile_image'], // Only fetch the profile_image attribute
        });

        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }

        return res.status(200).send({ profile_image: user.profile_image });
    } catch (error: any) {
        console.error("Error in retrieving profile image:", error);
        return res.status(500).send({ message: `Error in retrieving profile image: ${error.message}` });
    }
});
  
export default UsersRouter;

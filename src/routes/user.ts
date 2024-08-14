import express, { Request, Response } from "express";
import User from "../db/models/users";

const UserRouter = express.Router();

// Create a new user
UserRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, email, phone_number, gender, password } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !phone_number || !password) {
      return res.status(400).send({ message: "Please fill in all required fields." });
    }

    // Concatenate firstname and lastname to form username
    const username = `${firstname} ${lastname}`;

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).send({ message: "Please enter a valid email address." });
    }

    // Validate mobile number format
    if (!/^\d+$/.test(phone_number)) {
      return res.status(400).send({ message: "Please enter a valid mobile number." });
    }

    // Convert gender to uppercase
    const genderUpperCase = gender?.toUpperCase();

    // Validate gender (optional)
    if (genderUpperCase && !['M', 'F', 'OTHER'].includes(genderUpperCase)) {
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
      phone_number,
      gender: genderUpperCase,  // Store gender in uppercase
      password
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

// Get user by ID
UserRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, is_deleted: false } });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    return res.status(200).send(user);
  } catch (error: any) {
    console.error("Error in fetching user by ID:", error);
    return res.status(500).send({ message: `Error in fetching user: ${error.message}` });
  }
});

// Get all users if is_deleted is false
UserRouter.get("/", async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({ where: { is_deleted: false } });

    return res.status(200).send(users);
  } catch (error: any) {
    console.error("Error in fetching users:", error);
    return res.status(500).send({ message: `Error in fetching users: ${error.message}` });
  }
});

// Update user
UserRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, mobile_number, gender, password } = req.body;

    const user = await User.findOne({ where: { id, is_deleted: false } });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Concatenate firstname and lastname to form username
    const username = `${firstname} ${lastname}`;

    // Convert gender to uppercase
    const genderUpperCase = gender?.toUpperCase();

    // Update user object
    const updateUserObject: any = {
      username,
      email,
      mobile_number,
      gender: genderUpperCase,  // Store gender in uppercase
      password
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

    await User.update({ active }, { where: { id } });

    return res.status(200).send({ message: "User active status updated successfully" });
  } catch (error: any) {
    console.error("Error in updating user's active status:", error);
    return res.status(500).send({ message: `Error in updating user's active status: ${error.message}` });
  }
});

// Get count of active users
UserRouter.get('/:id/counts', async (req: Request, res: Response) => {
  try {
    const activeUsersCount = await User.count({
      where: {
        active: true,
        is_deleted: false
      }
    });
    res.json({ count: activeUsersCount });
  } catch (error: any) {
    console.error('Error fetching active drivers:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get total count of all users
UserRouter.get('/total/counts/all', async (req: Request, res: Response) => {
  try {
    const totalUsersCount = await User.count();
    res.json({ count: totalUsersCount });
  } catch (error: any) {
    console.error('Error fetching total users count:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default UserRouter;

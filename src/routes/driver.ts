import express, { Request, Response } from "express";
import Driver from "../db/models/driver";

const DriverRouter = express.Router();

// Create a new driver
DriverRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, vehicle_number, gender, dob, vehicle_type, phone } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password || !vehicle_number || !vehicle_type) {
      return res.status(400).send({ message: "Please fill in all required fields." });
    }

    // Validate email format                                                        
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).send({ message: "Please enter a valid email address." });
    }

    // Check if driver with same email already exists and is active
    const existingDriver = await Driver.findOne({ where: { email, is_deleted: false } });

    if (existingDriver) {
      return res.status(400).send({ message: "Driver with this email already exists." });
    }

    // Create driver_name from first_name and last_name
    const driver_name = `${first_name} ${last_name}`;

    // Create driver object to be inserted
    const createDriverObject: any = {
      driver_name,
      email,
      password,
      gender,
      dob,
      vehicle_type,
      vehicle_number,
      phone
    };

    console.log("Creating Driver with object:", createDriverObject);

    // Create driver using Sequelize model
    const createDriver = await Driver.create(createDriverObject);

    return res.status(200).send({ message: "Driver created successfully", data: createDriver });
  } catch (error: any) {
    console.error("Error in creating driver:", error);
    return res.status(500).send({ message: `Error in creating driver: ${error.message}` });
  }
});

// Get driver by ID
DriverRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findOne({ where: { driver_id: id, is_deleted: false } });

    if (!driver) {
      return res.status(404).send({ message: "Driver not found." });
    }

    return res.status(200).send(driver);
  } catch (error: any) {
    console.error("Error in fetching driver by ID:", error);
    return res.status(500).send({ message: `Error in fetching driver: ${error.message}` });
  }
});

// Get all drivers
DriverRouter.get("/", async (req: Request, res: Response) => {
  try {
    const drivers = await Driver.findAll({ where: { is_deleted: false } });

    return res.status(200).send(drivers);
  } catch (error: any) {
    console.error("Error in fetching drivers:", error);
    return res.status(500).send({ message: `Error in fetching drivers: ${error.message}` });
  }
});

// Update driver
DriverRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, password, vehicle_number, gender, dob, vehicle_type, active, phone } = req.body;

    const driver = await Driver.findOne({ where: { driver_id: id, is_deleted: false } });

    if (!driver) {
      return res.status(404).send({ message: "Driver not found." });
    }

    // Create driver_name from first_name and last_name
    const driver_name = `${first_name} ${last_name}`;

    // Update driver object
    const updateDriverObject: any = {
      driver_name,
      email,
      password,
      gender,
      dob,
      vehicle_type,
      vehicle_number,
      active,
      phone
    };

    // Update driver using Sequelize model
    await Driver.update(updateDriverObject, { where: { driver_id: id } });

    return res.status(200).send({ message: "Driver updated successfully" });
  } catch (error: any) {
    console.error("Error in updating driver:", error);
    return res.status(500).send({ message: `Error in updating driver: ${error.message}` });
  }
});

// Soft delete driver (set is_deleted to true)
DriverRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findOne({ where: { driver_id: id, is_deleted: false } });

    if (!driver) {
      return res.status(404).send({ message: "Driver not found." });
    }

    // Soft delete driver
    await Driver.update({ is_deleted: true }, { where: { driver_id: id } });

    return res.status(200).send({ message: "Driver deleted successfully" });
  } catch (error: any) {
    console.error("Error in deleting driver:", error);
    return res.status(500).send({ message: `Error in deleting driver: ${error.message}` });
  }
});

// Update driver's active status
DriverRouter.patch("/:id/active", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).send({ message: "Please provide a valid active status." });
    }

    const driver = await Driver.findOne({ where: { driver_id: id, is_deleted: false } });

    if (!driver) {
      return res.status(404).send({ message: "Driver not found." });
    }

    await Driver.update({ active }, { where: { driver_id: id } });

    return res.status(200).send({ message: "Driver active status updated successfully" });
  } catch (error: any) {
    console.error("Error in updating driver's active status:", error);
    return res.status(500).send({ message: `Error in updating driver's active status: ${error.message}` });
  }
});



DriverRouter.get('/:id/count', async (req: Request, res: Response) => {
  try {
    // console.log()
    const activeDriversCount = await Driver.count({
      where: {
        active: true,
        is_deleted: false
      }
    });
    res.json({ count: activeDriversCount });
  } catch (error: any) {
    console.error('Error fetching active drivers:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get total count of all drivers (including active, inactive, and soft-deleted)
DriverRouter.get('/total/count/all', async (req: Request, res: Response) => {
  try {
    const totalDriversCount = await Driver.count();
    res.json({ count: totalDriversCount });
  } catch (error: any) {
    console.error('Error fetching total drivers count:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default DriverRouter;
import express, { Request, Response } from "express";
import Brand from "../db/models/brand";
import Image from "../db/models/image";
import redisClient from '../../src/redis/redis'

const BrandRouter = express.Router();

// Create a new brand
BrandRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { name, description, image_id } = req.body;
    // Validate that the image_id exists in the Image table if provided
    if (image_id) {
      const imageExists = await Image.findByPk(image_id);
      if (!imageExists) {
          return res.status(400).json({ error: 'Image ID does not exist' });
      }
  }
    // Create brand object to be inserted
    const createBrandObject: any = {
      name,
      description,
      image_id
    };

    console.log("Creating Brand with object:", createBrandObject);

    // Create brand using Sequelize model
    const createBrand = await Brand.create(createBrandObject);

    return res.status(200).send({ message: "Brand created successfully", data: createBrand });
  } catch (error: any) {
    console.error("Error in creating brand:", error);
    return res.status(500).send({ message: `Error in creating brand: ${error.message}` });
  }
});

// Get brand by ID

BrandRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if the brand details are already cached in Redis
    redisClient.get(`brand:${id}`, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (cachedData) {
        // If data is found in Redis, parse it and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      // If data is not in Redis, fetch from the database
      const brand = await Brand.findOne({ where: { brand_id: id } });

      if (!brand) {
        return res.status(404).send({ message: "Brand not found." });
      }

      // Store the brand details in Redis with an expiration time of 2 seconds
      await redisClient.set(`brand:${id}`, JSON.stringify(brand));
      await redisClient.expire(`brand:${id}`, 2);

      // Respond with the brand details
      return res.status(200).send(brand);
    });
  } catch (error: any) {
    console.error("Error in fetching brand by ID:", error);
    return res.status(500).send({ message: `Error in fetching brand: ${error.message}` });
  }
});


// Get all brands

BrandRouter.get("/", async (req: Request, res: Response) => {
  try {
    // Check if the brand list is already cached in Redis
    redisClient.get("brands", async (err, cachedData) => {
      if (err) {
        console.error("Redis error:", err);
        return res.status(500).send({ message: "Internal server error." });
      }

      if (cachedData) {
        // If data is found in Redis, parse it and return it
        console.log("Cache hit, returning data from Redis");
        return res.status(200).send(JSON.parse(cachedData));
      }

      // If data is not in Redis, fetch from the database
      const brands = await Brand.findAll();

      if (brands.length === 0) {
        return res.status(404).send({ message: "No brands found." });
      }

      // Store the brand list in Redis with an expiration time of 2 seconds
      await redisClient.set("brands", JSON.stringify(brands));
      await redisClient.expire("brands", 2);

      // Respond with the brand list
      return res.status(200).send(brands);
    });
  } catch (error: any) {
    console.error("Error in fetching brands:", error);
    return res.status(500).send({ message: `Error in fetching brands: ${error.message}` });
  }
});


// Update brand
BrandRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, image_id } = req.body;

    const brand = await Brand.findOne({ where: { brand_id: id } });

    if (!brand) {
      return res.status(404).send({ message: "Brand not found." });
    }

    // Update brand object
    const updateBrandObject: any = {
      name,
      description,
      image_id
    };

    // Update brand using Sequelize model
    await Brand.update(updateBrandObject, { where: { brand_id: id } });

    return res.status(200).send({ message: "Brand updated successfully" });
  } catch (error: any) {
    console.error("Error in updating brand:", error);
    return res.status(500).send({ message: `Error in updating brand: ${error.message}` });
  }
});

// Hard delete brand
BrandRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findOne({ where: { brand_id: id } });

    if (!brand) {
      return res.status(404).send({ message: "Brand not found." });
    }

    // Hard delete brand
    await brand.destroy();

    return res.status(200).send({ message: "Brand deleted successfully" });
  } catch (error: any) {
    console.error("Error in deleting brand:", error);
    return res.status(500).send({ message: `Error in deleting brand: ${error.message}` });
  }
});

// Get total count of all brands
BrandRouter.get('/total/count/all', async (req: Request, res: Response) => {
  try {
    // Check if the total brands count is already cached in Redis
    redisClient.get('totalBrandsCount', async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
      }

      if (cachedData) {
        // If data is found in Redis, parse it and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).json({ count: JSON.parse(cachedData) });
      }

      // If data is not in Redis, fetch from the database
      const totalBrandsCount = await Brand.count();

      // Store the total brands count in Redis with an expiration time of 2 seconds
      await redisClient.set('totalBrandsCount', JSON.stringify(totalBrandsCount));
      await redisClient.expire('totalBrandsCount', 2);

      // Respond with the total brands count
      return res.status(200).json({ count: totalBrandsCount });
    });
  } catch (error: any) {
    console.error('Error fetching total brands count:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
});

export default BrandRouter;

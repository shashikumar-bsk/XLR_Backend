import express, { Request, Response } from 'express';
import DriverDocs from '../db/models/driver-documents';
import Driver from '../db/models/driver';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const DriverDocsRouter = express.Router();

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
    // acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `images/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Route to upload driver documents
DriverDocsRouter.post('/driverdocs', upload.fields([
  { name: 'front_image', maxCount: 1 },
  { name: 'back_image', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const { driver_id, doc_type, doc_number, status } = req.body;
    const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };

    // Validate all required fields
    if (!driver_id || !doc_type || !files.front_image || !files.back_image || !doc_number ) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Store document info in database
    const driverDocs = await DriverDocs.create({
      driver_id,
      doc_type,
      front_image: files.front_image[0].location,
      back_image: files.back_image[0].location,
      doc_number,
      status,
    });

    res.status(200).json({ success: true, data: driverDocs });
  } catch (err: any) {
    console.error('Error in /driverdocs:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Get driver document by ID
DriverDocsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const driverDoc = await DriverDocs.findOne({ where: { doc_id: id } });

    if (!driverDoc) {
      return res.status(404).send({ message: 'Driver document not found.' });
    }

    // Check if associated driver is not deleted
    const driver = await Driver.findOne({ where: { driver_id: driverDoc.driver_id, is_deleted: false } });
    if (!driver) {
      return res.status(404).send({ message: 'Associated driver not found or is deleted.' });
    }

    return res.status(200).send(driverDoc);
  } catch (error: any) {
    console.error('Error in fetching driver document by ID:', error);
    return res.status(500).send({ message: `Error in fetching driver document: ${error.message}` });
  }
});

// Get all documents for a specific driver
DriverDocsRouter.get('/driver/:driver_id', async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.params;

    // Check if driver exists and is not deleted
    const driver = await Driver.findOne({ where: { driver_id, is_deleted: false } });
    if (!driver) {
      return res.status(404).send({ message: 'Driver not found or is deleted.' });
    }

    const driverDocs = await DriverDocs.findAll({ where: { driver_id } });

    return res.status(200).send(driverDocs);
  } catch (error: any) {
    console.error('Error in fetching driver documents:', error);
    return res.status(500).send({ message: `Error in fetching driver documents: ${error.message}` });
  }
});

// Update driver document
DriverDocsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driver_id, doc_type, front_image, back_image, doc_number, status } = req.body;

    const driverDoc = await DriverDocs.findOne({ where: { doc_id: id } });
    if (!driverDoc) {
      return res.status(404).send({ message: 'Driver document not found.' });
    }

    // Check if associated driver is not deleted
    const driver = await Driver.findOne({ where: { driver_id: driverDoc.driver_id, is_deleted: false } });
    if (!driver) {
      return res.status(404).send({ message: 'Associated driver not found or is deleted.' });
    }

    // Update driver document
    const updateDriverDocsObject = { driver_id, doc_type, front_image, back_image, doc_number, status };
    await DriverDocs.update(updateDriverDocsObject, { where: { doc_id: id } });

    return res.status(200).send({ message: 'Driver document updated successfully' });
  } catch (error: any) {
    console.error('Error in updating driver document:', error);
    return res.status(500).send({ message: `Error in updating driver document: ${error.message}` });
  }
});

// Accept document by driver_id
DriverDocsRouter.patch('/accept/:driverId', async (req, res) => {
  const { driverId } = req.params;
  try {
    const document = await DriverDocs.findOne({ where: { driver_id: driverId } });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = true;
    await document.save();

    res.json({ message: 'Document accepted successfully', document });
  } catch (error) {
    console.error('Error accepting document:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject (delete) document by driver_id
DriverDocsRouter.delete('/:driverId', async (req, res) => {
  const { driverId } = req.params;
  try {
    const document = await DriverDocs.findOne({ where: { driver_id: driverId } });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await document.destroy();

    res.json({ message: 'Document rejected and deleted successfully' });
  } catch (error) {
    console.error('Error rejecting document:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default DriverDocsRouter;
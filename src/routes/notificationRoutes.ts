import { Router, Request, Response } from 'express';
import express from 'express';
import admin from 'firebase-admin';
import User from "../db/models/users";
import Driver from "../db/models/driver"
//import serviceAccount from '../firebaseNotification/shipease-4c855-firebase-adminsdk-273vn-cf274d35ca.json' // Ensure this path is correct

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
// });

// Define the router and use JSON parsing middleware
const firebaseNotification = express.Router();
firebaseNotification.use(express.json());

// Function to send notification
const sendNotification = async (fcmToken: string, title: string, body: string) => {
  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Unable to send notification');
  }
};

// POST route to send notification
firebaseNotification.post('/send-notification', async (req: Request, res: Response) => {
  const { fcmToken, title, body } = req.body;

  // Validate the request body
  if (!fcmToken || !title || !body) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: fcmToken, title, and body',
    });
  }

  try {
    await sendNotification(fcmToken, title, body);
    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error in /send-notification route:',);
    return res.status(500).json({
      success: false,
      message: 'Error sending notification. Please try again later.',
    });
  }
});
// POST route to send notification
firebaseNotification.post('/send-notification', async (req: Request, res: Response) => {
  const { fcmToken, title, body } = req.body;

  // Validate the request body
  if (!fcmToken || !title || !body) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: fcmToken, title, and body',
    });
  }

  try {
    await sendNotification(fcmToken, title, body);
    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error in /send-notification route:',);
    return res.status(500).json({
      success: false,
      message: 'Error sending notification. Please try again later.',
    });
  }
});




//notification apis
firebaseNotification.get("/getAllNewnotification", async (req: Request, res: Response) => {
  try {
    // Extract page and limit from query params, use default values if not provided
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    // Fetch users with notification_status set to true
    const { count: userCount, rows: users } = await User.findAndCountAll({
      where: {
        notification_status: true  // Only get users with notification_status set to true
      },
      order: [['createdAt', 'DESC']],  // Order by createdAt descending (newest first)
      limit: limit,  // Limit number of results per page
      offset: offset  // Offset for pagination
    });
    // Fetch drivers with notification_status set to true
    const { count: driverCount, rows: drivers } = await Driver.findAndCountAll({
      where: {
        notification_status: true  // Only get drivers with notification_status set to true
      },
      order: [['createdAt', 'DESC']],  // Order by createdAt descending (newest first)
      limit: limit,  // Limit number of results per page
      offset: offset  // Offset for pagination
    });
    // Combine users and drivers into a single array
    const combinedData = [...users, ...drivers];
    // Sort combined data by createdAt in descending order
    combinedData.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });
    // Calculate total items and total pages
    const totalItems = userCount + driverCount;
    const totalPages = Math.ceil(totalItems / limit);
    // Send response with combined data
    res.status(200).json({
      data: combinedData,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



firebaseNotification.patch("/notifications/:id/:type/read", async (req: Request, res: Response) => {
  const { id, type } = req.params; // Get the user id from the request parameters
  try {
    // Find the user by ID
    const user = await User.findByPk(id);
    const driver = await Driver.findByPk(id)
    if (type === 'user') {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Update the notification_status
      user.notification_status = false;

      // Save the updated user
      await user.save();

      return res.status(200).json({ message: 'Notification status updated successfully', user });
    }
    if(type==='driver')
    {
      if (!driver) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Update the notification_status
      driver.notification_status = false;
      // Save the updated user
      await driver.save();
      return res.status(200).json({ message: 'Notification status updated successfully', driver });
    }
  } catch (error) {
    console.error('Error updating notification status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


export default firebaseNotification;

// import { Router, Request, Response } from 'express';
// import express from 'express';
// import admin from 'firebase-admin';
// import serviceAccount from '../firebaseNotification/shipease-4c855-firebase-adminsdk-273vn-cf274d35ca.json' // Ensure this path is correct

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
// });

// // Define the router and use JSON parsing middleware
// const firebaseNotification = express.Router();
// firebaseNotification.use(express.json());

// // Function to send notification
// const sendNotification = async (fcmToken: string, title: string, body: string) => {
//   const message = {
//     token: fcmToken,
//     notification: {
//       title,
//       body,
//     },
//   };

//   try {
//     const response = await admin.messaging().send(message);
//     console.log('Successfully sent message:', response);
//   } catch (error) {
//     console.error('Error sending message:', error);
//     throw new Error('Unable to send notification');
//   }
// };

// // POST route to send notification
// firebaseNotification.post('/send-notification', async (req: Request, res: Response) => {
//   const { fcmToken, title, body } = req.body;

//   // Validate the request body
//   if (!fcmToken || !title || !body) {
//     return res.status(400).json({
//       success: false,
//       message: 'Missing required fields: fcmToken, title, and body',
//     });
//   }

//   try {
//     await sendNotification(fcmToken, title, body);
//     return res.status(200).json({
//       success: true,
//       message: 'Notification sent successfully',
//     });
//   } catch (error) {
//     console.error('Error in /send-notification route:',);
//     return res.status(500).json({
//       success: false,
//       message: 'Error sending notification. Please try again later.',
//     });
//   }
// });

// export default firebaseNotification;

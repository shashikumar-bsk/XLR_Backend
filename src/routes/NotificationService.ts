import admin from 'firebase-admin';
import serviceAccount from '../firebaseNotification/admin-push-notifications-8a4b5-firebase-adminsdk-xl0q8-ec8093d6dc.json'; // Ensure this path is correct

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Reusable function to send notifications
export const sendNotification = async (fcmToken: string, title: string, body: string): Promise<string> => {
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
    return response;  // Return the response for further handling if needed
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Unable to send notification');
  }
};

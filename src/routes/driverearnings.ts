//  import express, { Request, Response } from 'express';
// import DriverEarnings from '../db/models/driverearnings';
// import redisClient from '../../src/redis/redis'

// const driverEarningsRouter = express.Router();

// // Middleware to parse JSON bodies
// driverEarningsRouter.use(express.json());

// // Create a new driver earnings record
// driverEarningsRouter.post('/', async (req: Request, res: Response) => {
//     try {
//         const { driver_id, earnings } = req.body;

//         if (!driver_id || !earnings) {
//             return res.status(400).send({ message: 'Please provide driver_id, request_id, and earnings.' });
//         }

//         // Convert earnings to a number if it's not already
//         const earningsNumber = parseFloat(earnings);

//         // Check if the conversion is successful
//         if (isNaN(earningsNumber)) {
//             return res.status(400).send({ message: 'Invalid earnings value.' });
//         }

//         const date = new Date();

//         // Create a new driver earnings record
//         const driverEarnings = await DriverEarnings.create({
//             driver_id,
//             date,
//             earnings: earningsNumber,
//             daily_earnings: earningsNumber,
//             monthly_earnings: earningsNumber
//         });

//         return res.status(201).send({ message: 'Driver earnings created successfully', data: driverEarnings });
//     } catch (error: any) {
//         console.error('Error in creating driver earnings:', error);
//         return res.status(500).send({ message: `Error in creating driver earnings: ${error.message}` });
//     }
// });

// // driverEarningsRouter.post('/', async (req: Request, res: Response) => {
// //     try {
// //         const { driver_id, request_id, earnings } = req.body;

// //         if (!driver_id || !request_id || !earnings) {
// //             return res.status(400).send({ message: 'Please provide driver_id, request_id, and earnings.' });
// //         }

// //         const date = new Date();

// //         const driverEarnings = await DriverEarnings.create({
// //             driver_id,
// //             request_id,
// //             date,
// //             earnings,
// //             daily_earnings: earnings,
// //             monthly_earnings: earnings
// //         });

// //         return res.status(201).send({ message: 'Driver earnings created successfully', data: driverEarnings });
// //     } catch (error: any) {
// //         console.error('Error in creating driver earnings:', error);
// //         return res.status(500).send({ message: `Error in creating driver earnings: ${error.message}` });
// //     }
// // });




// // Get all driver earnings records
// driverEarningsRouter.get('/', async (req: Request, res: Response) => {
//     try {
//       // Define the cache key for driver earnings
//       const cacheKey = 'driverEarnings:all';
  
//       // Check if the earnings data is already in Redis
//       redisClient.get(cacheKey, async (err, cachedData) => {
//         if (err) {
//           console.error('Redis error:', err);
//           return res.status(500).send({ message: 'Internal server error.' });
//         }
  
//         if (cachedData) {
//           // If data is found in Redis, parse and return it
//           console.log('Cache hit, returning data from Redis');
//           return res.status(200).send(JSON.parse(cachedData));
//         }
  
//         // Fetch the driver earnings data from the database
//         const driverEarnings = await DriverEarnings.findAll();
  
//         if (driverEarnings.length === 0) {
//           return res.status(404).send({ message: 'No driver earnings found.' });
//         }
  
//         // Store the earnings data in Redis with an expiration time of 2 seconds
//         await redisClient.set(cacheKey, JSON.stringify(driverEarnings));
//         await redisClient.expire(cacheKey, 2);
  
//         // Respond with the driver earnings data
//         res.status(200).send(driverEarnings);
//       });
//     } catch (error: any) {
//       console.error('Error in fetching driver earnings:', error);
//       return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
//     }
//   });
  

// // Get a driver earnings record by ID
// driverEarningsRouter.get('/:id', async (req: Request, res: Response) => {
//     try {
//       const { id } = req.params;
  
//       // Define the cache key for the specific driver earnings record
//       const cacheKey = `driverEarnings:${id}`;
  
//       // Check if the earnings data is already in Redis
//       redisClient.get(cacheKey, async (err, cachedData) => {
//         if (err) {
//           console.error('Redis error:', err);
//           return res.status(500).send({ message: 'Internal server error.' });
//         }
  
//         if (cachedData) {
//           // If data is found in Redis, parse and return it
//           console.log('Cache hit, returning data from Redis');
//           return res.status(200).send(JSON.parse(cachedData));
//         }
  
//         // Fetch the driver earnings data from the database
//         const driverEarnings = await DriverEarnings.findByPk(id);
  
//         if (!driverEarnings) {
//           return res.status(404).send({ message: 'Driver earnings record not found.' });
//         }
  
//         // Store the earnings data in Redis with an expiration time of 2 seconds
//         await redisClient.set(cacheKey, JSON.stringify(driverEarnings));
//         await redisClient.expire(cacheKey, 2);
  
//         // Respond with the driver earnings data
//         res.status(200).send(driverEarnings);
//       });
//     } catch (error: any) {
//       console.error('Error in fetching driver earnings by ID:', error);
//       return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
//     }
//   });
  

// driverEarningsRouter.get('/driver/:driver_id', async (req: Request, res: Response) => {
//     try {
//       const { driver_id } = req.params;
  
//       // Define the cache key for the driver earnings record
//       const cacheKey = `driverEarnings:driver:${driver_id}`;
  
//       // Check if the earnings data is already in Redis
//       redisClient.get(cacheKey, async (err, cachedData) => {
//         if (err) {
//           console.error('Redis error:', err);
//           return res.status(500).send({ message: 'Internal server error.' });
//         }
  
//         if (cachedData) {
//           // If data is found in Redis, parse and return it
//           console.log('Cache hit, returning data from Redis');
//           return res.status(200).send(JSON.parse(cachedData));
//         }
  
//         // Fetch the driver earnings data from the database
//         const driverEarnings = await DriverEarnings.findOne({
//           where: { driver_id: driver_id }
//         });
  
//         if (!driverEarnings) {
//           return res.status(404).send({ message: 'Driver earnings record not found.' });
//         }
  
//         // Store the earnings data in Redis with an expiration time of 2 seconds
//         await redisClient.set(cacheKey, JSON.stringify(driverEarnings));
//         await redisClient.expire(cacheKey, 2);
  
//         // Respond with the driver earnings data
//         res.status(200).send(driverEarnings);
//       });
//     } catch (error: any) {
//       console.error('Error in fetching driver earnings by driver_id:', error);
//       return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
//     }
//   });
  
// // Update a driver earnings record
// driverEarningsRouter.put('/:id', async (req: Request, res: Response) => {
//     try {
//         const { id } = req.params;
//         const { driver_id, request_id, earnings } = req.body;
//         const driverEarnings = await DriverEarnings.findByPk(id);

//         if (!driverEarnings) {
//             return res.status(404).send({ message: 'Driver earnings record not found.' });
//         }

//         const date = new Date();

//         await driverEarnings.update({ driver_id, date, earnings });
//         return res.status(200).send({ message: 'Driver earnings updated successfully', data: driverEarnings });
//     } catch (error: any) {
//         console.error('Error in updating driver earnings:', error);
//         return res.status(500).send({ message: `Error in updating driver earnings: ${error.message}` });
//     }
// });

// // Delete a driver earnings record
// driverEarningsRouter.delete('/:id', async (req: Request, res: Response) => {
//     try {
//         const { id } = req.params;
//         const driverEarnings = await DriverEarnings.findByPk(id);

//         if (!driverEarnings) {
//             return res.status(404).send({ message: 'Driver earnings record not found.' });
//         }

//         await driverEarnings.destroy();
//         return res.status(200).send({message: 'Driver earnings deleted successfully'});
//     } catch (error: any) {
//         console.error('Error in deleting driver earnings:', error);
//         return res.status(500).send({ message: `Error in deleting driver earnings: ${error.message}` });
//     }
// });

// export default driverEarningsRouter;

import express, { Request, Response } from 'express';
import DriverEarnings from '../db/models/driverearnings';
import redisClient from '../../src/redis/redis'
import { Op } from 'sequelize';
import { RideRequest } from '../db/models';

const driverEarningsRouter = express.Router();

// Middleware to parse JSON bodies
driverEarningsRouter.use(express.json());

// Create a new driver earnings record
driverEarningsRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { driver_id,request_id, earnings } = req.body;

        if (!driver_id || !earnings) {
            return res.status(400).send({ message: 'Please provide driver_id, request_id, and earnings.' });
        }   

        // Convert earnings to a number if it's not already
        const earningsNumber = parseFloat(earnings);

        // Check if the conversion is successful
        if (isNaN(earningsNumber)) {
            return res.status(400).send({ message: 'Invalid earnings value.' });
        }

        const date = new Date();

        // Create a new driver earnings record, weekly earnings will be handled by the model's hooks
        const driverEarnings = await DriverEarnings.create({
            driver_id,
            request_id,
            date,
            earnings: earningsNumber,
            daily_earnings: earningsNumber,
            weekly_earnings: earningsNumber, // Weekly earnings handled by the hook
            monthly_earnings: earningsNumber
        });

        return res.status(201).send({ message: 'Driver earnings created successfully', data: driverEarnings });
    } catch (error: any) {
        console.error('Error in creating driver earnings:', error);
        return res.status(500).send({ message: `Error in creating driver earnings: ${error.message}` });
    }
});

// Get all driver earnings records
driverEarningsRouter.get('/', async (req: Request, res: Response) => {
    try {
      // Define the cache key for driver earnings
      const cacheKey = 'driverEarnings:all';
  
      // Check if the earnings data is already in Redis
      redisClient.get(cacheKey, async (err, cachedData) => {
        if (err) {
          console.error('Redis error:', err);
          return res.status(500).send({ message: 'Internal server error.' });
        }
  
        if (cachedData) {
          // If data is found in Redis, parse and return it
          console.log('Cache hit, returning data from Redis');
          return res.status(200).send(JSON.parse(cachedData));
        }
  
        // Fetch the driver earnings data from the database
        const driverEarnings = await DriverEarnings.findAll();
  
        if (driverEarnings.length === 0) {
          return res.status(404).send({ message: 'No driver earnings found.' });
        }
  
        // Store the earnings data in Redis with an expiration time of 2 seconds
        await redisClient.set(cacheKey, JSON.stringify(driverEarnings));
        await redisClient.expire(cacheKey, 2);
  
        // Respond with the driver earnings data
        res.status(200).send(driverEarnings);
      });
    } catch (error: any) {
        console.error('Error in fetching driver earnings:', error);
        return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
    }
});

// Get a driver earnings record by ID
driverEarningsRouter.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      // Define the cache key for the specific driver earnings record
      const cacheKey = `driverEarnings:${id}`;
  
      // Check if the earnings data is already in Redis
      redisClient.get(cacheKey, async (err, cachedData) => {
        if (err) {
          console.error('Redis error:', err);
          return res.status(500).send({ message: 'Internal server error.' });
        }
  
        if (cachedData) {
          // If data is found in Redis, parse and return it
          console.log('Cache hit, returning data from Redis');
          return res.status(200).send(JSON.parse(cachedData));
        }
  
        // Fetch the driver earnings data from the database
        const driverEarnings = await DriverEarnings.findByPk(id);
  
        if (!driverEarnings) {
          return res.status(404).send({ message: 'Driver earnings record not found.' });
        }
  
        // Store the earnings data in Redis with an expiration time of 2 seconds
        await redisClient.set(cacheKey, JSON.stringify(driverEarnings));
        await redisClient.expire(cacheKey, 2);
  
        // Respond with the driver earnings data
        res.status(200).send(driverEarnings);
      });
    } catch (error: any) {
        console.error('Error in fetching driver earnings by ID:', error);
        return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
    }
});

// Get driver earnings by driver ID
driverEarningsRouter.get('/driver/:driver_id', async (req: Request, res: Response) => {
    try {
      const { driver_id } = req.params;
  
      // Define the cache key for the driver earnings record
      const cacheKey = `driverEarnings:driver:${driver_id}`;
  
      // Check if the earnings data is already in Redis
      redisClient.get(cacheKey, async (err, cachedData) => {
        if (err) {
          console.error('Redis error:', err);
          return res.status(500).send({ message: 'Internal server error.' });
        }
  
        if (cachedData) {
          // If data is found in Redis, parse and return it
          console.log('Cache hit, returning data from Redis');
          return res.status(200).send(JSON.parse(cachedData));
        }
  
        // Fetch the driver earnings data from the database
        const driverEarnings = await DriverEarnings.findOne({
          where: { driver_id: driver_id }
        });
  
        if (!driverEarnings) {
          return res.status(404).send({ message: 'Driver earnings record not found.' });
        }
  
        // Store the earnings data in Redis with an expiration time of 2 seconds
        await redisClient.set(cacheKey, JSON.stringify(driverEarnings));
        await redisClient.expire(cacheKey, 2);
  
        // Respond with the driver earnings data
        res.status(200).send(driverEarnings);
      });
    } catch (error: any) {
        console.error('Error in fetching driver earnings by driver_id:', error);
        return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
    }
});

// Update a driver earnings record
driverEarningsRouter.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { driver_id, request_id, earnings } = req.body;
        const driverEarnings = await DriverEarnings.findByPk(id);

        if (!driverEarnings) {
            return res.status(404).send({ message: 'Driver earnings record not found.' });
        }

        const date = new Date();

        await driverEarnings.update({ driver_id, date, earnings });
        return res.status(200).send({ message: 'Driver earnings updated successfully', data: driverEarnings });
    } catch (error: any) {
        console.error('Error in updating driver earnings:', error);
        return res.status(500).send({ message: `Error in updating driver earnings: ${error.message}` });
    }
});

// Delete a driver earnings record
driverEarningsRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const driverEarnings = await DriverEarnings.findByPk(id);

        if (!driverEarnings) {
            return res.status(404).send({ message: 'Driver earnings record not found.' });
        }

        await driverEarnings.destroy();
        return res.status(200).send({ message: 'Driver earnings deleted successfully' });
    } catch (error: any) {
        console.error('Error in deleting driver earnings:', error);
        return res.status(500).send({ message: `Error in deleting driver earnings: ${error.message}` });
    }
});


// driverEarningsRouter.get('/driver/:driver_id/weekly', async (req: Request, res: Response) => {
//     try {
//         const { driver_id } = req.params;
//         const startDate = '2024-09-23';
//         const endDate = '2024-09-29';
//         const cacheKey = `driverEarnings:driver:${driver_id}:weekly`;

//         redisClient.get(cacheKey, async (err, cachedData) => {
//             if (err) {
//                 console.error('Redis error:', err);
//                 return res.status(500).send({ message: 'Internal server error.' });
//             }

//             if (cachedData) {
//                 console.log('Cache hit, returning data from Redis');
//                 return res.status(200).send(JSON.parse(cachedData));
//             }

//             // Fetch weekly earnings data
//             const weeklyEarnings = await DriverEarnings.findAll({
//                 where: {
//                     driver_id,
//                     date: {
//                         [Op.between]: [startDate, endDate],
//                     },
//                 },
//                 order: [['date', 'ASC']],
//             });

//             if (weeklyEarnings.length === 0) {
//                 return res.status(404).send({ message: 'No earnings found for the specified driver and date range.' });
//             }

//             // Save results in Redis
//             await redisClient.set(cacheKey, JSON.stringify(weeklyEarnings));
//             await redisClient.expire(cacheKey, 120);

//             res.status(200).send({ success: true, data: weeklyEarnings });
//         });
//     } catch (error: any) {
//         console.error('Error in fetching weekly driver earnings:', error);
//         return res.status(500).send({ message: `Error in fetching weekly earnings: ${error.message}` });
//     }
// });



// driverEarningsRouter.get('/balance/:driverId', async (req, res) => {
//   const { driverId } = req.params;

//   try {
//     // Fetching driver earnings data
//     const driverEarnings = await DriverEarnings.findAll({
//       where: { driver_id: driverId },
//       order: [['createdAt', 'DESC']],
//        // Order by the latest records
//     });

//     // Fetching driver ride requests dynamically
//     const rideRequests = await RideRequest.findAll({
//       where: { driver_id: driverId },
      
//     });

//     if (driverEarnings.length === 0) {
//       return res.status(404).json({ message: 'No earnings found for this driver.' });
//     }

//     // Map earnings data
//     const earningsData = driverEarnings.map(record => ({
//       driver_id: record.driver_id,
//       earnings: parseFloat(record.earnings.toString()),
//       daily_earnings: parseFloat(record.daily_earnings.toString()),
//       monthly_earnings: parseFloat(record.monthly_earnings.toString()),
//     }));

//     // Calculate total and daily earnings
//     const totalEarnings = earningsData.reduce((sum, record) => sum + record.monthly_earnings, 0);
//     const dailyEarnings = earningsData.reduce((sum, record) => sum + record.daily_earnings, 0);
//     const earnings=earningsData.reduce((sum, record) => sum + record.earnings, 0);

//     // Calculate today's earnings
//     const todayData = driverEarnings.filter(earning => {
//       const earningDate = new Date(earning.createdAt).toDateString();
//       return earningDate === new Date().toDateString(); // Check for today's data
//     });

//     // Calculate the day-end balance
//     const dayEndBalance = todayData.reduce((sum, record) => sum + record.earnings, 0);

//     const transaction=earningsData.reduce((sum, record) => sum + record.earnings,0)

//     res.json({
//       totalEarnings,
//       dailyEarnings,
//       dayEndBalance,
//       earnings,
//       transaction,
//       todayData: todayData.map(earning => ({
//         amount: earning.earnings,
//         createdAt: earning.createdAt,
//       })),
//       rideRequests: rideRequests.length, // You can add more details about ride requests if needed
//     });
//   } catch (error) {
//     console.error('Error fetching earnings:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });



driverEarningsRouter.get('/balance/:driverId', async (req, res) => {
  const { driverId } = req.params;

  try {
    // Fetching driver earnings data
    const driverEarnings = await DriverEarnings.findAll({
      where: { driver_id: driverId },
      order: [['createdAt', 'DESC']], // Order by the latest records
    });

    if (driverEarnings.length === 0) {
      return res.status(404).json({ message: 'No earnings found for this driver.' });
    }

    // Fetching driver ride requests dynamically
    const rideRequests = await RideRequest.findAll({  
      where: { driver_id: driverId },
    });

    // Compute today's date details
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    // Define start and end of day
    const startOfDay = new Date(year, month, day, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59);

    // Define start and end of the week (Sunday to Saturday)
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(year, month, day - dayOfWeek, 0, 0, 0);
    const endOfWeek = new Date(year, month, day + (6 - dayOfWeek), 23, 59, 59);

    // Define start and end of the month
    const startOfMonth = new Date(year, month, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    // Compute daily earnings
    const dailyEarningsSum = await DriverEarnings.sum('earnings', {
      where: {
        driver_id: driverId,
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    // Compute weekly earnings
    const weeklyEarningsSum = await DriverEarnings.sum('earnings', {
      where: {
        driver_id: driverId,
        createdAt: {
          [Op.between]: [startOfWeek, endOfWeek],
        },
      },
    });

    // Compute monthly earnings
    const monthlyEarningsSum = await DriverEarnings.sum('earnings', {
      where: {
        driver_id: driverId,
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
    });

    // Map earnings data (parsing to avoid precision issues)
    const earningsData = driverEarnings.map(record => ({
      driver_id: record.driver_id,
      earnings: parseFloat(record.earnings.toString()),
      createdAt: record.createdAt,
    }));

    // Calculate total earnings (sum of all records)
    const totalEarnings = earningsData.reduce((sum, record) => sum + record.earnings, 0);

    // Filter today's data
    const todayData = earningsData.filter(earning => {
      const earningDate = new Date(earning.createdAt).toDateString();
      return earningDate === currentDate.toDateString(); // Filter today's earnings
    });

    // Calculate the day-end balance based on today's earnings
    const dayEndBalance = todayData.reduce((sum, record) => sum + record.earnings, 0);

    // Send the response
    res.json({
      totalEarnings,
      dailyEarnings: dailyEarningsSum || 0,
      weeklyEarnings: weeklyEarningsSum || 0,
      monthlyEarnings: monthlyEarningsSum || 0,
      dayEndBalance,
      todayData: todayData.map(earning => ({
        amount: earning.earnings.toFixed(2), // Ensure two decimal points
        createdAt: earning.createdAt.toString(),
      })),
      rideRequests: rideRequests.length, // Number of ride requests
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});driverEarningsRouter.get('/driver/:driver_id/week', async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.params;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the start and end of the week (assuming the week starts on Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    console.log('Start of week:', startOfWeek, 'End of week:', endOfWeek);

    const cacheKey = `driverEarnings:driver:${driver_id}:weekly`;

    // Check if data is already cached in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (cachedData) {
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      try {
        // Fetch weekly earnings data for the driver
        const driverEarnings = await DriverEarnings.findAll({
          where: {
            driver_id,
            date: {
              [Op.between]: [startOfWeek, endOfWeek],
            },
          },
          attributes: ['weekly_earnings'],
          order: [['date', 'ASC']],
        });

        // If no earnings data found, return 404
        if (!driverEarnings || driverEarnings.length === 0) {
          return res.status(404).send({ message: 'No earnings found for the specified driver and date range.' });
        }

        // Calculate weekly earnings by summing up the earnings records
        const weeklyEarnings = driverEarnings.reduce(
          (sum, record) => sum + parseFloat(record.weekly_earnings?.toString() || '0'),
          0
        );

        // Fetch total rides for the week
        const totalRides = await RideRequest.count({
          where: {
            driver_id: driver_id,
            status: 'completed',
            createdAt: {
              [Op.between]: [startOfWeek, endOfWeek],
            },
          },
        });

        // Prepare the result object
        const result = {
          totalEarnings: weeklyEarnings, // Total earnings for the week
          totalRides,                    // Total rides for the week
          todayEarnings: 0,              // Assuming today's earnings will be handled separately
        };

        // Cache the result in Redis for future requests (cached for 24 hours)
        redisClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(result));

        // Send the result as response
        return res.status(200).send(result);

      } catch (fetchError) {
        console.error('Error fetching driver earnings or rides:', fetchError);
        return res.status(500).send({ message: 'Internal server error.' });
      }
    });

  } catch (error) {
    console.error('Error in the request:', error);
    res.status(500).send({ message: 'Internal server error.' });
  }
});

driverEarningsRouter.get('/driver/:driver_id/data', async (req, res) => {
    const { driver_id } = req.params;
  
    try {
      // Fetch driver earnings data
      const driverEarnings = await DriverEarnings.findAll({
        where: { driver_id },
      });
  
      // Fetch driver ride status dynamically
      const rideRequests = await RideRequest.findAll({
        where: { driver_id },
      });
  
      // Calculate ride statuses
      const completedRides = rideRequests.filter(ride => ride.status === 'completed').length;
      const inProgressRides = rideRequests.filter(ride => ride.status === 'pending').length;
      const ongoingRides = rideRequests.filter(ride => ride.status === 'ongoing').length;
      const cancelledRides = rideRequests.filter(ride => ride.status === 'rejected').length;
  
      // Map earnings data
      const earningsData = driverEarnings.map(record => ({
        driver_id: record.driver_id,
        earnings: parseFloat(record.earnings.toString()),
        daily_earnings: parseFloat(record.daily_earnings.toString()),
        monthly_earnings: parseFloat(record.monthly_earnings.toString()),
      }));
  
      // Sum total and daily earnings
      const totalEarnings = earningsData.reduce((sum, record) => sum + record.earnings, 0);
      const dailyEarnings = earningsData.reduce((sum, record) => sum + record.daily_earnings, 0);
  
      // Send the data as a JSON response
      return res.json({
        driver_id,
        completed: completedRides,
        cancelled: cancelledRides,
        inProgress: inProgressRides,
        ongoing: ongoingRides,
        performance: {
          'Total Earnings': totalEarnings.toFixed(2),
          'Total Rides': rideRequests.length,
          'Daily Earnings': dailyEarnings.toFixed(2),
        },
      });
    } 
    catch (error) {
      console.error('Error fetching driver data:', error);
      return res.status(500).json({ error: 'Failed to fetch driver data' });
    }
  });

driverEarningsRouter.get('/earnings/:driverId', async (req, res) => {
  const { driverId } = req.params;

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of the day
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // Set to the start of the next day

  try {
    // Fetch all earnings records for today for the driver
    const earningsForToday = await DriverEarnings.findAll({
      where: {
        driver_id: driverId,
        createdAt: {
          [Op.between]: [today, tomorrow], // Today's date range
        },
      },
      attributes: ['earnings', 'createdAt'], // Only fetching 'earnings' and 'createdAt'
    });

    // Calculate today's total earnings by summing up 'earnings' field
    const todayEarnings = earningsForToday.reduce((sum, record) => sum + parseFloat(record.earnings.toString()), 0);

    // Calculate the day-end balance (which is just the sum of today's earnings)
    const dayEndBalance = todayEarnings || 0;

    // Fetch today's completed rides count for the driver
    const todayRides = await RideRequest.count({
      where: {
        driver_id: driverId,
        status: 'completed',
        createdAt: {
          [Op.between]: [today, tomorrow], // Today's date range
        },
      },
    });

    // Respond with the correct total and day-end balance
    return res.json({
      totalEarnings: todayEarnings, // Corrected total earnings
      dayEndBalance,                // Corrected day-end balance
      todayData: earningsForToday.map(record => ({
        amount: record.earnings,     // Show individual earnings per entry
        createdAt: record.createdAt, // Show the timestamp of each earning
      })),
      rideRequests: todayRides,      // Total ride requests for today
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






export default driverEarningsRouter;

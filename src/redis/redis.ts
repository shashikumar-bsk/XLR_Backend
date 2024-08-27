import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
//   password: process.env.REDIS_PASSWORD || undefined, // Use undefined if not set
//   db: Number(process.env.REDIS_DB) || 0,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (error:any) => {
  console.error('Redis connection error:', error);
});

redis.on('end', () => {
  console.log('Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('Reconnecting to Redis');
});

export default redis;
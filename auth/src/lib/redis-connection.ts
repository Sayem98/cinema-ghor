/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import IORedis from "ioredis";
import { envs } from "../config";

// This is the ioredis client, required by BullMQ.
// It will automatically connect.
export const redisConnection = new IORedis(envs.redis_url, {
  // This is crucial for BullMQ workers to prevent them from
  // giving up on a failed command during a Redis blip.
  maxRetriesPerRequest: null,
});

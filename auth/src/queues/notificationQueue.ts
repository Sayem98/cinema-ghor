import { Job } from "bullmq";
import { ReusableQueue } from "./Queue";

// 1. Define the specific payload for this queue
export type NotificationPayload = {
  userId: string;
  message: string;
};

// 2. Define the "processor" function (the work to be done)
const notificationProcessor = async (
  job: Job<NotificationPayload>,
): Promise<void> => {
  const { userId, message } = job.data;
  console.log(`[Worker] Sending notification to ${userId}: "${message}"`);

  // --- Simulate Work & Failures ---
  await new Promise((res) => setTimeout(res, 500)); // 0.5s processing time

  // Simulate a permanent failure that goes to DLQ
  if (userId === "user-banned") {
    throw new Error("User is banned. Cannot send notification.");
  }

  // Simulate an intermittent failure that will retry
  if (userId === "user-flaky" && job.attemptsMade < 3) {
    console.warn(
      `[Worker] Simulating network error for ${userId}. Attempt ${job.attemptsMade}`,
    );
    throw new Error("Simulated network failure.");
  }
  // --- End Simulation ---

  console.log(`[Worker] Successfully sent notification to ${userId}`);
};

// 3. Create and export the queue instance
export const notificationQueue = new ReusableQueue<NotificationPayload>(
  "notifications", // The queue name
  notificationProcessor, // The function to run
);

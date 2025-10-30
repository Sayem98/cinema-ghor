/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Queue, Worker, Job, QueueEvents, BackoffOptions } from "bullmq";
import { redisConnection } from "../lib/redis-connection";

/**
 * Defines the data structure for a job that lands in the DLQ.
 */
type DeadLetterJobData = {
  queueName: string; // The original queue
  jobId?: string;
  jobName: string;

  data: any;
  failedReason: string;
};

// --- The Dead-Letter Queue (DLQ) ---
// All failed jobs from all queues will be moved here.
const dlqName = "dead-letter-queue";
export const deadLetterQueue = new Queue<DeadLetterJobData>(dlqName, {
  connection: redisConnection,
});

/**
 * A reusable, generic class to create a BullMQ queue and worker
 * with built-in retry and DLQ logic.
 *
 * @param T The type of the job data payload.
 */
export class ReusableQueue<T extends object> {
  public readonly queue: Queue<T>;
  public readonly worker: Worker<T>;
  public readonly queueName: string;

  private readonly queueEvents: QueueEvents;

  /**
   * @param queueName The name for this specific queue (e.g., "email", "notification")
   * @param processor A function that defines the work to be done for a job.
   */

  constructor(queueName: string, processor: (job: Job<T>) => Promise<any>) {
    this.queueName = queueName;

    // 1. Initialize the Queue
    this.queue = new Queue<T>(queueName, {
      connection: redisConnection,
    });

    // 2. Initialize the Worker
    this.worker = new Worker<T>(queueName, processor, {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 jobs concurrently
    });

    // 3. Initialize the Event Listener (for failed jobs)
    this.queueEvents = new QueueEvents(queueName, {
      connection: redisConnection,
    });
    this.setupFailedJobListener();
  }

  /**
   * Listens for jobs that have failed all retry attempts and moves them to the DLQ.
   */
  private setupFailedJobListener(): void {
    // Add explicit types to the destructured arguments
    this.queueEvents.on(
      "failed",
      async ({
        jobId,
        failedReason,
      }: {
        jobId: string;
        failedReason: string;
      }) => {
        console.warn(
          `Job ${jobId} in queue ${this.queueName} has permanently failed.`,
        );

        try {
          // Get the original job details
          const job = await Job.fromId(this.queue, jobId);
          if (!job) return;

          // Add the failed job to the DLQ for manual inspection
          const dlqData: DeadLetterJobData = {
            queueName: this.queueName,
            jobName: job.name,
            data: job.data,
            failedReason: failedReason,
          };

          await deadLetterQueue.add(`${this.queueName}-failed-job`, dlqData);

          console.log(`Moved failed job ${jobId} to '${dlqName}'.`);
        } catch (err) {
          console.error(`Error moving job ${jobId} to DLQ:`, err);
        }
      },
    );
  }

  /**
   * Adds a new job to this queue.
   * @param jobName A name for the type of job (e.g., "send-welcome-email")
   * @param data The payload for the job
   */
  public async addJob(jobName: string, data: T): Promise<Job<T, any, string>> {
    // Default options: 4 total attempts with exponential backoff
    const retryOptions: BackoffOptions = {
      type: "exponential",
      delay: 1000, // 1s, 2s, 4s, 8s
    };

    return this.queue.add(jobName as any, data as any, {
      attempts: 4,
      backoff: retryOptions,
      removeOnComplete: 100,
      removeOnFail: 1000,
    }) as Promise<Job<T, any, string>>;
  }
}

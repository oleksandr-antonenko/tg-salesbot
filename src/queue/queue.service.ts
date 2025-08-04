import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull';

/**
 * Queue service for handling asynchronous tasks
 * Implements a clean interface for queue operations
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('product-processing') private readonly productQueue: Queue,
    @InjectQueue('product_exports') private readonly productExportsQueue: Queue,
    // Add more queues here as needed
  ) {}

  /**
   * Sends a data record to a specified queue
   * @param queueName - Name of the queue ('product-processing', 'product_exports', etc.)
   * @param jobName - Name of the job to add to the queue
   * @param data - Record containing data to be sent
   * @param options - Optional Bull queue job options (priority, delay, etc)
   * @returns The job object from Bull queue
   */
  async sendToQueue(queueName: string, jobName: string, data: Record<string, any>, options?: JobOptions) {
    try {
      // Get the correct queue instance based on queueName
      const queue = this.getQueueByName(queueName);
      
      this.logger.log(`Sending data to ${queueName} queue: ${JSON.stringify(data).substring(0, 100)}...`);
      const job = await queue.add(jobName, data, options);
      this.logger.log(`Successfully queued job ${job.id} to ${queueName} queue`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to send data to ${queueName} queue: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Resends a data record to the product_exports queue
   * @param data - Record containing data to be resent
   * @param options - Optional Bull queue job options (priority, delay, etc)
   * @returns The job object from Bull queue
   */
  async resendDataRecord(data: Record<string, any>, options?: JobOptions) {
    return this.sendToQueue('product_exports', 'product_exports', data, options);
  }
  
  /**
   * Helper method to get the appropriate queue instance by name
   * @param queueName - Name of the queue
   * @returns Queue instance
   */
  private getQueueByName(queueName: string): Queue {
    switch (queueName) {
      case 'product-processing':
        return this.productQueue;
      case 'product_exports':
        return this.productExportsQueue;
      default:
        throw new Error(`Queue '${queueName}' is not registered in QueueService`);
    }
  }
}

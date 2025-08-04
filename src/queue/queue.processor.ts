import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AiService } from '../ai/ai.service';

/**
 * Queue processor for handling product-related asynchronous tasks
 * Follows Single Responsibility Principle by focusing only on processing queue jobs
 */
@Processor('product-processing')
export class ProductProcessor {
  private readonly logger = new Logger(ProductProcessor.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Process vectorization jobs
   * @param job The job containing product data
   */
  @Process('vectorize')
  async handleVectorization(job: Job): Promise<void> {
    this.logger.log(
      `Processing vectorization job ${job.id} for product ${job.data.productId}`,
    );

    try {
      // In a real implementation, we would fetch the product data from Shopify API
      // For now, we'll just log the job data
      this.logger.log(
        `Would vectorize product ${job.data.productId} from shop ${job.data.shopDomain}`,
      );

      // Mock implementation - in reality, we would:
      // 1. Fetch product data from Shopify API
      // 2. Extract text and metadata
      // 3. Call AI service to upsert vector

      // For demonstration purposes:
      // await this.aiService.upsertVector(
      //   job.data.productId,
      //   'Sample product description for demonstration',
      //   { shop: job.data.shopDomain }
      // );

      this.logger.log(`Successfully processed vectorization job ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process vectorization job ${job.id}: ${error.message}`,
      );
      throw error; // Rethrow to trigger Bull's retry mechanism
    }
  }

  /**
   * Process vectorization jobs from full product data
   * @param job The job containing the full product data
   */
  @Process('vectorize-data')
  async handleVectorizationFromData(job: Job): Promise<void> {
    this.logger.log(
      `Processing vectorization job ${job.id} for product ${job.data.product.id} from data`,
    );

    try {
      const product = job.data.product;
      const productId = product.id.toString();
      const document = this.aiService.extractProductText(product);
      const metadata = this.aiService.extractProductMetadata(product);

      await this.aiService.upsertVector(productId, document, metadata);

      this.logger.log(
        `Successfully processed vectorization job ${job.id} from data`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process vectorization job ${job.id} from data: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Process deletion jobs
   * @param job The job containing product ID to delete
   */
  @Process('delete')
  async handleDeletion(job: Job): Promise<void> {
    this.logger.log(
      `Processing deletion job ${job.id} for product ${job.data.productId}`,
    );

    try {
      // Mock implementation - in reality, we would:
      // await this.aiService.deleteVector(job.data.productId);

      this.logger.log(`Would delete vector for product ${job.data.productId}`);
      this.logger.log(`Successfully processed deletion job ${job.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process deletion job ${job.id}: ${error.message}`,
      );
      throw error; // Rethrow to trigger Bull's retry mechanism
    }
  }
}

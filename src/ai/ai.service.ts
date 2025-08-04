import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * Service responsible for communication with the Python AI microservice
 * Follows the Single Responsibility Principle by focusing only on AI service communication
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>('AI_SERVICE_URL');
    if (!baseUrl) {
      throw new Error('AI_SERVICE_URL environment variable is not defined');
    }
    this.baseUrl = baseUrl;
  }

  /**
   * Check the health of the Python AI microservice
   * @returns Health status of the AI service
   */
  async checkHealth(): Promise<{ status: string }> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ status: string }>(`${this.baseUrl}/health`).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `AI service health check failed: ${error.message}`,
            );
            throw new Error(`AI service health check failed: ${error.message}`);
          }),
        ),
      );

      return data;
    } catch (error) {
      this.logger.error(`Error checking AI service health: ${error.message}`);
      return { status: 'error' };
    }
  }

  /**
   * Upsert a vector in the AI service
   * This is a placeholder for the actual implementation in Phase 2
   * @param productId The product ID
   * @param document The document text to vectorize
   * @param metadata Additional metadata
   */
  async upsertVector(
    productId: string,
    document: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService
          .post(`${this.baseUrl}/upsert`, {
            id: productId,
            document,
            metadata,
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(`Failed to upsert vector: ${error.message}`);
              throw new Error(`Failed to upsert vector: ${error.message}`);
            }),
          ),
      );
    } catch (error) {
      this.logger.error(`Error upserting vector: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a vector from the AI service
   * @param productId The product ID to delete
   */
  async deleteVector(productId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService
          .delete(`${this.baseUrl}/delete`, {
            data: { ids: [productId] },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(`Failed to delete vector: ${error.message}`);
              throw new Error(`Failed to delete vector: ${error.message}`);
            }),
          ),
      );
    } catch (error) {
      this.logger.error(`Error deleting vector: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract text content from product for vectorization
   * @param product Product data
   * @returns Concatenated text for vectorization
   */
  extractProductText(product: any): string {
    const title = product.title || '';
    const description = product.body_html
      ? this.stripHtml(product.body_html)
      : '';
    const vendor = product.vendor || '';
    const productType = product.product_type || '';
    const tags = Array.isArray(product.tags)
      ? product.tags.join(' ')
      : product.tags || '';

    return `${title} ${description} ${vendor} ${productType} ${tags}`.trim();
  }

  /**
   * Extract metadata from product
   * @param product Product data
   * @returns Product metadata
   */
  extractProductMetadata(product: any): Record<string, any> {
    return {
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      product_type: product.product_type,
      status: product.status,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }

  /**
   * Strip HTML tags from text
   * @param html HTML text
   * @returns Plain text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

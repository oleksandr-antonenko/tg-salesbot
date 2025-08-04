import { Product } from '../models/product.model';

/**
 * Data Transfer Object for product fetch response
 * Follows Single Responsibility Principle by focusing only on data structure
 */
export class ProductFetchResponseDto {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Message describing the result
   */
  message: string;

  /**
   * Number of products fetched
   */
  count: number;

  /**
   * Array of products
   */
  products: Product[];
}

/**
 * Product model representing a Shopify product
 * Follows Single Responsibility Principle by focusing only on product data structure
 */
export interface Product {
  id: number;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  status: string;
  price?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  shopifyId: string;
}

/**
 * Product image model
 */
export interface ProductImage {
  id: number;
  src: string;
  position: number;
  alt?: string;
}

/**
 * Product variant model
 */
export interface ProductVariant {
  id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventoryQuantity?: number;
  inventoryPolicy?: string;
  compareAtPrice?: string;
  fulfillmentService?: string;
  inventoryManagement?: string;
  taxable: boolean;
  barcode?: string;
  grams: number;
  weight: number;
  weightUnit: string;
  option1?: string;
  option2?: string;
  option3?: string;
  imageId?: number;
  createdAt: string;
  updatedAt: string;
}

Phase 2: Product Synchronization & Management (NestJS)
Duration: 1-2 Weeks
Primary Goal: To implement the core logic for synchronizing product data from a merchant's Shopify store into our local PostgreSQL database. This phase introduces the Product entity and the services required to fetch, store, and manage product information, laying the groundwork for vectorization.

1. Database Schema Expansion
   Objective: Extend the database schema to store product information and link it to the corresponding shop.

1.1. New Product Entity
Action: Create a new TypeORM entity file: src/product/product.entity.ts.

Purpose: This entity will store a local, denormalized copy of essential product data from Shopify.

Fields:

id (Primary Key): Auto-incrementing integer.

shopifyProductId (string, unique): The global ID from Shopify (e.g., gid://shopify/Product/123456789). This is the primary key for lookups and updates.

title (string): The product's title.

handle (string): The product's handle (URL-friendly name).

status (enum: ACTIVE, DRAFT, ARCHIVED): The product's status in Shopify.

vendor (string, nullable): The product vendor.

productType (string, nullable): The product type.

raw_data (jsonb): A flexible field to store the entire raw JSON response from the Shopify API for a single product. This is invaluable for future debugging and avoiding schema migrations if we need more fields later.

vectorizationStatus (enum: PENDING, IN_PROGRESS, COMPLETED, FAILED, default: PENDING): Tracks the state of the product's vectorization.

lastSyncAt (timestamp): The timestamp of the last successful synchronization.

shop (Many-to-One Relation): A foreign key relationship linking back to the Shop entity.

1.2. Update Shop Entity
Action: Modify src/shop/shop.entity.ts.

Purpose: Establish the other side of the relationship.

New Field:

products (One-to-Many Relation):

@OneToMany(() => Product, (product) => product.shop)
products: Product[];

2. Core Logic Implementation
   Objective: Create the services responsible for communicating with the Shopify API and managing the synchronization process.

2.1. New ShopifySyncService
Action: Create src/shopify/shopify-sync.service.ts.

Purpose: This service will encapsulate all logic related to fetching data from the Shopify GraphQL Admin API.

Key Methods:

createClient(shopUrl: string, accessToken: string): A helper method to create an authenticated Shopify GraphQL client.

fetchAllProducts(shopUrl: string, accessToken: string): The core data-fetching method.

GraphQL Query: It must use the products query from the Shopify Admin API. The query should be designed to fetch data in batches (e.g., 50 products at a time) and handle pagination using cursors (pageInfo, hasNextPage, endCursor).

Looping: The method should loop, making subsequent API calls with the endCursor from the previous response until hasNextPage is false.

Return Value: Returns a complete array of all product nodes fetched from the store.

2.2. New ProductService
Action: Create src/product/product.service.ts.

Purpose: Manages the CRUD operations for our local Product entity.

Key Methods:

upsertProducts(shop: Shop, productsData: any[]):

Takes an array of product data from the ShopifySyncService.

For each product, it performs an "upsert" operation into our database: if a product with the given shopifyProductId exists, it updates it; otherwise, it creates a new one. This prevents duplicates.

It updates the lastSyncAt timestamp for each upserted product and sets vectorizationStatus to PENDING.

getProductsForShop(shopId: number, page: number, limit: number):

A paginated method to fetch products for a specific shop from our local database. This will be used by the frontend.

3. API Endpoints
   Objective: Expose the new functionality to the authenticated frontend.

3.1. New Endpoints in ProductController
Action: Create src/product/product.controller.ts. All endpoints must be protected by the ShopifyAuthGuard.

Endpoints:

GET /api/internal/products:

Query Params: page, limit.

Logic: Calls productService.getProductsForShop to return a paginated list of products for the currently authenticated shop.

POST /api/internal/products/sync:

Logic: This is the trigger for a full synchronization.

Gets the current shop from the request.

Calls shopifySyncService.fetchAllProducts to get all products from the Shopify API.

Calls productService.upsertProducts to save the fetched data into our database.

Returns a success message (e.g., { status: 'Sync started' }).

Future Improvement (Phase 3): This endpoint should be made asynchronous by dispatching a job to a queue instead of running the sync in the request-response cycle. For Phase 2, a synchronous implementation is acceptable for simplicity.

Phase 2: Definition of Done
[ ] Database: The Product entity is created, and the database schema is updated with the new table and relationships.

[ ] Data Fetching: The ShopifySyncService can successfully fetch all products from a development store, correctly handling GraphQL pagination.

[ ] API:

The POST /api/internal/products/sync endpoint correctly triggers the full data fetch and saves the results to the local PostgreSQL database.

The GET /api/internal/products endpoint returns a paginated list of locally stored products for the authenticated shop.

[ ] Frontend Integration: The frontend can successfully call both new endpoints.
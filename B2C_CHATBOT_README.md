# B2C Sales Chatbot - AIDA Implementation

A powerful B2C sales chatbot built on top of your existing Shopify AI Chatbot service, implementing the AIDA methodology (Attention, Interest, Desire, Action) for effective customer conversion.

## 🚀 Features

### AIDA Sales Methodology
- **Attention**: Grabs customer attention with compelling hooks and trending products
- **Interest**: Builds interest by understanding customer needs and lifestyle
- **Desire**: Creates desire by showing how products solve customer problems
- **Action**: Drives customers to purchase with urgency and clear CTAs

### Smart Product Recommendations
- AI-powered product matching based on customer preferences
- Profitability-focused recommendations (higher-margin products prioritized)
- Real-time integration with Shopify product catalog
- Dynamic scoring system considering interests, budget, and user behavior

### Advanced User Tagging System
- Automatic tagging based on customer interactions
- Categories: preferences, interests, budget, pain points, purchase intent
- Segmentation for targeted marketing and future upsales
- Customer lifecycle tracking (browsing → considering → ready_to_buy)

### Multi-Language Support
- English, Russian, Ukrainian, German
- B2C-specific language packs with shopping terminology
- Localized urgency phrases and social proof messages
- Cultural adaptation for different markets

### Analytics & Insights
- Customer engagement scoring
- Purchase intent tracking
- User segmentation analytics
- Revenue and conversion metrics
- Upsale opportunity identification

## 📡 API Endpoints

### Chat Operations
```
POST /b2c-sales/chat
- Process customer messages using AIDA methodology
- Returns AI response, product recommendations, and updated user data

POST /b2c-sales/initialize  
- Initialize new customer session
- Returns welcome message in selected language

GET /b2c-sales/session/:sessionId
- Get current session data and customer profile
```

### Customer Management
```
POST /b2c-sales/session/:sessionId/tags
- Add tags to customer profile for segmentation

GET /b2c-sales/sessions/active
- Get all active customer sessions

POST /b2c-sales/session/:sessionId/clear
- Clear customer session
```

### Analytics
```
GET /b2c-sales/analytics/:conversationId
- Get detailed conversation analytics and insights

POST /b2c-sales/recommendations
- Get personalized product recommendations for customer
```

## 🛠️ Integration Guide

### 1. Initialize Customer Session
```javascript
const response = await fetch('/b2c-sales/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'unique-customer-id',
    language: 'en' // optional, auto-detected if not provided
  })
});

const { welcomeMessage, sessionId } = await response.json();
```

### 2. Process Customer Messages
```javascript
const response = await fetch('/b2c-sales/chat', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-shopify-token' // for shop context
  },
  body: JSON.stringify({
    message: "I'm looking for skincare products",
    sessionId: 'unique-customer-id',
    conversationHistory: [
      { role: 'user', message: 'Hi there!' },
      { role: 'bot', message: 'Welcome! What brings you here today?' }
    ]
  })
});

const {
  response: botMessage,
  engagementScore,
  recommendedProducts,
  nextAction,
  userTags
} = await response.json();
```

### 3. Get Customer Insights
```javascript
const analytics = await fetch(`/b2c-sales/analytics/${conversationId}`);
const insights = await analytics.json();

console.log(insights);
// {
//   totalMessages: 12,
//   averageEngagementScore: 7.5,
//   aidasStagesReached: ['attention', 'interest', 'desire'],
//   userTags: ['interest:skincare', 'budget:premium', 'urgency:high'],
//   purchaseIntent: 'ready_to_buy',
//   keyInsights: ['Looking for anti-aging products', 'Premium price range']
// }
```

## 🎯 Customer Journey Flow

### 1. Greeting Stage
- Welcome customer warmly
- Ask for name and what brings them to the store
- Detect language and initialize session

### 2. Attention Stage (AIDA)
- Grab attention with trending products or special offers
- Ask about interests and preferences
- Create excitement about product possibilities

### 3. Interest Stage (AIDA)
- Build interest by understanding their lifestyle and needs
- Ask about problems they want to solve
- Show how products fit their daily life

### 4. Desire Stage (AIDA)
- Present specific product recommendations
- Use benefits (not features) to create desire
- Add social proof and customer reviews
- Focus on value and problem-solving

### 5. Action Stage (AIDA)
- Create urgency with limited time/stock offers
- Address potential objections
- Guide to clear CTAs: "Add to Cart", "Buy Now"
- Make purchase process simple and compelling

### 6. Follow-up & Upselling
- Re-engage customers who didn't complete purchase
- Offer different products or discounts
- Build long-term customer relationships

## 🏷️ Tagging System

### Automatic Tags Generated:
- **Preferences**: `pref:skincare`, `pref:electronics`, `pref:clothing`
- **Interests**: `interest:anti-aging`, `interest:gaming`, `interest:fitness`
- **Budget**: `budget:premium`, `budget:mid-range`, `budget:budget-friendly`
- **Pain Points**: `pain:acne`, `pain:dry-skin`, `pain:time-management`
- **Purchase Intent**: `intent:browsing`, `intent:considering`, `intent:ready_to_buy`
- **Behavior**: `viewed:product-123`, `purchased:product-456`, `customer:paid`

### Usage for Segmentation:
```javascript
// Get customers interested in skincare
const skincareCustomers = await getUsersByTags(['interest:skincare']);

// Get high-value customers ready to buy
const hotLeads = await getUsersByTags(['intent:ready_to_buy', 'budget:premium']);

// Get customers needing follow-up
const followUpCustomers = await getUsersNeedingFollowUp();
```

## 📊 Analytics Dashboard

### Customer Segments
- **High-Value Customers**: Total spent > $500 or engagement score > 7
- **Frequent Buyers**: 3+ purchases
- **Need Follow-up**: 7+ days since last interaction with "considering" intent
- **New Customers**: ≤ 3 total interactions

### Key Metrics
- **Engagement Score**: Weighted score based on message length, questions asked, interests shown
- **Purchase Intent**: AI-analyzed intent level (browsing/considering/ready_to_buy)
- **Conversion Rate**: Percentage of sessions leading to purchases
- **Average Order Value**: Revenue per completed purchase
- **Customer Lifetime Value**: Predicted value based on behavior patterns

## 🔧 Configuration

### Environment Variables
```bash
# Existing Shopify integration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_secret

# AI Services
GEMINI_API_KEY=your_gemini_api_key
AI_SERVICE_URL=http://localhost:8000

# Database
DATABASE_URL=sqlite:./database.sqlite
```

### Language Support
The system automatically detects customer language and responds appropriately:
- English (en) - Default
- Russian (ru) - Full B2C localization
- Ukrainian (uk) - Full B2C localization  
- German (de) - Full B2C localization

## 🚀 Getting Started

1. **Install Dependencies**
```bash
npm install
```

2. **Set Environment Variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Run Database Migrations**
```bash
npm run build
npm start
```

4. **Test the API**
```bash
curl -X POST http://localhost:3000/b2c-sales/initialize \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-123", "language": "en"}'
```

## 🎪 Difference from B2B Sales Bot

| Feature | B2B (SPIN) | B2C (AIDA) |
|---------|------------|------------|
| **Methodology** | SPIN Selling | AIDA Framework |
| **Focus** | Business needs & problems | Personal desires & lifestyle |
| **Questions** | "What business are you in?" | "What brings you here today?" |
| **Pain Points** | Business inefficiencies | Personal problems to solve |
| **Value Prop** | ROI & business benefits | Lifestyle improvement & satisfaction |
| **Urgency** | Limited time consulting offers | Limited stock & special pricing |
| **Decision Making** | Multiple stakeholders | Individual consumer decision |
| **Conversation Length** | Longer, consultative | Shorter, action-oriented |

## 📈 Future Enhancements

- **Advanced AI Models**: Integration with GPT-4 or Claude for more sophisticated conversations
- **Voice Support**: Audio input/output for voice-based shopping experiences  
- **Visual AI**: Image analysis for product recommendations based on uploaded photos
- **Predictive Analytics**: ML models for churn prediction and optimal pricing
- **Omnichannel**: Integration across email, SMS, social media, and website chat
- **A/B Testing**: Built-in testing framework for optimizing conversion rates

## 📞 Support

For questions about the B2C chatbot implementation:
- Review the existing B2B implementation in `src/sales/sales.service.ts`
- Check B2C-specific logic in `src/sales/b2c-sales.service.ts`
- Language customization in `src/localization/b2c-language-packs.ts`
- Database schema in `src/database/entities/b2c-user.entity.ts`

The B2C chatbot is designed to work seamlessly with your existing Shopify integration while providing specialized B2C sales optimization.
# Product Search Tool

A console-based product search application that uses OpenAI's function calling to filter products based on natural language preferences. The tool intelligently interprets user queries and searches through a product database to find matching items.

## 🚀 Features

- **Natural Language Processing**: Accept search queries in plain English
- **OpenAI Function Calling**: Uses advanced AI to interpret and filter products
- **Intelligent Matching**: Understands synonyms, price ranges, and product features
- **Structured Output**: Returns filtered products in a clean, organized format
- **Multi-Criteria Filtering**: Supports category, price, rating, and stock status filters
- **Interactive Console Interface**: User-friendly command-line experience

## 📋 Supported Search Criteria

The tool can intelligently extract and apply the following criteria from natural language:

- **Category**: Electronics, Fitness, Kitchen, Books, Clothing
- **Price Range**: Maximum price limits (e.g., "under $100", "less than $500")
- **Rating**: Minimum rating requirements (e.g., "highly rated", "above 4.5 stars")
- **Stock Status**: In-stock vs out-of-stock filtering
- **Keywords**: Product-specific features and attributes

## 🛠 Installation

### Prerequisites
- Node.js (version 14.0.0 or higher)
- OpenAI API key

### Setup

1. **Navigate to the project directory:**
   ```bash
   cd 10
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy the example environment file:
     ```bash
     cp env.example .env
     ```
   - Edit `.env` and add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

## 🔧 Configuration

Create a `.env` file with the following variables:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
OPENAI_MODEL=gpt-4.1-mini    # AI model to use (default)
```

### Available Models
- `gpt-4.1-mini` (default, optimized for function calling)
- `whisper-1` (for speech-to-text, not used in this application)

## 🚀 Usage

### Interactive Mode

```bash
npm start
# or
node index.js
```

The application will prompt you to enter your search preferences in natural language.

### Command Line Help

```bash
npm run help
# or
node index.js --help
```

## 📝 Example Search Queries

### Electronics
- `"I need a smartphone under $800 with great features"`
- `"Show me gaming laptops with high ratings"`
- `"Find wireless headphones that are in stock"`

### Fitness Equipment
- `"Looking for fitness equipment under $100 that's available"`
- `"Show me highly rated exercise equipment"`
- `"Find yoga mats and resistance bands"`

### Kitchen Appliances
- `"I want kitchen appliances with rating above 4.5"`
- `"Show me coffee makers and blenders under $80"`
- `"Find air fryers that are in stock"`

### Books
- `"Looking for programming books under $50"`
- `"Show me highly rated novels and fiction"`
- `"Find cookbooks and self-help books"`

### Clothing
- `"I need men's clothing under $50"`
- `"Show me women's shoes and accessories"`
- `"Find jackets and hoodies that are available"`

## 📊 Output Format

The tool provides structured output including:

### Search Summary
- Original query
- Extracted criteria (category, price, rating, keywords)
- Number of products found

### Product List
```
Filtered Products:
1. Wireless Headphones - $99.99, Rating: 4.5, In Stock
2. Smart Watch - $199.99, Rating: 4.6, In Stock
3. Bluetooth Speaker - $49.99, Rating: 4.4, In Stock
```

Each product shows:
- Name
- Price
- Rating
- Stock status (In Stock/Out of Stock)

## 🏗 Technical Architecture

### OpenAI Function Calling
The application uses OpenAI's function calling feature to:
1. Parse natural language preferences
2. Extract structured search criteria
3. Apply intelligent filtering logic
4. Return formatted results

### Function Definition
```javascript
{
  name: 'filter_products',
  description: 'Filter products based on user preferences and criteria',
  parameters: {
    // Structured schema for product filtering
    filtered_products: [...],
    criteria_used: { category, max_price, min_rating, ... }
  }
}
```

### Data Structure
Products are stored in `products.json` with the following schema:
```json
{
  "name": "Product Name",
  "category": "Category",
  "price": 99.99,
  "rating": 4.5,
  "in_stock": true
}
```

## 🔍 How It Works

1. **User Input**: Application accepts natural language query
2. **API Call**: Sends query and product database to OpenAI
3. **Function Calling**: AI uses defined function to filter products
4. **Processing**: Extracts criteria and applies intelligent matching
5. **Output**: Returns structured list of matching products

## 🔒 Security & Privacy

- API keys are stored in environment variables
- No user data is stored or logged
- All processing happens through OpenAI's secure API
- Product data remains local in `products.json`

## 🔍 Troubleshooting

### Common Issues

1. **Missing API Key Error**
   ```
   ❌ Error: OpenAI API key not found!
   ```
   - Ensure `.env` file exists with `OPENAI_API_KEY=your_key`

2. **Function Calling Errors**
   ```
   OpenAI API Error: Function call not executed properly
   ```
   - Check if your API key has function calling access
   - Try using `gpt-4.1-mini` model

3. **Products Loading Error**
   ```
   ❌ Error loading products.json
   ```
   - Ensure `products.json` exists in the same directory
   - Check file permissions and JSON syntax

### Dependencies Issues

If you encounter installation issues:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📈 Performance Tips

1. **Model Selection**: `gpt-4.1-mini` provides excellent results for function calling with good performance
2. **Query Clarity**: More specific queries yield better results
3. **API Limits**: Be aware of OpenAI rate limits for high-volume usage

## 🎯 Use Cases

Perfect for:
- **E-commerce Applications**: Product recommendation systems
- **Inventory Management**: Natural language inventory search
- **Customer Service**: Automated product assistance
- **Market Research**: Product analysis and filtering
- **Personal Shopping**: Finding products based on preferences

## 📊 Database

The application includes 50 sample products across 5 categories:
- **Electronics** (10 products): Smartphones, laptops, headphones, etc.
- **Fitness** (10 products): Exercise equipment, yoga mats, etc.
- **Kitchen** (10 products): Appliances, cookware, etc.
- **Books** (10 products): Various genres and topics
- **Clothing** (10 products): Men's and women's apparel

---

*This tool demonstrates the power of OpenAI's function calling capabilities for natural language product search and filtering.* 
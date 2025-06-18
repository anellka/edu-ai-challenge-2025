#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

class ProductSearchTool {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
        this.products = [];
        this.loadProducts();
    }

    async loadProducts() {
        try {
            const productsPath = path.join(__dirname, 'products.json');
            this.products = await fs.readJson(productsPath);
            console.log(chalk.green(`✅ Loaded ${this.products.length} products from database`));
        } catch (error) {
            console.error(chalk.red('❌ Error loading products.json:'), error.message);
            process.exit(1);
        }
    }

    async start() {
        console.log(chalk.blue.bold('\n🔍 Product Search Tool'));
        console.log(chalk.gray('Search products using natural language preferences with AI-powered filtering\n'));

        if (!process.env.OPENAI_API_KEY) {
            console.log(chalk.red('❌ Error: OpenAI API key not found!'));
            console.log(chalk.yellow('Please set your OPENAI_API_KEY in a .env file or environment variable.'));
            console.log(chalk.gray('Example: OPENAI_API_KEY=your_api_key_here\n'));
            process.exit(1);
        }

        try {
            const userInput = await this.getUserInput();
            console.log(chalk.yellow('\n⏳ Searching products using AI function calling...'));
            
            const filteredProducts = await this.searchProducts(userInput);
            this.displayResults(filteredProducts, userInput);
            
        } catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(1);
        }
    }

    async getUserInput() {
        const questions = [
            {
                type: 'input',
                name: 'preferences',
                message: 'Enter your product preferences in natural language:',
                validate: (input) => input.trim() ? true : 'Please enter your preferences',
                default: 'I need a smartphone under $800 with a great camera and long battery life'
            }
        ];

        const answers = await inquirer.prompt(questions);
        return answers.preferences;
    }

    async searchProducts(userPreferences) {
        const functionDefinition = {
            name: 'filter_products',
            description: 'Filter products based on user preferences and criteria',
            parameters: {
                type: 'object',
                properties: {
                    filtered_products: {
                        type: 'array',
                        description: 'Array of products that match the user criteria',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', description: 'Product name' },
                                category: { type: 'string', description: 'Product category' },
                                price: { type: 'number', description: 'Product price' },
                                rating: { type: 'number', description: 'Product rating' },
                                in_stock: { type: 'boolean', description: 'Whether product is in stock' }
                            },
                            required: ['name', 'category', 'price', 'rating', 'in_stock']
                        }
                    },
                    criteria_used: {
                        type: 'object',
                        description: 'The criteria extracted from user preferences',
                        properties: {
                            category: { type: 'string', description: 'Preferred category if specified' },
                            max_price: { type: 'number', description: 'Maximum price if specified' },
                            min_rating: { type: 'number', description: 'Minimum rating if specified' },
                            in_stock_only: { type: 'boolean', description: 'Whether to show only in-stock items' },
                            keywords: { 
                                type: 'array', 
                                items: { type: 'string' },
                                description: 'Keywords extracted from preferences' 
                            }
                        }
                    }
                },
                required: ['filtered_products', 'criteria_used']
            }
        };

        const prompt = `
You are a product search assistant. Based on the user's natural language preferences, you need to filter the product database and return ALL matching products.

User Preferences: "${userPreferences}"

Available Products Database:
${JSON.stringify(this.products, null, 2)}

Instructions:
1. Analyze the user's preferences to extract criteria like category, price range, rating requirements, stock status, and keywords
2. Filter the products based on these criteria and return ALL products that match
3. Return ALL matching products along with the criteria you used - do not limit the results
4. Be intelligent about matching - for example:
   - "smartphone" should match products with "smartphone" in the name
   - "under $800" means max_price should be 800
   - "great camera" or "long battery life" are features that might relate to higher-rated electronics
   - "in stock" means in_stock should be true
   - Consider synonyms and related terms (e.g., "phone" = "smartphone")
5. **IMPORTANT: Return ALL products that match the criteria, not just a few examples**

Please use the filter_products function to return ALL matching results.
        `;

        try {
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful product search assistant that uses function calling to filter products based on user preferences."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                functions: [functionDefinition],
                function_call: { name: 'filter_products' },
                temperature: 0.1
            });

            const functionCall = completion.choices[0].message.function_call;
            if (functionCall && functionCall.name === 'filter_products') {
                const result = JSON.parse(functionCall.arguments);
                return result;
            } else {
                throw new Error('Function call not executed properly');
            }
        } catch (error) {
            throw new Error(`OpenAI API Error: ${error.message}`);
        }
    }

    displayResults(result, userInput) {
        console.log(chalk.green('\n✅ Search completed successfully!\n'));
        
        console.log(chalk.cyan('🔍 Search Query: ') + chalk.white(userInput));
        
        if (result.criteria_used) {
            console.log(chalk.cyan('\n📋 Extracted Criteria:'));
            if (result.criteria_used.category) {
                console.log(chalk.gray(`  • Category: ${result.criteria_used.category}`));
            }
            if (result.criteria_used.max_price) {
                console.log(chalk.gray(`  • Max Price: $${result.criteria_used.max_price}`));
            }
            if (result.criteria_used.min_rating) {
                console.log(chalk.gray(`  • Min Rating: ${result.criteria_used.min_rating}`));
            }
            if (result.criteria_used.in_stock_only) {
                console.log(chalk.gray(`  • In Stock Only: Yes`));
            }
            if (result.criteria_used.keywords && result.criteria_used.keywords.length > 0) {
                console.log(chalk.gray(`  • Keywords: ${result.criteria_used.keywords.join(', ')}`));
            }
        }

        console.log(chalk.blue(`\n🛒 Filtered Products (${result.filtered_products.length} found):`));
        console.log(chalk.cyan('================================================================================'));
        
        if (result.filtered_products.length === 0) {
            console.log(chalk.yellow('No products found matching your criteria. Try adjusting your preferences.'));
        } else {
            result.filtered_products.forEach((product, index) => {
                const stockStatus = product.in_stock ? 
                    chalk.green('In Stock') : 
                    chalk.red('Out of Stock');
                
                console.log(chalk.white(`${index + 1}. ${product.name} - $${product.price}, Rating: ${product.rating}, ${stockStatus}`));
            });
        }
        
        console.log(chalk.cyan('================================================================================'));
        console.log(chalk.green('\n🎉 Search complete!'));
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.blue.bold('\n🔍 Product Search Tool'));
    console.log(chalk.gray('Search products using natural language preferences with AI-powered filtering\n'));
    console.log(chalk.yellow('Usage:'));
    console.log('  node index.js                 # Interactive mode');
    console.log('  node index.js --help          # Show this help');
    console.log('\n' + chalk.yellow('Environment Variables:'));
    console.log('  OPENAI_API_KEY                # Required: Your OpenAI API key');
    console.log('  OPENAI_MODEL                  # Optional: OpenAI model (default: gpt-4.1-mini)');
    console.log('\n' + chalk.green('Example Queries:'));
    console.log('  "I need a smartphone under $800 with great features"');
    console.log('  "Show me fitness equipment under $100 that\'s in stock"');
    console.log('  "Find kitchen appliances with rating above 4.5"');
    console.log('  "Looking for books under $30"');
    console.log('\n' + chalk.green('Example:'));
    console.log('  OPENAI_API_KEY=your_key node index.js\n');
    process.exit(0);
}

// Start the application
const searchTool = new ProductSearchTool();
searchTool.start().catch(error => {
    console.error(chalk.red('❌ Fatal Error:'), error.message);
    process.exit(1);
}); 
#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

class ServiceAnalyzer {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
        this.outputToFile = process.env.OUTPUT_TO_FILE === 'true';
        this.outputDirectory = process.env.OUTPUT_DIRECTORY || './reports';
    }

    async start() {
        console.log(chalk.blue.bold('\n🔍 Service & Product Analyzer'));
        console.log(chalk.gray('Generate comprehensive analysis reports for any service or product\n'));

        if (!process.env.OPENAI_API_KEY) {
            console.log(chalk.red('❌ Error: OpenAI API key not found!'));
            console.log(chalk.yellow('Please set your OPENAI_API_KEY in a .env file or environment variable.'));
            console.log(chalk.gray('Example: OPENAI_API_KEY=your_api_key_here\n'));
            process.exit(1);
        }

        try {
            const answers = await this.promptUser();
            console.log(chalk.yellow('\n⏳ Analyzing and generating report...'));
            
            const report = await this.generateReport(answers);
            await this.displayReport(report, answers);
            
        } catch (error) {
            console.error(chalk.red('❌ Error:'), error.message);
            process.exit(1);
        }
    }

    async promptUser() {
        const questions = [
            {
                type: 'list',
                name: 'inputType',
                message: 'How would you like to provide the service information?',
                choices: [
                    { name: 'Known service name (e.g., Spotify, Notion)', value: 'serviceName' },
                    { name: 'Custom service description', value: 'description' }
                ]
            }
        ];

        const initialAnswers = await inquirer.prompt(questions);

        if (initialAnswers.inputType === 'serviceName') {
            const serviceQuestions = [
                {
                    type: 'input',
                    name: 'serviceName',
                    message: 'Enter the service name:',
                    validate: (input) => input.trim() ? true : 'Please enter a service name'
                }
            ];
            const serviceAnswers = await inquirer.prompt(serviceQuestions);
            return { ...initialAnswers, ...serviceAnswers };
        } else {
            const descriptionQuestions = [
                {
                    type: 'input',
                    name: 'description',
                    message: 'Enter the service description (you can provide a detailed description):',
                    validate: (input) => input.trim() ? true : 'Please enter a description'
                }
            ];
            const descriptionAnswers = await inquirer.prompt(descriptionQuestions);
            return { ...initialAnswers, ...descriptionAnswers };
        }
    }

    async generateReport(answers) {
        const inputText = answers.inputType === 'serviceName' 
            ? `Service Name: ${answers.serviceName}`
            : `Service Description: ${answers.description}`;

        const prompt = this.buildPrompt(inputText);

        try {
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a professional business analyst and product researcher. You provide comprehensive, well-structured analyses of digital services and products."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            });

            return completion.choices[0].message.content;
        } catch (error) {
            throw new Error(`OpenAI API Error: ${error.message}`);
        }
    }

    buildPrompt(inputText) {
        return `
Analyze the following service/product and create a comprehensive markdown-formatted report. 
The report must include ALL of the following sections with detailed information:

${inputText}

Please provide a comprehensive analysis in the following markdown format:

# Service Analysis Report

## Brief History
- Founding year, key milestones, major developments

## Target Audience
- Primary user segments and demographics
- Use cases and scenarios

## Core Features
- Top 2-4 key functionalities
- What makes this service functional

## Unique Selling Points
- Key differentiators from competitors
- What sets this service apart

## Business Model
- How the service generates revenue
- Pricing strategy and monetization approach

## Tech Stack Insights
- Technologies, platforms, or frameworks likely used
- Technical architecture insights (if available)

## Perceived Strengths
- Mentioned positives or standout features
- What users typically praise

## Perceived Weaknesses
- Common criticisms or limitations
- Areas for potential improvement

Make sure each section is well-researched and provides valuable insights. If analyzing a well-known service, use your knowledge. If analyzing a custom description, base your analysis on the provided information and industry best practices.

Write in a professional, analytical tone suitable for product managers, investors, or business stakeholders.
`;
    }

    async displayReport(report, answers) {
        console.log(chalk.green('\n✅ Report generated successfully!\n'));
        console.log(chalk.cyan('================================================================================'));
        console.log(report);
        console.log(chalk.cyan('================================================================================'));

        if (this.outputToFile) {
            await this.saveReportToFile(report, answers);
        }

        const saveQuestion = [{
            type: 'confirm',
            name: 'saveToFile',
            message: 'Would you like to save this report to a file?',
            default: true
        }];

        const saveAnswer = await inquirer.prompt(saveQuestion);
        if (saveAnswer.saveToFile) {
            await this.saveReportToFile(report, answers);
        }

        console.log(chalk.green('\n🎉 Analysis complete!'));
    }

    async saveReportToFile(report, answers) {
        try {
            await fs.ensureDir(this.outputDirectory);
            
            const serviceName = answers.serviceName || 'custom-service';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${serviceName.toLowerCase().replace(/\s+/g, '-')}-analysis-${timestamp}.md`;
            const filepath = path.join(this.outputDirectory, filename);

            await fs.writeFile(filepath, report, 'utf8');
            console.log(chalk.green(`\n📄 Report saved to: ${filepath}`));
        } catch (error) {
            console.error(chalk.red('❌ Error saving file:'), error.message);
        }
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.blue.bold('\n🔍 Service & Product Analyzer'));
    console.log(chalk.gray('Generate comprehensive analysis reports for any service or product\n'));
    console.log(chalk.yellow('Usage:'));
    console.log('  node index.js                 # Interactive mode');
    console.log('  node index.js --help          # Show this help');
    console.log('\n' + chalk.yellow('Environment Variables:'));
    console.log('  OPENAI_API_KEY                # Required: Your OpenAI API key');
    console.log('  OPENAI_MODEL                  # Optional: OpenAI model (default: gpt-3.5-turbo)');
    console.log('  OUTPUT_TO_FILE                # Optional: Auto-save reports (true/false)');
    console.log('  OUTPUT_DIRECTORY              # Optional: Report directory (default: ./reports)');
    console.log('\n' + chalk.green('Example:'));
    console.log('  OPENAI_API_KEY=your_key node index.js\n');
    process.exit(0);
}

// Start the application
const analyzer = new ServiceAnalyzer();
analyzer.start().catch(error => {
    console.error(chalk.red('❌ Fatal Error:'), error.message);
    process.exit(1);
}); 
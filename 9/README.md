# Service & Product Analyzer

A lightweight console application built with Node.js that analyzes services and products using AI to generate comprehensive, markdown-formatted reports from multiple business perspectives.

## 🚀 Features

- **Dual Input Methods**: Analyze known services (e.g., "Spotify", "Notion") or provide custom service descriptions
- **AI-Powered Analysis**: Uses OpenAI's GPT models for intelligent analysis
- **Comprehensive Reports**: Generates reports with 8 key sections covering business, technical, and user perspectives
- **Interactive CLI**: User-friendly command-line interface with prompts
- **Export Options**: Save reports as markdown files with timestamps
- **Configurable**: Customizable through environment variables

## 📋 Report Sections

Each generated report includes:

1. **Brief History** - Founding year, milestones, and major developments
2. **Target Audience** - Primary user segments and demographics
3. **Core Features** - Top 2-4 key functionalities
4. **Unique Selling Points** - Key differentiators from competitors
5. **Business Model** - Revenue generation and pricing strategy
6. **Tech Stack Insights** - Technologies and architecture insights
7. **Perceived Strengths** - Standout features and user praise
8. **Perceived Weaknesses** - Common criticisms and limitations

## 🛠 Installation

### Prerequisites
- Node.js (version 14.0.0 or higher)
- OpenAI API key

### Setup

1. **Navigate to the project directory:**
   ```bash
   cd 9
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
## 🚀 Usage

### Interactive Mode (Recommended)

```bash
npm start
# or
node index.js
```

Follow the interactive prompts to:
1. Choose input method (service name or description)
2. Provide the service information
3. Wait for AI analysis
4. View the generated report
5. Optionally save to file

## 🔧 Configuration

Create a `.env` file with the following variables:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
OPENAI_MODEL=gpt-4.1-mini          # AI model to use
OUTPUT_TO_FILE=false                 # Auto-save reports
OUTPUT_DIRECTORY=./reports           # Report save directory
```

### Available Models
- `gpt-4.1-mini` (default, cost-effective)
- `whisper-1` (more comprehensive analysis, higher cost)




### Command Line Help

```bash
node index.js --help
```

### Example Usage Scenarios

#### Analyzing a Known Service
```
? How would you like to provide the service information? Known service name
? Enter the service name: Spotify
```

#### Analyzing a Custom Service
```
? How would you like to provide the service information? Custom service description
? Enter the service description: [Editor opens for detailed description]
```

## 📁 Output

Reports are generated in markdown format and can be:
- Displayed in the terminal with color formatting
- Saved to files with timestamps (e.g., `spotify-analysis-2024-01-15T10-30-00.md`)
- Stored in a configurable directory (default: `./reports/`)

## 📄 Sample Report Structure

```markdown
# Service Analysis Report

## Brief History
- Founded in 2006 by Daniel Ek and Martin Lorentzon
- Launched publicly in 2008...

## Target Audience
- Music enthusiasts aged 16-34
- Podcast listeners...

## Core Features
- Music streaming with 70+ million tracks
- Personalized playlists and recommendations...

[... continues with all 8 sections]
```


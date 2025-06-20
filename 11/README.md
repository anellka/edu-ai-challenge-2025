# Audio Transcription & Analysis Tool

A Node.js console application that transcribes audio files using OpenAI's Whisper API and provides intelligent analysis including summaries and custom statistics.

## Features

- 🎵 **Audio Transcription**: Uses OpenAI's Whisper-1 model for accurate speech-to-text conversion with speaker identification
- 📊 **Smart Analysis**: Extracts custom statistics directly from transcription including:
  - Total word count (excluding filler words)
  - Speaking speed (words per minute based on actual audio duration)
  - Intelligent topic extraction (meaningful subjects, not filler words like "um", "yeah", "okay")
- 📝 **Smart Summarization**: Generates concise summaries using GPT-4.1-mini
- 💾 **File Management**: Automatically saves transcriptions, summaries, and analysis in organized folders
- 👥 **Speaker Identification**: Automatically identifies and labels different speakers in conversations
- 🎯 **Multiple Formats**: Supports various audio formats (mp3, wav, m4a, etc.)

## Prerequisites

- **Node.js** (version 14 or higher)
- **OpenAI API Key** with access to:
  - `whisper-1` model
  - `gpt-4.1-mini` model

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd 11/
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_actual_openai_api_key_here
     ```

## Usage

### Basic Usage

Run the application with an audio file:

```bash
node index.js <audio-file-path>
```

### Examples

```bash
# Process the provided sample file
node index.js CAR0004.mp3

# Process any other audio file
node index.js /path/to/your/audio.mp3

# Using npm script
npm start CAR0004.mp3
```

## Output Files

The application creates a folder named after the input audio file (without extension) and generates three types of output files inside it:

**Folder Structure:**
```
CAR0004/
├── transcription-TIMESTAMP.md
├── summary-TIMESTAMP.md
└── analysis-TIMESTAMP.json
```

**File Contents:**

1. **Transcription File** (`transcription-TIMESTAMP.md`):
   - Contains the full transcribed text with speaker identification
   - Markdown formatted with timestamps
   - Format: **Speaker X** [MM:SS]: [spoken text]

2. **Summary File** (`summary-TIMESTAMP.md`):
   - AI-generated summary of the audio content
   - Highlights key points and main topics

3. **Analysis File** (`analysis-TIMESTAMP.json`):
   - JSON format with statistics:
     ```json
     {
       "word_count": 1280,
       "speaking_speed_wpm": 132,
       "frequently_mentioned_topics": [
         { "topic": "Technology", "mentions": 8 },
         { "topic": "Business", "mentions": 6 },
         { "topic": "Development", "mentions": 4 }
       ]
     }
     ```

## Console Output

The application provides real-time feedback and displays:

- Processing status for each step
- Complete summary of the audio content
- Analytics including word count, speaking speed, and top topics
- File locations where results are saved

## Speaker Identification

The application automatically identifies different speakers in audio files:

- **Automatic Detection**: Uses timestamps and pause patterns to detect speaker changes
- **Clear Formatting**: Each speaker is labeled as "Speaker 1", "Speaker 2", etc.
- **Timestamp Integration**: Shows when each speaker segment begins
- **Fallback Processing**: If advanced detection fails, uses basic text analysis for speaker separation

**Example Transcription Format:**
```
**Speaker 1** [0:05]: Welcome everyone to today's meeting.

**Speaker 2** [0:12]: Thank you for having me. I'm excited to discuss the project updates.

**Speaker 1** [0:18]: Great! Let's start with the technical overview.
```

## Supported Audio Formats

The application supports various audio formats including:
- MP3
- WAV
- M4A
- FLAC
- OGG

## Error Handling

The application includes comprehensive error handling for:
- Missing API key
- Invalid or missing audio files
- API rate limits or failures
- Network connectivity issues

## Example Output

```
🎵 Audio Transcription & Analysis Tool
=====================================

🚀 Starting audio analysis for: CAR0004.mp3
------------------------------------------------------------
📁 Created output directory: CAR0004
🎵 Transcribing audio file...
✅ Transcription completed
📝 Generating summary...
✅ Summary generated
📊 Analyzing transcript...
✅ Analysis completed
💾 Transcription saved to: CAR0004/transcription-2024-01-15T10-30-45-123Z.md
💾 Summary saved to: CAR0004/summary-2024-01-15T10-30-45-123Z.md
💾 Analysis saved to: CAR0004/analysis-2024-01-15T10-30-45-123Z.json

============================================================
📊 TRANSCRIPTION ANALYSIS RESULTS
============================================================

📝 SUMMARY:
----------------------------------------
[AI-generated summary of the audio content]

📊 ANALYTICS:
----------------------------------------
Word Count: 1280
Speaking Speed: 132 WPM

Frequently Mentioned Topics:
1. Technology: 8 mentions
2. Business: 6 mentions
3. Development: 4 mentions

============================================================

✅ Audio processing completed successfully!
📁 All files saved in: CAR0004/
```

## API Costs

This application makes calls to OpenAI APIs:
- **Whisper API**: ~$0.006 per minute of audio
- **GPT-4.1-mini**: ~$0.00015 per 1K tokens

## Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY environment variable is required"**
   - Ensure you have created a `.env` file with your API key

2. **"Audio file not found"**
   - Check the file path and ensure the audio file exists
   - Use absolute paths if relative paths don't work

3. **API Rate Limit Errors**
   - Wait a moment and try again
   - Check your OpenAI API usage limits

4. **Network Errors**
   - Ensure you have a stable internet connection
   - Check if OpenAI services are operational

### Getting Help

If you encounter issues:
1. Check that your OpenAI API key has the required permissions
2. Verify your Node.js version is 14 or higher
3. Ensure all dependencies are properly installed
4. Check the console output for specific error messages

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request 
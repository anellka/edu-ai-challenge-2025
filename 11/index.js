#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

// Disable OpenAI debug logging
process.env.OPENAI_LOG_LEVEL = 'warn';

class AudioTranscriptionAnalyzer {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.error('Error: OPENAI_API_KEY environment variable is required');
            console.error('Please create a .env file with your OpenAI API key');
            process.exit(1);
        }
        
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async transcribeAudio(audioFilePath) {
        try {
            console.log('🎵 Transcribing audio file...');
            
            if (!fs.existsSync(audioFilePath)) {
                throw new Error(`Audio file not found: ${audioFilePath}`);
            }

            const audioFile = fs.createReadStream(audioFilePath);
            
            const transcription = await this.openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                response_format: 'verbose_json',
                prompt: 'Transcribe this audio clearly with accurate timestamps. Focus on providing high-quality transcription with proper punctuation and formatting.'
            });

            console.log('✅ Transcription completed');
            
            // Process the verbose JSON response to format with speaker identification and extract analysis
            const result = await this.processTranscriptionResponse(transcription);
            
            return result;
        } catch (error) {
            console.error('❌ Error transcribing audio:', error.message);
            throw error;
        }
    }

    async processTranscriptionResponse(transcriptionResponse) {
        // Format transcription with speakers
        const formattedTranscription = this.formatTranscriptionWithSpeakers(transcriptionResponse);
        
        // Extract analysis data from the transcription
        const analysisData = await this.extractAnalysisFromTranscription(transcriptionResponse, formattedTranscription);
        
        return {
            transcription: formattedTranscription,
            analysis: analysisData
        };
    }

    async extractAnalysisFromTranscription(transcriptionResponse, formattedText) {
        // Calculate word count from clean text (remove speaker labels and timestamps)
        const cleanText = this.removeFormattingFromText(formattedText);
        const words = cleanText.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;

        // Calculate speaking speed using the duration from Whisper response
        let speakingSpeedWpm = 150; // Default fallback
        if (transcriptionResponse.duration) {
            const durationMinutes = transcriptionResponse.duration / 60;
            speakingSpeedWpm = Math.round(wordCount / durationMinutes);
        } else {
            // Fallback estimation
            const estimatedDurationMinutes = wordCount / 150;
            speakingSpeedWpm = Math.round(wordCount / estimatedDurationMinutes);
        }

        // Extract frequently mentioned topics using AI analysis
        const frequentlyMentionedTopics = await this.extractTopicsWithAI(formattedText);

        return {
            word_count: wordCount,
            speaking_speed_wpm: speakingSpeedWpm,
            frequently_mentioned_topics: frequentlyMentionedTopics
        };
    }

    formatTranscriptionWithSpeakers(transcriptionResponse) {
        try {
            // If the response is verbose JSON, it will have segments with timestamps
            if (transcriptionResponse.segments && Array.isArray(transcriptionResponse.segments)) {
                let formattedText = '';
                
                transcriptionResponse.segments.forEach((segment) => {
                    const text = segment.text.trim();
                    if (!text) return;
                    
                    // Format timestamp
                    const timestamp = segment.start;
                    const minutes = Math.floor(timestamp / 60);
                    const seconds = Math.floor(timestamp % 60);
                    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    // Add timestamp and text without speaker identification
                    formattedText += `**[${timeStr}]**: ${text}\n\n`;
                });
                
                return formattedText.trim();
            } else {
                // Fallback: if not verbose JSON, return plain text
                return transcriptionResponse.text || transcriptionResponse;
            }
        } catch (error) {
            console.warn('⚠️  Could not format with timestamps, using plain text');
            return transcriptionResponse.text || transcriptionResponse;
        }
    }

    async summarizeText(text) {
        try {
            console.log('📝 Generating summary...');
            
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4.1-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that creates concise, well-structured summaries of transcribed audio content. Focus on key points, main topics, and important information.'
                    },
                    {
                        role: 'user',
                        content: `Please provide a comprehensive summary of the following transcribed audio content:\n\n${text}`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });

            console.log('✅ Summary generated');
            return completion.choices[0].message.content;
        } catch (error) {
            console.error('❌ Error generating summary:', error.message);
            throw error;
        }
    }

    removeFormattingFromText(text) {
        // Remove timestamps to get clean word count
        return text
            .replace(/\*\*\[\d+:\d+\]\*\*:\s*/g, '') // Remove timestamp labels
            .replace(/\*\*Speaker \d+\*\*\s*\[\d+:\d+\]:\s*/g, '') // Fallback: Remove old speaker format with timestamps
            .replace(/\*\*Speaker \d+\*\*:\s*/g, '') // Fallback: Remove old speaker format without timestamps
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim();
    }

    async extractTopicsWithAI(transcription) {
        try {
            console.log('🤖 Using AI to extract meaningful topics...');
            
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4.1-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing transcribed conversations and identifying the most frequently mentioned and important topics. Your task is to extract 3-5 key topics that are actually discussed in the content, count how many times each topic appears, and return them in JSON format. Focus on meaningful subjects, concepts, products, processes, or themes discussed - NOT filler words (um, uh, yeah, okay, well, so, like), common verbs (is, are, have, get, go, do), or generic terms (thing, stuff, something). Be specific and accurate - only include topics that are genuinely present in the text.'
                    },
                    {
                        role: 'user',
                        content: `Please analyze the following transcription to identify the most frequently mentioned meaningful topics. Count actual mentions and references to each topic.

TRANSCRIPTION:
${transcription}

Please return a JSON array of the top 3-5 topics in this exact format:
[
  {"topic": "Topic Name", "mentions": number_of_mentions},
  {"topic": "Another Topic", "mentions": number_of_mentions}
]

Focus on substantial topics like:
- Specific products, services, or brands
- Key concepts, processes, or technologies
- Important themes or subjects of discussion
- Medical conditions, symptoms, or treatments (if applicable)
- Business concepts or strategies

Exclude filler words, common verbs, and generic conversation words. Only include topics that represent meaningful content discussed in the conversation.`
                    }
                ],
                max_tokens: 500,
                temperature: 0.1
            });

            const response = completion.choices[0].message.content.trim();
            
            // Try to parse the JSON response
            try {
                // Extract JSON from response if it's wrapped in markdown code blocks
                const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, response];
                const jsonString = jsonMatch[1];
                
                const topics = JSON.parse(jsonString);
                if (Array.isArray(topics) && topics.length > 0) {
                    console.log('✅ AI topic extraction successful');
                    return topics;
                }
            } catch (parseError) {
                console.warn('⚠️  Could not parse AI response, returning empty topics');
            }
            
            // Return empty array if AI fails
            return [];
            
        } catch (error) {
            console.warn('⚠️  AI topic extraction failed, returning empty topics:', error.message);
            return [];
        }
    }

    saveTranscription(transcription, outputDir, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const transcriptionFile = filename || `transcription-${timestamp}.md`;
        const fullPath = path.join(outputDir, transcriptionFile);
        
        const content = `# Audio Transcription\n\n**Generated on:** ${new Date().toLocaleString()}\n\n## Transcription\n\n${transcription}`;
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`💾 Transcription saved to: ${fullPath}`);
        return fullPath;
    }

    saveSummary(summary, outputDir, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const summaryFile = filename || `summary-${timestamp}.md`;
        const fullPath = path.join(outputDir, summaryFile);
        
        const content = `# Audio Summary\n\n**Generated on:** ${new Date().toLocaleString()}\n\n## Summary\n\n${summary}`;
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`💾 Summary saved to: ${fullPath}`);
        return fullPath;
    }

    saveAnalysis(analysis, outputDir, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const analysisFile = filename || `analysis-${timestamp}.json`;
        const fullPath = path.join(outputDir, analysisFile);
        
        fs.writeFileSync(fullPath, JSON.stringify(analysis, null, 2), 'utf8');
        console.log(`💾 Analysis saved to: ${fullPath}`);
        return fullPath;
    }

    displayResults(summary, analysis) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TRANSCRIPTION ANALYSIS RESULTS');
        console.log('='.repeat(60));
        
        console.log('\n📝 SUMMARY:');
        console.log('-'.repeat(40));
        console.log(summary);
        
        console.log('\n📊 ANALYTICS:');
        console.log('-'.repeat(40));
        console.log(`Word Count: ${analysis.word_count}`);
        console.log(`Speaking Speed: ${analysis.speaking_speed_wpm} WPM`);
        
        console.log('\nFrequently Mentioned Topics:');
        if (analysis.frequently_mentioned_topics.length > 0) {
            analysis.frequently_mentioned_topics.forEach((topic, index) => {
                console.log(`${index + 1}. ${topic.topic}: ${topic.mentions} mentions`);
            });
        } else {
            console.log('No specific topics identified');
        }
        
        console.log('\n' + '='.repeat(60));
    }

    async processAudioFile(audioFilePath) {
        try {
            console.log(`🚀 Starting audio analysis for: ${audioFilePath}`);
            console.log('-'.repeat(60));

            // Extract filename without extension for folder name
            const audioFileName = path.basename(audioFilePath, path.extname(audioFilePath));
            const outputDir = audioFileName;
            
            // Create output directory if it doesn't exist
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`📁 Created output directory: ${outputDir}`);
            }

            // Step 1: Transcribe audio and extract statistics
            const transcriptionResult = await this.transcribeAudio(audioFilePath);
            const transcription = transcriptionResult.transcription;
            const analysis = transcriptionResult.analysis;
            console.log('📊 Analysis extracted from transcription');
            
            // Step 2: Generate summary
            const summary = await this.summarizeText(transcription);
            
            // Step 3: Save results
            this.saveTranscription(transcription, outputDir);
            this.saveSummary(summary, outputDir);
            this.saveAnalysis(analysis, outputDir);
            
            // Step 5: Display results
            this.displayResults(summary, analysis);
            
            console.log(`\n✅ Audio processing completed successfully!`);
            console.log(`📁 All files saved in: ${outputDir}/`);
            
        } catch (error) {
            console.error('\n❌ Error processing audio file:', error.message);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    console.log('🎵 Audio Transcription & Analysis Tool');
    console.log('=====================================\n');

    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node index.js <audio-file-path>');
        console.log('Example: node index.js CAR0004.mp3');
        process.exit(1);
    }

    const audioFilePath = args[0];
    const analyzer = new AudioTranscriptionAnalyzer();
    
    await analyzer.processAudioFile(audioFilePath);
}

// Run the application
if (require.main === module) {
    main().catch(console.error);
}

module.exports = AudioTranscriptionAnalyzer; 
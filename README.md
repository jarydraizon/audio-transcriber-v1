# AI Audio Transcription Tool

A full-stack web application that converts audio files to text using OpenAI's Whisper API and generates structured summaries using GPT-4o.

<!-- 
For a screenshot of the application in action, you can add an image here:
![Audio Transcription Tool Screenshot](path/to/screenshot.png)
-->

## Features

- **Audio Transcription**: Convert speech to text with high accuracy using OpenAI's Whisper API
- **Large File Support**: Automatically compresses files larger than 25MB to meet API requirements
- **Multiple Format Support**: Works with common audio formats (MP3, WAV, M4A, etc.)
- **AI-Powered Summaries**: Generates structured summaries with key points, topics, and action items
- **User-Friendly Interface**: Clean, responsive design with progress indicators
- **Language Detection**: Automatically detects and transcribes over 50 languages

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js, Express
- **APIs**: OpenAI Whisper API (transcription), OpenAI GPT-4o (summarization)
- **File Processing**: FFmpeg with Opus codec for audio compression

## Installation and Setup

### Prerequisites

- Node.js v18+ and npm
- An OpenAI API key
- FFmpeg installed on your system (for audio compression)

#### Installing FFmpeg

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**On macOS (using Homebrew):**
```bash
brew install ffmpeg
```

**On Windows:**
1. Download from [FFmpeg's official website](https://ffmpeg.org/download.html)
2. Add FFmpeg to your system PATH

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ai-audio-transcription-tool.git
cd ai-audio-transcription-tool
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Start the development server**

```bash
npm run dev
```

The application will be available at http://localhost:5000

## Usage

1. **Upload an audio file**: Click the upload area or drag and drop an audio file (up to 100MB)
2. **Wait for transcription**: A progress indicator will show the status
3. **View the transcript**: Once complete, the transcript text will appear
4. **Generate a summary**: Switch to the "Summary" tab to see an AI-generated structured summary
5. **Copy or download**: Use the buttons to copy text or download as a text file

## Production Deployment

To build the application for production:

```bash
npm run build
```

Then to start the production server:

```bash
npm start
```

## Configuration Options

You can modify these configuration options in `server/routes.ts`:

- **MAX_FILE_SIZE**: Maximum file size allowed (default: 100MB)
- **COMPRESSION_THRESHOLD**: Size threshold for audio compression (default: 25MB)
- **COMPRESSION_BITRATE**: Opus codec bitrate for compression (default: 24kbps)

## How it Works

1. **File Upload**: The client uploads an audio file to the server
2. **Size Check**: If the file exceeds 25MB, it's automatically compressed using FFmpeg with the Opus codec
3. **Transcription**: The file is sent to OpenAI's Whisper API for transcription
4. **Summarization**: When the summary tab is selected, the transcript is sent to OpenAI's GPT-4o model for intelligent summarization
5. **Result Display**: The transcript and structured summary are displayed to the user

## License

[MIT License](LICENSE)

## Acknowledgments

- OpenAI for providing the Whisper and GPT APIs
- The shadcn/ui component library
- FFmpeg for audio processing

## Troubleshooting

### Common Issues

#### Error: "Maximum content size limit exceeded"
- This occurs when trying to send a file that's too large to the OpenAI API
- Make sure FFmpeg is properly installed for automatic compression
- Try manually compressing the audio file before uploading

#### Error: "OpenAI API key not configured"
- Ensure you've created a `.env` file with your `OPENAI_API_KEY`
- Verify that your OpenAI API key is valid and has sufficient credits

#### Error: "Failed to generate summary"
- Check that your OpenAI API key has access to the GPT-4o model
- Ensure your transcript isn't too long (try with a shorter transcript first)

### FFmpeg Not Found
If you encounter errors related to FFmpeg:
1. Verify FFmpeg is installed by running `ffmpeg -version` in your terminal
2. Make sure FFmpeg is in your system PATH
3. On Windows, you might need to restart your terminal or computer after installing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
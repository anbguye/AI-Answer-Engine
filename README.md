# AI Answer Engine

A real-time AI chat application built with Next.js, featuring rate limiting, web scraping capabilities, and Redis caching.

## Features

- 💬 Real-time chat interface with AI
- 🚀 Built with Next.js and TypeScript
- 🔒 Rate limiting protection using Upstash Redis
- 🌐 Web scraping functionality with cheerio
- 💾 Redis caching for scraped content
- 🎨 Modern UI with dark mode using Tailwind CSS
- ⚡ Responsive design

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Groq API
- **Caching**: Upstash Redis
- **Web Scraping**: Cheerio, Axios
- **Rate Limiting**: @upstash/ratelimit

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Upstash Redis account
- Groq API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:
```env
GROQ_API_KEY=your_groq_api_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anbguye/AI-Answer-Engine.git
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features in Detail

### Rate Limiting
- Implements sliding window rate limiting
- Limits to 10 requests per 60 seconds per IP
- Configurable through middleware

### Web Scraping
- Scrapes web content with proper cleaning and formatting
- Caches scraped content in Redis
- Handles various HTML elements (articles, headings, meta descriptions)
- Maximum cache size of 1MB per entry
- 24-hour cache TTL

### Chat Interface
- Clean and modern UI with dark mode
- Real-time message updates
- Loading states for better UX
- Error handling for failed requests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Next.js team for the amazing framework
- Upstash for Redis hosting
- Groq for AI capabilities

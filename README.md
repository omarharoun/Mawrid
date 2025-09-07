# Mawrid Search Engine

An AI-powered search engine with OpenAI integration, similar to Perplexity but with custom fine-tuning capabilities.

## Features

- 🔍 **AI-Enhanced Search**: Powered by OpenAI for intelligent search responses
- 🕷️ **Web Crawling**: Automatic content discovery and indexing
- 🤖 **Fine-Tuning Ready**: Data collection tools for custom AI model training
- 🎨 **Modern UI**: Beautiful, responsive search interface
- ⚡ **Fast API**: Built with FastAPI for high performance
- 📊 **Real-time Results**: Live search with AI summaries and suggestions

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   FastAPI       │    │   OpenAI API    │
│   (HTML/JS)     │◄──►│   Backend       │◄──►│   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Web Crawler   │
                       │   & Indexing    │
                       └─────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment

Copy the environment example and configure your settings:

```bash
cp env_example.txt .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Application

```bash
python main.py
```

The search engine will be available at `http://localhost:8000`

### 4. Collect Training Data (Optional)

To collect data for fine-tuning your AI model:

```bash
python collect_data.py
```

## API Endpoints

- `GET /` - Search interface
- `POST /api/search/` - Perform search with AI enhancement
- `GET /api/search/suggestions` - Get search suggestions
- `POST /api/search/index` - Index a specific URL
- `POST /api/search/bulk-index` - Bulk index multiple URLs
- `GET /api/search/stats` - Get search engine statistics

## Fine-Tuning

The project includes comprehensive data collection tools for fine-tuning your AI model:

1. **Web Crawling**: Automatically collect content from web pages
2. **Q&A Pairs**: Structure question-answer data for training
3. **Conversation Data**: Collect dialogue data for conversational AI
4. **OpenAI Format**: Export data in OpenAI fine-tuning format

## Configuration

Key configuration options in `app/core/config.py`:

- `openai_model`: OpenAI model to use (default: gpt-3.5-turbo)
- `max_search_results`: Maximum results per search
- `crawl_delay`: Delay between web crawls
- `max_crawl_depth`: Maximum crawl depth

## Development

### Project Structure

```
├── app/
│   ├── api/           # API endpoints
│   ├── core/          # Configuration and core utilities
│   ├── models/        # Data models
│   ├── services/      # Business logic services
│   └── utils/         # Utility functions
├── templates/         # HTML templates
├── static/           # Static files
├── data/             # Data storage and fine-tuning datasets
└── main.py           # Application entry point
```

### Adding New Features

1. **New API Endpoints**: Add to `app/api/`
2. **New Services**: Add to `app/services/`
3. **Data Models**: Add to `app/models/`
4. **Frontend**: Modify `templates/index.html`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For questions or support, please open an issue on GitHub.

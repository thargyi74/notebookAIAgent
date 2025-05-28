# WordPress AI Search Agent

An intelligent search agent for WordPress databases with advanced Burmese (Myanmar) text processing capabilities, powered by OpenAI's embedding models.

## Features

- **Hybrid Search**: Combines keyword matching with semantic similarity using OpenAI embeddings
- **Burmese Language Support**: Advanced text normalization, tokenization, and synonym expansion for Myanmar language
- **WordPress Integration**: Direct connection to WordPress MySQL database
- **Semantic Understanding**: Uses OpenAI's text-embedding-3-small model for contextual search
- **Query Enhancement**: Automatic expansion of search terms using AI
- **Content Summarization**: AI-powered summaries for long content
- **Flexible Configuration**: Customizable similarity thresholds and search parameters

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wordpress-ai-search-agent
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your settings:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# WordPress Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wordpress_database_name
DB_USER=your_database_username
DB_PASSWORD=your_database_password

# Optional: WordPress URL for generating post links
WORDPRESS_BASE_URL=http://localhost/wordpress
```

## Usage

### Basic Usage

```javascript
import AISearchAgent from './src/ai-search-agent.js';

const agent = new AISearchAgent({
    autoIndex: true,
    maxIndexSize: 1000,
    similarityThreshold: 0.7,
    enableSummarization: true
});

await agent.initialize();

const results = await agent.search('မြန်မာ နည်းပညာ', {
    limit: 10,
    enableSemanticSearch: true,
    enableKeywordSearch: true
});

console.log(results);
```

### Advanced Configuration

```javascript
const agent = new AISearchAgent({
    autoIndex: true,                 // Auto-build search index on initialization
    maxIndexSize: 1000,             // Maximum posts to index
    similarityThreshold: 0.7,       // Minimum similarity score for results
    enableSummarization: true,      // Generate AI summaries for long content
    enableQueryEnhancement: true    // Enhance queries with synonyms/variants
});
```

### Search Options

```javascript
const results = await agent.search('search query', {
    limit: 10,                      // Maximum results to return
    semanticThreshold: 0.7,         // Semantic similarity threshold
    enableSemanticSearch: true,     // Use AI embeddings for search
    enableKeywordSearch: true,      // Use traditional keyword matching
    enhanceQuery: true              // Expand query with AI-generated variants
});
```

## API Reference

### AISearchAgent

#### Constructor Options
- `autoIndex` (boolean): Automatically build search index on initialization
- `maxIndexSize` (number): Maximum number of posts to index
- `similarityThreshold` (number): Minimum similarity score for semantic search
- `enableSummarization` (boolean): Generate AI summaries for search results
- `enableQueryEnhancement` (boolean): Use AI to enhance search queries

#### Methods

##### `initialize()`
Initialize the agent and optionally build the search index.

##### `search(query, options)`
Perform hybrid search combining keyword and semantic matching.

**Parameters:**
- `query` (string): Search query
- `options` (object): Search configuration options

**Returns:** Search results with scores, highlights, and summaries.

##### `getRelatedPosts(postId, limit)`
Find posts related to a specific post.

##### `suggestSearchTerms(partialQuery, limit)`
Generate search term suggestions for autocomplete.

##### `refreshIndex()`
Rebuild the search index with latest database content.

##### `getStats()`
Get agent statistics including index size and memory usage.

##### `cleanup()`
Clean up resources and close database connections.

### BurmeseTextProcessor

Specialized text processing for Myanmar language:

- Text normalization and cleaning
- Syllable-based tokenization
- Synonym expansion
- Search variant generation
- Similarity calculation
- Text highlighting

## Burmese Language Features

### Text Normalization
- Unicode normalization for consistent character representation
- Removal of zero-width characters and extra whitespace
- Standardization of Myanmar script variations

### Tokenization
- Syllable-based tokenization respecting Myanmar script structure
- Proper handling of consonant stacking and vowel signs
- Support for mixed Myanmar-English content

### Synonym Expansion
Built-in synonym mapping for common Myanmar terms:
- မြန်မာ ↔ ဗမာ, မြန်မာနိုင်ငံ, မြန်မာပြည်
- ရန်ကုန် ↔ ရန်ကုန်မြို့, ရန်ကုန်တိုင်း
- And more...

## Performance Considerations

- **Memory Usage**: Each post uses ~6KB for embeddings (1536 dimensions × 4 bytes)
- **Indexing Time**: ~1-2 seconds per 100 posts (depends on OpenAI API speed)
- **Search Speed**: Near-instantaneous for indexed content
- **API Costs**: ~$0.00013 per 1000 tokens for embeddings

## Database Requirements

- WordPress MySQL database with standard wp_posts table
- Read access to wp_posts table
- UTF8MB4 charset support for proper Myanmar text handling

## Error Handling

The agent includes comprehensive error handling for:
- Database connection failures
- OpenAI API errors and rate limits
- Invalid search queries
- Network timeouts
- Memory constraints

## Development

### Run Tests
```bash
npm test
```

### Run Example
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review database connection settings
3. Verify OpenAI API key configuration
4. Open an issue with detailed error logs
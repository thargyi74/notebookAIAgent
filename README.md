# WordPress AI Search Agent

An intelligent search agent for WordPress databases with advanced Burmese (Myanmar) text processing capabilities, powered by OpenAI's embedding models.

## Features

- **Hybrid Search**: Combines keyword matching with semantic similarity using OpenAI embeddings
- **Burmese Language Support**: Advanced text normalization, tokenization, and synonym expansion for Myanmar language
- **WordPress Integration**: Direct connection to WordPress MySQL database
- **ElasticPress Integration**: Search from es_backup index with multi-table support
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
TABLE_PREFIX=wp_

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
ES_BACKUP_INDEX=es_backup

# Search Configuration
SEARCH_LIMIT=30
SIMILARITY_THRESHOLD=0.7
```

## Usage

### ElasticPress Search (New!)

Search from es_backup index with multi-table support:

```bash
# Interactive Elasticsearch search demo
npm run elasticsearch
```

**Search Commands:**
- `your query` - Search all tables
- `table:posts your query` - Search specific table  
- `tables` - List available tables
- `exit` - Quit

**Programmatic Usage:**
```javascript
import ElasticsearchSearchEngine from './src/elasticsearch-search.js';

const searchEngine = new ElasticsearchSearchEngine();

// Initialize and import WordPress data to es_backup
await searchEngine.initializeBackup();

// Search all tables
const results = await searchEngine.search('မြန်မာ နည်းပညာ');

// Search specific table
const postsResults = await searchEngine.searchSpecificTable('technology', 'posts');

// Get available tables
const tables = await searchEngine.getAvailableTables();
```

### Basic AI Search

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

### ElasticsearchSearchEngine

#### Methods

##### `initializeBackup()`
Initialize es_backup index and import WordPress data from all tables.

##### `search(query, options)`
Search across all tables in es_backup index.

**Parameters:**
- `query` (string): Search query
- `options` (object): Search options
  - `tables` (array): Specific tables to search
  - `limit` (number): Maximum results per table
  - `offset` (number): Result offset for pagination
  - `sortBy` (string): Sort field (default: '_score')
  - `sortOrder` (string): Sort order ('asc' or 'desc')

##### `searchSpecificTable(query, tableName, options)`
Search within a specific WordPress table.

##### `searchMultipleTables(query, tableNames, options)`
Search across multiple specified tables.

##### `getAvailableTables()`
Get list of available tables in es_backup with document counts.

##### `displayResults(searchResults)`
Format and display search results grouped by table.

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

### Available Scripts

```bash
# Run AI search agent
npm start

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Run Elasticsearch search demo
npm run elasticsearch
```

### Prerequisites

**For Elasticsearch Integration:**
1. Install and run Elasticsearch:
   ```bash
   # Using Docker
   docker run -d --name elasticsearch \
     -p 9200:9200 -p 9300:9300 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     elasticsearch:8.11.0
   ```

2. Verify Elasticsearch is running:
   ```bash
   curl http://localhost:9200
   ```

**Database Setup:**
- Ensure WordPress database is accessible
- Configure proper table prefix in `.env`
- Test connection with: `node test-db-connection.js`

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
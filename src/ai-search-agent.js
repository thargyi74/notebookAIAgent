import WordPressDatabase from './database.js';
import ElasticsearchSearchEngine from './elasticsearch-search.js';
import BurmeseTextProcessor from './burmese-utils.js';
import OpenAIClient from './openai-client.js';

class AISearchAgent {
    constructor(options = {}) {
        this.database = new WordPressDatabase();
        this.searchEngine = new ElasticsearchSearchEngine();
        this.textProcessor = new BurmeseTextProcessor();
        this.openai = new OpenAIClient();
        
        this.options = {
            autoIndex: true,
            maxIndexSize: 1000,
            similarityThreshold: 0.7,
            enableSummarization: true,
            enableQueryEnhancement: true,
            ...options
        };
        
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('Initializing AI Search Agent...');
            
            await this.database.connect();
            
            if (this.options.autoIndex) {
                await this.buildIndex();
            }
            
            this.isInitialized = true;
            console.log('AI Search Agent initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize AI Search Agent:', error.message);
            throw error;
        }
    }

    async buildIndex() {
        try {
            console.log('Building Elasticsearch index...');
            
            const result = await this.searchEngine.initializeBackup();
            
            if (result.success) {
                console.log(`Elasticsearch index built successfully with ${result.totalIndexed} records`);
            }
            
            return result.success;
        } catch (error) {
            console.error('Failed to build Elasticsearch index:', error.message);
            throw error;
        }
    }

    async search(query, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Agent not initialized. Call initialize() first.');
        }

        if (!query || query.trim().length === 0) {
            throw new Error('Search query cannot be empty');
        }

        const searchOptions = {
            limit: options.limit || 10,
            offset: options.offset || 0,
            tables: options.tables || [],
            sortBy: options.sortBy || '_score',
            sortOrder: options.sortOrder || 'desc'
        };

        try {
            console.log(`Searching for: "${query}"`);
            
            const preprocessedQuery = this.textProcessor.normalizeText(query);
            
            const results = await this.searchEngine.search(preprocessedQuery, searchOptions);
            
            if (this.options.enableSummarization && results.tables && results.tables.posts) {
                for (const result of results.tables.posts.results) {
                    if (result.data.content && result.data.content.length > 300) {
                        try {
                            result.summary = await this.openai.summarizeContent(result.data.content, 150);
                        } catch (error) {
                            console.warn(`Failed to summarize post ${result.id}:`, error.message);
                            result.summary = result.data.content.substring(0, 150) + '...';
                        }
                    }
                }
            }

            console.log(`Found results in ${results.total_tables} table(s)`);
            return results;
            
        } catch (error) {
            console.error('Search failed:', error.message);
            throw error;
        }
    }


    generatePostUrl(post) {
        const baseUrl = process.env.WORDPRESS_BASE_URL || 'http://localhost';
        if (post.post_type === 'page') {
            return `${baseUrl}/${post.post_name || `?page_id=${post.ID}`}`;
        }
        return `${baseUrl}/${post.post_name || `?p=${post.ID}`}`;
    }

    async getRelatedPosts(postId, limit = 5) {
        try {
            const post = await this.database.getPostById(postId);
            if (!post) {
                throw new Error('Post not found');
            }

            const searchQuery = `${post.post_title} ${post.post_excerpt || ''}`;
            const results = await this.search(searchQuery, { 
                limit: limit + 1,
                enableQueryEnhancement: false 
            });

            return results.results.filter(result => result.id !== postId).slice(0, limit);
        } catch (error) {
            console.error('Failed to get related posts:', error.message);
            throw error;
        }
    }

    async suggestSearchTerms(partialQuery, limit = 5) {
        try {
            if (partialQuery.length < 2) {
                return [];
            }

            const enhancedTerms = await this.openai.enhanceSearchQuery(partialQuery);
            return enhancedTerms.slice(0, limit);
        } catch (error) {
            console.warn('Failed to generate search suggestions:', error.message);
            return [partialQuery];
        }
    }

    async getStats() {
        return {
            initialized: this.isInitialized,
            availableTables: await this.searchEngine.getAvailableTables(),
            options: this.options
        };
    }

    async refreshIndex() {
        console.log('Refreshing Elasticsearch index...');
        return await this.buildIndex();
    }

    async cleanup() {
        try {
            if (this.database) {
                await this.database.disconnect();
            }
            this.isInitialized = false;
            console.log('AI Search Agent cleaned up successfully');
        } catch (error) {
            console.error('Cleanup failed:', error.message);
        }
    }
}

export default AISearchAgent;
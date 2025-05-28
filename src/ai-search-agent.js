import WordPressDatabase from './database.js';
import SearchEngine from './search-engine.js';
import BurmeseTextProcessor from './burmese-utils.js';
import OpenAIClient from './openai-client.js';

class AISearchAgent {
    constructor(options = {}) {
        this.database = new WordPressDatabase();
        this.searchEngine = new SearchEngine();
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

    async buildIndex(maxPosts = null) {
        try {
            console.log('Building search index...');
            
            const limit = maxPosts || this.options.maxIndexSize;
            const posts = await this.database.getAllPosts(limit);
            
            if (posts.length === 0) {
                console.log('No posts found to index');
                return false;
            }
            
            const success = await this.searchEngine.indexContent(posts);
            
            if (success) {
                console.log(`Index built successfully with ${posts.length} posts`);
                const stats = this.searchEngine.getIndexStats();
                console.log(`Memory usage: ${stats.memoryUsage}`);
            }
            
            return success;
        } catch (error) {
            console.error('Failed to build index:', error.message);
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
            limit: 10,
            semanticThreshold: this.options.similarityThreshold,
            enableSemanticSearch: true,
            enableKeywordSearch: true,
            enhanceQuery: this.options.enableQueryEnhancement,
            ...options
        };

        try {
            console.log(`Searching for: "${query}"`);
            
            const preprocessedQuery = this.textProcessor.normalizeText(query);
            
            const results = await this.searchEngine.hybridSearch(preprocessedQuery, searchOptions);
            
            if (this.options.enableSummarization && results.length > 0) {
                for (const result of results) {
                    if (result.post.post_content && result.post.post_content.length > 300) {
                        try {
                            result.summary = await this.openai.summarizeContent(result.post.post_content, 150);
                        } catch (error) {
                            console.warn(`Failed to summarize post ${result.post.ID}:`, error.message);
                            result.summary = this.searchEngine.truncateContent(result.post.post_content, 150);
                        }
                    }
                }
            }

            console.log(`Found ${results.length} results`);
            return this.formatSearchResults(results, query);
            
        } catch (error) {
            console.error('Search failed:', error.message);
            throw error;
        }
    }

    formatSearchResults(results, originalQuery) {
        return {
            query: originalQuery,
            totalResults: results.length,
            timestamp: new Date().toISOString(),
            results: results.map((result, index) => ({
                rank: index + 1,
                id: result.post.ID,
                title: result.post.post_title,
                highlightedTitle: result.highlightedTitle,
                content: result.post.post_content,
                highlightedContent: result.highlightedContent,
                summary: result.summary || this.searchEngine.truncateContent(result.post.post_content, 150),
                excerpt: result.post.post_excerpt,
                date: result.post.post_date,
                type: result.post.post_type,
                url: this.generatePostUrl(result.post),
                scores: {
                    combined: parseFloat(result.combinedScore.toFixed(4)),
                    keyword: parseFloat((result.keywordScore || 0).toFixed(4)),
                    semantic: parseFloat((result.semanticScore || 0).toFixed(4))
                }
            }))
        };
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

    getStats() {
        return {
            initialized: this.isInitialized,
            indexStats: this.searchEngine.getIndexStats(),
            options: this.options
        };
    }

    async refreshIndex() {
        console.log('Refreshing search index...');
        this.searchEngine.clearIndex();
        return await this.buildIndex();
    }

    async cleanup() {
        try {
            if (this.database) {
                await this.database.disconnect();
            }
            this.searchEngine.clearIndex();
            this.isInitialized = false;
            console.log('AI Search Agent cleaned up successfully');
        } catch (error) {
            console.error('Cleanup failed:', error.message);
        }
    }
}

export default AISearchAgent;
import OpenAIClient from './openai-client.js';
import BurmeseTextProcessor from './burmese-utils.js';

class SearchEngine {
    constructor() {
        this.openai = new OpenAIClient();
        this.burmeseProcessor = new BurmeseTextProcessor();
        this.embeddings = new Map();
    }

    async indexContent(posts) {
        console.log(`Indexing ${posts.length} posts...`);
        
        const contentTexts = posts.map(post => {
            // Truncate content to prevent token overflow - keep titles and excerpts full
            const truncatedContent = this.truncateContent(post.post_content || '', 500);
            const searchableText = `${post.post_title} ${truncatedContent} ${post.post_excerpt || ''}`;
            return this.burmeseProcessor.normalizeText(searchableText);
        });

        try {
            const chunkSize = 5; // Process 5 posts at a time to stay within token limits
            const allEmbeddings = [];
            
            for (let i = 0; i < contentTexts.length; i += chunkSize) {
                const chunk = contentTexts.slice(i, i + chunkSize);
                console.log(`Processing batch ${Math.floor(i/chunkSize) + 1}/${Math.ceil(contentTexts.length/chunkSize)}`);
                
                const chunkEmbeddings = await this.openai.generateMultipleEmbeddings(chunk);
                allEmbeddings.push(...chunkEmbeddings);
            }
            
            posts.forEach((post, index) => {
                this.embeddings.set(post.ID, {
                    post,
                    embedding: allEmbeddings[index],
                    searchableText: contentTexts[index]
                });
            });

            console.log(`Successfully indexed ${posts.length} posts`);
            return true;
        } catch (error) {
            console.error('Failed to index content:', error.message);
            return false;
        }
    }

    async hybridSearch(query, options = {}) {
        const {
            limit = 10,
            semanticThreshold = 0.7,
            enableSemanticSearch = true,
            enableKeywordSearch = true,
            enhanceQuery = true
        } = options;

        const results = [];

        if (this.embeddings.size === 0) {
            throw new Error('No content indexed. Call indexContent() first.');
        }

        let searchQueries = [query];
        if (enhanceQuery) {
            try {
                searchQueries = await this.openai.enhanceSearchQuery(query);
            } catch (error) {
                console.warn('Query enhancement failed, using original query');
            }
        }

        const allResults = new Map();

        for (const searchQuery of searchQueries) {
            const normalizedQuery = this.burmeseProcessor.normalizeText(searchQuery);

            if (enableKeywordSearch) {
                const keywordResults = this.keywordSearch(normalizedQuery);
                keywordResults.forEach(result => {
                    const existing = allResults.get(result.post.ID) || result;
                    existing.keywordScore = Math.max(existing.keywordScore || 0, result.keywordScore);
                    allResults.set(result.post.ID, existing);
                });
            }

            if (enableSemanticSearch) {
                try {
                    const semanticResults = await this.semanticSearch(normalizedQuery, semanticThreshold);
                    semanticResults.forEach(result => {
                        const existing = allResults.get(result.post.ID) || result;
                        existing.semanticScore = Math.max(existing.semanticScore || 0, result.semanticScore);
                        allResults.set(result.post.ID, existing);
                    });
                } catch (error) {
                    console.warn('Semantic search failed:', error.message);
                }
            }
        }

        const finalResults = Array.from(allResults.values())
            .map(result => ({
                ...result,
                combinedScore: this.calculateCombinedScore(result.keywordScore || 0, result.semanticScore || 0),
                highlightedTitle: this.burmeseProcessor.highlightMatches(result.post.post_title, query),
                highlightedContent: this.burmeseProcessor.highlightMatches(
                    this.truncateContent(result.post.post_content, 200), 
                    query
                )
            }))
            .sort((a, b) => b.combinedScore - a.combinedScore)
            .slice(0, limit);

        return finalResults;
    }

    keywordSearch(query) {
        const results = [];
        const queryVariants = this.burmeseProcessor.createSearchVariants(query);
        const queryTokens = this.burmeseProcessor.tokenize(query);

        for (const [, data] of this.embeddings) {
            let keywordScore = 0;
            const { post, searchableText } = data;
            const contentTokens = this.burmeseProcessor.tokenize(searchableText);

            queryVariants.forEach(variant => {
                const similarity = this.burmeseProcessor.calculateSimilarity(searchableText, variant);
                keywordScore = Math.max(keywordScore, similarity);

                if (this.burmeseProcessor.isBurmese(variant)) {
                    const exactMatch = searchableText.includes(variant);
                    if (exactMatch) keywordScore += 0.8;
                    
                    const fuzzyMatches = this.findFuzzyMatches(variant, contentTokens);
                    if (fuzzyMatches > 0) keywordScore += (fuzzyMatches * 0.3);
                } else {
                    if (searchableText.toLowerCase().includes(variant.toLowerCase())) {
                        keywordScore += 0.5;
                    }
                }
            });

            queryTokens.forEach(qToken => {
                contentTokens.forEach(cToken => {
                    const tokenSimilarity = this.burmeseProcessor.calculateSimilarity(qToken, cToken);
                    if (tokenSimilarity > 0.7) {
                        keywordScore += (tokenSimilarity * 0.4);
                    }
                });
            });

            if (keywordScore > 0.1) {
                results.push({
                    post,
                    keywordScore: Math.min(keywordScore, 2.0),
                    searchableText
                });
            }
        }

        return results.sort((a, b) => b.keywordScore - a.keywordScore);
    }

    findFuzzyMatches(query, tokens) {
        let matches = 0;
        const queryLength = query.length;
        
        tokens.forEach(token => {
            if (token.length >= queryLength - 1 && token.length <= queryLength + 1) {
                const similarity = this.burmeseProcessor.calculateSimilarity(query, token);
                if (similarity > 0.6) {
                    matches++;
                }
            }
        });
        
        return matches;
    }

    async semanticSearch(query, threshold = 0.7) {
        try {
            const queryEmbedding = await this.openai.generateEmbedding(query);
            const results = [];

            for (const [, data] of this.embeddings) {
                const similarity = this.openai.calculateCosineSimilarity(
                    queryEmbedding, 
                    data.embedding
                );

                if (similarity >= threshold) {
                    results.push({
                        post: data.post,
                        semanticScore: similarity,
                        searchableText: data.searchableText
                    });
                }
            }

            return results.sort((a, b) => b.semanticScore - a.semanticScore);
        } catch (error) {
            console.error('Semantic search failed:', error.message);
            return [];
        }
    }

    calculateCombinedScore(keywordScore, semanticScore) {
        const keywordWeight = 0.4;
        const semanticWeight = 0.6;
        
        return (keywordScore * keywordWeight) + (semanticScore * semanticWeight);
    }

    truncateContent(content, maxLength = 200) {
        if (!content || content.length <= maxLength) return content;
        
        const truncated = content.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    }

    getIndexStats() {
        return {
            totalIndexed: this.embeddings.size,
            memoryUsage: `${(this.embeddings.size * 1536 * 4 / 1024 / 1024).toFixed(2)} MB`
        };
    }

    clearIndex() {
        this.embeddings.clear();
        console.log('Search index cleared');
    }
}

export default SearchEngine;
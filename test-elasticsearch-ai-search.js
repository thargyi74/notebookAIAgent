import AISearchAgent from './src/ai-search-agent.js';

async function testElasticsearchAISearch() {
    const aiSearchAgent = new AISearchAgent({
        enableSummarization: true,
        enableQueryEnhancement: true
    });

    try {
        console.log('Initializing AI Search Agent with Elasticsearch...');
        await aiSearchAgent.initialize();

        console.log('\nTesting search functionality...');
        const searchQuery = 'wordpress';
        const results = await aiSearchAgent.search(searchQuery, {
            limit: 5
        });

        console.log('\n=== SEARCH RESULTS ===');
        console.log(`Query: "${searchQuery}"`);
        console.log(`Total tables found: ${results.total_tables}`);
        
        if (results.tables && results.tables.posts) {
            console.log(`\nPosts found: ${results.tables.posts.count}`);
            results.tables.posts.results.forEach((result, index) => {
                console.log(`\n${index + 1}. Score: ${result.score}`);
                console.log(`   ID: ${result.id}`);
                console.log(`   Title: ${result.data.title || 'No title'}`);
                if (result.summary) {
                    console.log(`   Summary: ${result.summary}`);
                }
            });
        }

        console.log('\nTesting stats...');
        const stats = await aiSearchAgent.getStats();
        console.log('Stats:', stats);

    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        await aiSearchAgent.cleanup();
        console.log('\nTest completed!');
    }
}

testElasticsearchAISearch().catch(console.error);
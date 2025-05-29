import AISearchAgent from './ai-search-agent.js';
import readline from 'readline';

async function main() {
    try {
        const agent = new AISearchAgent({
            autoIndex: true,
            maxIndexSize: 100,
            similarityThreshold: 0.6,
            enableSummarization: true,
            enableQueryEnhancement: true
        });

        console.log('Starting WordPress AI Search Agent...');
        
        await agent.initialize();
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const askQuestion = (question) => {
            return new Promise((resolve) => {
                rl.question(question, resolve);
            });
        };

        console.log('\nAI Search Agent is ready!');
        console.log('Enter your search queries (type "exit" to quit):');

        while (true) {
            const query = await askQuestion('\nSearch: ');
            
            if (query.toLowerCase() === 'exit') {
                break;
            }
            
            if (!query.trim()) {
                console.log('Please enter a search query.');
                continue;
            }

            console.log(`\n${'='.repeat(50)}`);
            console.log(`Search Query: "${query}"`);
            console.log(`${'='.repeat(50)}`);
            
            try {
                const results = await agent.search(query, { limit: 3 });
                
                if (results.totalResults > 0) {
                    results.results.forEach((result, index) => {
                        console.log(`\n${index + 1}. ${result.title}`);
                        console.log(`   ID: ${result.id} | Type: ${result.type} | Date: ${result.date}`);
                        console.log(`   Combined Score: ${result.scores.combined}`);
                        console.log(`   Keyword Score: ${result.scores.keyword}`);
                        console.log(`   Semantic Score: ${result.scores.semantic}`);
                        console.log(`   Summary: ${result.summary}`);
                        console.log(`   URL: ${result.url}`);
                    });
                } else {
                    console.log('No results found.');
                }
            } catch (error) {
                console.error(`Search failed for "${query}":`, error.message);
            }
        }

        rl.close();

        console.log('\n' + '='.repeat(50));
        console.log('Agent Statistics:');
        console.log('='.repeat(50));
        const stats = agent.getStats();
        console.log(JSON.stringify(stats, null, 2));

        await agent.cleanup();
        console.log('\nAgent cleaned up successfully');
        
    } catch (error) {
        console.error('Application failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default AISearchAgent;
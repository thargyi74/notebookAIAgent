import AISearchAgent from './ai-search-agent.js';
import BurmeseTextProcessor from './burmese-utils.js';

async function testBurmeseTextProcessor() {
    console.log('Testing Burmese Text Processor...\n');
    
    const processor = new BurmeseTextProcessor();
    
    const testTexts = [
        'မြန်မာနိုင်ငံ',
        'ရန်ကုန်မြို့',
        'မန္တလေးတိုင်း',
        'နေပြည်တော်'
    ];
    
    testTexts.forEach(text => {
        console.log(`Original: ${text}`);
        console.log(`Normalized: ${processor.normalizeText(text)}`);
        console.log(`Tokenized: ${processor.tokenize(text).join(' | ')}`);
        console.log(`Variants: ${processor.createSearchVariants(text).join(', ')}`);
        console.log('-'.repeat(40));
    });
}

async function testSearchFunctionality() {
    console.log('\nTesting Search Functionality...\n');
    
    try {
        const agent = new AISearchAgent({
            autoIndex: true,
            maxIndexSize: 50,
            similarityThreshold: 0.5
        });
        
        console.log('Initializing agent...');
        await agent.initialize();
        
        const testQueries = [
            'မြန်မာ',
            'technology',
            'ပညာရေး'
        ];
        
        for (const query of testQueries) {
            console.log(`\nTesting query: "${query}"`);
            try {
                const results = await agent.search(query, { limit: 2 });
                console.log(`Found ${results.totalResults} results`);
                
                if (results.totalResults > 0) {
                    results.results.forEach((result, index) => {
                        console.log(`  ${index + 1}. ${result.title} (Score: ${result.scores.combined})`);
                    });
                }
            } catch (error) {
                console.log(`  Error: ${error.message}`);
            }
        }
        
        console.log('\nTesting search suggestions...');
        try {
            const suggestions = await agent.suggestSearchTerms('မြန်', 3);
            console.log(`Suggestions for "မြန်": ${suggestions.join(', ')}`);
        } catch (error) {
            console.log(`Suggestion error: ${error.message}`);
        }
        
        console.log('\nAgent stats:');
        console.log(JSON.stringify(agent.getStats(), null, 2));
        
        await agent.cleanup();
        console.log('\nTest completed successfully');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

async function runTests() {
    console.log('WordPress AI Search Agent - Test Suite');
    console.log('=====================================\n');
    
    await testBurmeseTextProcessor();
    await testSearchFunctionality();
    
    console.log('\nAll tests completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}
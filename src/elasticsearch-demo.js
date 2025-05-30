#!/usr/bin/env node

import ElasticsearchSearchEngine from './elasticsearch-search.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class ElasticsearchDemo {
  constructor() {
    this.searchEngine = new ElasticsearchSearchEngine();
  }

  async initialize() {
    console.log('🚀 Initializing Elasticsearch Search Demo');
    console.log('==========================================\n');

    try {
      console.log('Setting up es_backup index and importing data...');
      const result = await this.searchEngine.initializeBackup();
      console.log(`✅ Initialization complete! Indexed ${result.totalIndexed} records.\n`);
      
      await this.showAvailableTables();
      await this.startInteractiveSearch();
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      console.log('\nPlease ensure:');
      console.log('1. Elasticsearch is running on the configured URL');
      console.log('2. WordPress database connection is properly configured');
      console.log('3. Environment variables are set correctly');
      process.exit(1);
    }
  }

  async showAvailableTables() {
    try {
      const tables = await this.searchEngine.getAvailableTables();
      console.log('📊 Available tables in es_backup:');
      tables.forEach(table => {
        console.log(`   - ${table.table}: ${table.count} documents`);
      });
      console.log('');
    } catch (error) {
      console.log('Could not retrieve table information:', error.message);
    }
  }

  async startInteractiveSearch() {
    console.log('🔍 Interactive Search Mode');
    console.log('Commands:');
    console.log('  - Type your search query to search all tables');
    console.log('  - "table:tablename query" to search specific table');
    console.log('  - "tables" to list available tables');
    console.log('  - "exit" to quit\n');

    this.promptForQuery();
  }

  promptForQuery() {
    rl.question('Enter search query: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('👋 Goodbye!');
        rl.close();
        return;
      }

      if (input.toLowerCase() === 'tables') {
        await this.showAvailableTables();
        this.promptForQuery();
        return;
      }

      if (input.trim() === '') {
        console.log('Please enter a search query.\n');
        this.promptForQuery();
        return;
      }

      await this.handleSearch(input);
      console.log('');
      this.promptForQuery();
    });
  }

  async handleSearch(input) {
    try {
      if (input.startsWith('table:')) {
        await this.handleTableSpecificSearch(input);
      } else {
        await this.handleGeneralSearch(input);
      }
    } catch (error) {
      console.error('❌ Search failed:', error.message);
    }
  }

  async handleTableSpecificSearch(input) {
    const parts = input.split(' ');
    const tableSpec = parts[0];
    const tableName = tableSpec.split(':')[1];
    const query = parts.slice(1).join(' ');

    if (!tableName || !query) {
      console.log('Usage: table:tablename your search query');
      return;
    }

    console.log(`\n🔍 Searching in table "${tableName}" for: "${query}"`);
    const results = await this.searchEngine.searchSpecificTable(query, tableName);
    this.displayTableResults(results);
  }

  async handleGeneralSearch(query) {
    console.log(`\n🔍 Searching all tables for: "${query}"`);
    const results = await this.searchEngine.search(query, { limit: 5 });
    this.searchEngine.displayResults(results);
  }

  displayTableResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS FROM TABLE: ${results.table.toUpperCase()}`);
    console.log(`Query: "${results.query}"`);
    console.log(`Total: ${results.total} results`);
    console.log('='.repeat(60));

    results.results.forEach((result, index) => {
      console.log(`\n${index + 1}. Score: ${result.score.toFixed(2)}`);
      console.log(`   ID: ${result.id}`);
      
      const data = result.data;
      if (data.title) console.log(`   Title: ${data.title}`);
      if (data.content) {
        const content = data.content.substring(0, 200);
        console.log(`   Content: ${content}${content.length === 200 ? '...' : ''}`);
      }
      if (data.meta_value) {
        const metaValue = data.meta_value.substring(0, 100);
        console.log(`   Meta: ${metaValue}${metaValue.length === 100 ? '...' : ''}`);
      }
      if (data.term_name) console.log(`   Term: ${data.term_name}`);
      if (data.option_value) {
        const optionValue = data.option_value.substring(0, 100);
        console.log(`   Option: ${optionValue}${optionValue.length === 100 ? '...' : ''}`);
      }
      
      if (Object.keys(result.highlights).length > 0) {
        console.log(`   Highlights: ${JSON.stringify(result.highlights)}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the demo
const demo = new ElasticsearchDemo();
demo.initialize().catch(error => {
  console.error('Demo failed to start:', error.message);
  process.exit(1);
});
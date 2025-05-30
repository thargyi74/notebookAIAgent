#!/usr/bin/env node

import ElasticsearchClient from './src/elasticsearch-client.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class OnlineElasticsearchTester {
  constructor() {
    this.client = null;
  }

  async initialize() {
    console.log('🔍 Online Elasticsearch Search Tester');
    console.log('=====================================\n');

    const host = await this.promptForHost();
    const port = await this.promptForPort();
    const protocol = await this.promptForProtocol();

    this.client = new ElasticsearchClient(host, port, protocol);

    console.log('\n🚀 Testing connection...');
    const isConnected = await this.client.checkConnection();

    if (!isConnected) {
      console.log('❌ Failed to connect to Elasticsearch server');
      console.log('Please check:');
      console.log('1. IP address and port are correct');
      console.log('2. Elasticsearch server is running');
      console.log('3. Network connectivity');
      console.log('4. Authentication credentials (if required)');
      process.exit(1);
    }

    await this.showServerInfo();
    await this.startSearchInterface();
  }

  promptForHost() {
    return new Promise((resolve) => {
      const defaultHost = process.env.ELASTICSEARCH_HOST || 'localhost';
      rl.question(`Enter Elasticsearch server IP/host (default: ${defaultHost}): `, (answer) => {
        resolve(answer.trim() || defaultHost);
      });
    });
  }

  promptForPort() {
    return new Promise((resolve) => {
      const defaultPort = process.env.ELASTICSEARCH_PORT || '9200';
      rl.question(`Enter Elasticsearch port (default: ${defaultPort}): `, (answer) => {
        const port = parseInt(answer.trim() || defaultPort);
        resolve(isNaN(port) ? 9200 : port);
      });
    });
  }

  promptForProtocol() {
    return new Promise((resolve) => {
      const defaultProtocol = process.env.ELASTICSEARCH_PROTOCOL || 'http';
      rl.question(`Enter protocol [http/https] (default: ${defaultProtocol}): `, (answer) => {
        const protocol = answer.trim().toLowerCase() || defaultProtocol;
        resolve(['http', 'https'].includes(protocol) ? protocol : 'http');
      });
    });
  }

  async showServerInfo() {
    try {
      console.log('\n📊 Server Information:');
      
      const health = await this.client.getClusterHealth();
      console.log(`   Cluster: ${health.cluster_name}`);
      console.log(`   Status: ${health.status}`);
      console.log(`   Nodes: ${health.number_of_nodes}`);
      
      try {
        const stats = await this.client.getIndexStats();
        const indexName = this.client.indexName;
        if (stats.indices && stats.indices[indexName]) {
          const indexInfo = stats.indices[indexName];
          console.log(`   Index: ${indexName}`);
          console.log(`   Documents: ${indexInfo.total.docs.count}`);
          console.log(`   Size: ${(indexInfo.total.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB`);
        } else {
          console.log(`   Index: ${indexName} (not found)`);
        }
      } catch (error) {
        console.log(`   Index: ${this.client.indexName} (checking failed)`);
      }

      const tables = await this.client.getAvailableTables();
      if (tables.length > 0) {
        console.log('\n📋 Available tables:');
        tables.forEach(table => {
          console.log(`   - ${table.table}: ${table.count} documents`);
        });
      }
    } catch (error) {
      console.log('   Could not retrieve server information:', error.message);
    }
  }

  async startSearchInterface() {
    console.log('\n🔍 Search Interface');
    console.log('Commands:');
    console.log('  - Type search query to search all tables');
    console.log('  - "table:tablename query" to search specific table');
    console.log('  - "info" to show server information again');
    console.log('  - "tables" to list available tables');
    console.log('  - "health" to check cluster health');
    console.log('  - "exit" to quit\n');

    this.promptForQuery();
  }

  promptForQuery() {
    rl.question('Enter command or search query: ', async (input) => {
      try {
        await this.handleInput(input.trim());
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
      
      console.log('');
      this.promptForQuery();
    });
  }

  async handleInput(input) {
    if (input.toLowerCase() === 'exit') {
      console.log('👋 Goodbye!');
      rl.close();
      return;
    }

    if (input.toLowerCase() === 'info') {
      await this.showServerInfo();
      return;
    }

    if (input.toLowerCase() === 'tables') {
      const tables = await this.client.getAvailableTables();
      if (tables.length > 0) {
        console.log('\n📋 Available tables:');
        tables.forEach(table => {
          console.log(`   - ${table.table}: ${table.count} documents`);
        });
      } else {
        console.log('No tables found in the index');
      }
      return;
    }

    if (input.toLowerCase() === 'health') {
      const health = await this.client.getClusterHealth();
      console.log('\n🏥 Cluster Health:');
      console.log(`   Status: ${health.status}`);
      console.log(`   Nodes: ${health.number_of_nodes}`);
      console.log(`   Active Shards: ${health.active_shards}`);
      console.log(`   Relocating Shards: ${health.relocating_shards}`);
      console.log(`   Initializing Shards: ${health.initializing_shards}`);
      console.log(`   Unassigned Shards: ${health.unassigned_shards}`);
      return;
    }

    if (input === '') {
      console.log('Please enter a command or search query.');
      return;
    }

    if (input.startsWith('table:')) {
      await this.handleTableSearch(input);
    } else {
      await this.handleGeneralSearch(input);
    }
  }

  async handleTableSearch(input) {
    const parts = input.split(' ');
    const tableSpec = parts[0];
    const tableName = tableSpec.split(':')[1];
    const query = parts.slice(1).join(' ');

    if (!tableName || !query) {
      console.log('Usage: table:tablename your search query');
      return;
    }

    console.log(`\n🔍 Searching in table "${tableName}" for: "${query}"`);
    const startTime = Date.now();
    
    const results = await this.client.searchByTable(query, tableName, { size: 10 });
    const duration = Date.now() - startTime;
    
    this.displayResults(results, query, tableName, duration);
  }

  async handleGeneralSearch(query) {
    console.log(`\n🔍 Searching all tables for: "${query}"`);
    const startTime = Date.now();
    
    const results = await this.client.searchFromBackup(query, { size: 10 });
    const duration = Date.now() - startTime;
    
    this.displayAllResults(results, query, duration);
  }

  displayResults(results, query, tableName, duration) {
    console.log('\n' + '='.repeat(70));
    console.log(`SEARCH RESULTS - TABLE: ${tableName.toUpperCase()}`);
    console.log(`Query: "${query}" | Found: ${results.total} | Time: ${duration}ms`);
    console.log('='.repeat(70));

    if (results.hits.length === 0) {
      console.log('No results found.');
      return;
    }

    results.hits.forEach((hit, index) => {
      console.log(`\n${index + 1}. Score: ${hit.score.toFixed(2)} | ID: ${hit.id}`);
      
      const data = hit.source;
      if (data.title) console.log(`   📰 Title: ${data.title}`);
      if (data.content) {
        const content = data.content.substring(0, 200);
        console.log(`   📝 Content: ${content}${content.length === 200 ? '...' : ''}`);
      }
      if (data.meta_value) {
        const metaValue = data.meta_value.substring(0, 100);
        console.log(`   🏷️  Meta: ${metaValue}${metaValue.length === 100 ? '...' : ''}`);
      }
      if (data.term_name) console.log(`   🔖 Term: ${data.term_name}`);
      if (data.option_value) {
        const optionValue = data.option_value.substring(0, 100);
        console.log(`   ⚙️  Option: ${optionValue}${optionValue.length === 100 ? '...' : ''}`);
      }
      
      if (Object.keys(hit.highlight).length > 0) {
        console.log(`   ✨ Highlights: ${JSON.stringify(hit.highlight, null, 2)}`);
      }
    });
    
    console.log('\n' + '='.repeat(70));
  }

  displayAllResults(results, query, duration) {
    console.log('\n' + '='.repeat(70));
    console.log(`SEARCH RESULTS - ALL TABLES`);
    console.log(`Query: "${query}" | Found: ${results.total} | Time: ${duration}ms`);
    console.log('='.repeat(70));

    if (results.hits.length === 0) {
      console.log('No results found.');
      return;
    }

    const groupedResults = {};
    results.hits.forEach(hit => {
      const table = hit.table;
      if (!groupedResults[table]) {
        groupedResults[table] = [];
      }
      groupedResults[table].push(hit);
    });

    for (const [tableName, hits] of Object.entries(groupedResults)) {
      console.log(`\n📊 TABLE: ${tableName.toUpperCase()} (${hits.length} results)`);
      console.log('-'.repeat(50));

      hits.forEach((hit, index) => {
        console.log(`\n  ${index + 1}. Score: ${hit.score.toFixed(2)} | ID: ${hit.id}`);
        
        const data = hit.source;
        if (data.title) console.log(`     📰 Title: ${data.title}`);
        if (data.content) {
          const content = data.content.substring(0, 150);
          console.log(`     📝 Content: ${content}${content.length === 150 ? '...' : ''}`);
        }
        if (data.meta_value) {
          const metaValue = data.meta_value.substring(0, 80);
          console.log(`     🏷️  Meta: ${metaValue}${metaValue.length === 80 ? '...' : ''}`);
        }
        if (data.term_name) console.log(`     🔖 Term: ${data.term_name}`);
        
        if (Object.keys(hit.highlight).length > 0) {
          console.log(`     ✨ Highlights: ${Object.keys(hit.highlight).join(', ')}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(70));
  }
}

const tester = new OnlineElasticsearchTester();
tester.initialize().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
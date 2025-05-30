import ElasticsearchClient from './elasticsearch-client.js';
import WordPressDatabase from './database.js';

class ElasticsearchSearchEngine {
  constructor() {
    this.esClient = new ElasticsearchClient();
    this.database = new WordPressDatabase();
  }

  async initializeBackup() {
    try {
      console.log('Checking Elasticsearch connection...');
      const isConnected = await this.esClient.checkConnection();
      if (!isConnected) {
        throw new Error('Elasticsearch is not accessible');
      }

      console.log('Creating backup index...');
      await this.esClient.createBackupIndex();

      console.log('Fetching data from WordPress database...');
      const allData = await this.database.getAllTablesData();

      console.log('Indexing data to Elasticsearch...');
      let totalIndexed = 0;

      for (const [tableName, tableData] of Object.entries(allData)) {
        console.log(`Indexing ${tableData.length} records from ${tableName}...`);
        
        for (const record of tableData) {
          try {
            const processedRecord = this.processRecord(record, tableName);
            await this.esClient.indexData(processedRecord);
            totalIndexed++;
          } catch (error) {
            console.error(`Failed to index record from ${tableName}:`, error.message);
          }
        }
      }

      console.log(`Successfully indexed ${totalIndexed} records to es_backup`);
      await this.database.disconnect();
      
      return { success: true, totalIndexed };
    } catch (error) {
      console.error('Backup initialization failed:', error.message);
      throw error;
    }
  }

  processRecord(record, tableName) {
    const processed = { ...record };

    switch (tableName) {
      case 'posts':
        processed.title = record.post_title || '';
        processed.content = record.post_content || '';
        processed.excerpt = record.post_excerpt || '';
        break;
      case 'postmeta':
        processed.meta_value = record.meta_value || '';
        break;
      case 'terms':
        processed.term_name = record.name || '';
        break;
      case 'term_taxonomy':
        processed.description = record.description || '';
        break;
      case 'options':
        processed.option_value = record.option_value || '';
        break;
    }

    return processed;
  }

  async search(query, options = {}) {
    try {
      const {
        tables = [],
        limit = 10,
        offset = 0,
        sortBy = '_score',
        sortOrder = 'desc'
      } = options;

      console.log(`Searching for: "${query}"`);

      const searchOptions = {
        size: limit,
        from: offset,
        sort: [{ [sortBy]: { order: sortOrder } }]
      };

      let results;
      if (tables.length > 0) {
        results = await this.esClient.searchMultipleTables(query, tables, searchOptions);
      } else {
        const searchResult = await this.esClient.searchFromBackup(query, searchOptions);
        results = this.groupResultsByTable(searchResult.hits);
      }

      return this.formatSearchResults(results, query);
    } catch (error) {
      console.error('Search failed:', error.message);
      throw error;
    }
  }

  groupResultsByTable(hits) {
    const grouped = {};
    hits.forEach(hit => {
      const table = hit.table;
      if (!grouped[table]) {
        grouped[table] = [];
      }
      grouped[table].push(hit);
    });
    return grouped;
  }

  formatSearchResults(results, query) {
    const formatted = {
      query,
      total_tables: Object.keys(results).length,
      tables: {}
    };

    for (const [tableName, hits] of Object.entries(results)) {
      formatted.tables[tableName] = {
        count: hits.length,
        results: hits.map(hit => ({
          id: hit.id,
          score: hit.score,
          data: hit.source,
          highlights: hit.highlight
        }))
      };
    }

    return formatted;
  }

  async getAvailableTables() {
    try {
      return await this.esClient.getAvailableTables();
    } catch (error) {
      console.error('Failed to get available tables:', error.message);
      return [];
    }
  }

  async searchSpecificTable(query, tableName, options = {}) {
    try {
      const searchOptions = {
        size: options.limit || 10,
        from: options.offset || 0
      };

      const results = await this.esClient.searchByTable(query, tableName, searchOptions);
      
      return {
        query,
        table: tableName,
        total: results.total,
        results: results.hits.map(hit => ({
          id: hit.id,
          score: hit.score,
          data: hit.source,
          highlights: hit.highlight
        }))
      };
    } catch (error) {
      console.error(`Search in table ${tableName} failed:`, error.message);
      throw error;
    }
  }

  displayResults(searchResults) {
    console.log('\n' + '='.repeat(80));
    console.log(`SEARCH RESULTS FOR: "${searchResults.query}"`);
    console.log('='.repeat(80));
    console.log(`Found results in ${searchResults.total_tables} table(s)\n`);

    for (const [tableName, tableResults] of Object.entries(searchResults.tables)) {
      console.log(`\n📊 TABLE: ${tableName.toUpperCase()}`);
      console.log(`📈 Count: ${tableResults.count} results`);
      console.log('-'.repeat(60));

      tableResults.results.forEach((result, index) => {
        console.log(`\n${index + 1}. Score: ${result.score.toFixed(2)}`);
        console.log(`   ID: ${result.id}`);
        
        if (result.data.title) console.log(`   Title: ${result.data.title}`);
        if (result.data.content) {
          const content = result.data.content.substring(0, 200);
          console.log(`   Content: ${content}${content.length === 200 ? '...' : ''}`);
        }
        if (result.data.meta_value) {
          const metaValue = result.data.meta_value.substring(0, 100);
          console.log(`   Meta: ${metaValue}${metaValue.length === 100 ? '...' : ''}`);
        }
        if (result.data.term_name) console.log(`   Term: ${result.data.term_name}`);
        
        if (Object.keys(result.highlights).length > 0) {
          console.log(`   Highlights: ${JSON.stringify(result.highlights)}`);
        }
      });
      
      console.log('\n' + '-'.repeat(60));
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

export default ElasticsearchSearchEngine;
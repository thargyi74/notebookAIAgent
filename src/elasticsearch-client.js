import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

class ElasticsearchClient {
  constructor(host = null, port = 80, protocol = 'http') {
    this.host = host || process.env.ELASTICSEARCH_HOST || 'localhost';
    this.port = port || process.env.ELASTICSEARCH_PORT || 9200;
    this.protocol = protocol || process.env.ELASTICSEARCH_PROTOCOL || 'http';
    this.indexName = process.env.ELASTICSEARCH_INDEX || process.env.ES_BACKUP_INDEX || 'es_backup';
    
    this.client = new Client({
      node: `${this.protocol}://${this.host}:${this.port}`,
      requestTimeout: 60000,
      pingTimeout: 3000,
      auth: this.getAuthConfig()
    });
  }

  getAuthConfig() {
    const username = process.env.ELASTICSEARCH_USERNAME;
    const password = process.env.ELASTICSEARCH_PASSWORD;
    
    if (username && password) {
      return { username, password };
    }
    return undefined;
  }

  async checkConnection() {
    try {
      console.log(`Connecting to Elasticsearch at ${this.protocol}://${this.host}:${this.port}`);
      const response = await this.client.ping();
      console.log('✅ Elasticsearch connection successful');
      return true;
    } catch (error) {
      console.error('❌ Elasticsearch connection failed:', error.message);
      return false;
    }
  }

  async createBackupIndex() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (indexExists) {
        console.log(`Index ${this.indexName} already exists`);
        return true;
      }

      await this.client.indices.create({
        index: this.indexName,
        body: {
          mappings: {
            properties: {
              table: { type: 'keyword' },
              id: { type: 'keyword' },
              title: { type: 'text', analyzer: 'standard' },
              content: { type: 'text', analyzer: 'standard' },
              excerpt: { type: 'text', analyzer: 'standard' },
              meta_value: { type: 'text', analyzer: 'standard' },
              term_name: { type: 'text', analyzer: 'standard' },
              description: { type: 'text', analyzer: 'standard' },
              option_value: { type: 'text', analyzer: 'standard' },
              created_at: { type: 'date' }
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                standard: {
                  type: 'standard'
                }
              }
            }
          }
        }
      });

      console.log(`✅ Created index: ${this.indexName}`);
      return true;
    } catch (error) {
      console.error('Failed to create index:', error.message);
      throw error;
    }
  }

  async indexData(data) {
    try {
      const document = {
        ...data,
        created_at: new Date().toISOString()
      };

      await this.client.index({
        index: this.indexName,
        id: `${data.table}_${data.id}`,
        body: document
      });

      return true;
    } catch (error) {
      console.error('Failed to index data:', error.message);
      throw error;
    }
  }

  async searchFromBackup(query, options = {}) {
    try {
      const searchParams = {
        index: this.indexName,
        body: {
          query: {
            multi_match: {
              query: query,
              fields: [
                'title^3',
                'content^2',
                'excerpt^2',
                'meta_value',
                'term_name^2',
                'description',
                'option_value'
              ],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          },
          highlight: {
            fields: {
              title: {},
              content: { fragment_size: 150, number_of_fragments: 3 },
              excerpt: {},
              meta_value: { fragment_size: 100, number_of_fragments: 2 },
              term_name: {},
              description: { fragment_size: 100, number_of_fragments: 2 },
              option_value: { fragment_size: 100, number_of_fragments: 2 }
            }
          },
          ...options
        }
      };

      const response = await this.client.search(searchParams);
      
      return {
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          table: hit._source.table,
          source: hit._source,
          highlight: hit.highlight || {}
        }))
      };
    } catch (error) {
      console.error('Search failed:', error.message);
      throw error;
    }
  }

  async searchMultipleTables(query, tables, options = {}) {
    try {
      const promises = tables.map(table => 
        this.searchByTable(query, table, options)
      );
      
      const results = await Promise.all(promises);
      const grouped = {};
      
      results.forEach((result, index) => {
        grouped[tables[index]] = result.hits;
      });
      
      return grouped;
    } catch (error) {
      console.error('Multi-table search failed:', error.message);
      throw error;
    }
  }

  async searchByTable(query, tableName, options = {}) {
    try {
      const searchParams = {
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  term: { table: tableName }
                },
                {
                  multi_match: {
                    query: query,
                    fields: [
                      'title^3',
                      'content^2',
                      'excerpt^2',
                      'meta_value',
                      'term_name^2',
                      'description',
                      'option_value'
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                  }
                }
              ]
            }
          },
          highlight: {
            fields: {
              title: {},
              content: { fragment_size: 150, number_of_fragments: 3 },
              excerpt: {},
              meta_value: { fragment_size: 100, number_of_fragments: 2 },
              term_name: {},
              description: { fragment_size: 100, number_of_fragments: 2 },
              option_value: { fragment_size: 100, number_of_fragments: 2 }
            }
          },
          ...options
        }
      };

      const response = await this.client.search(searchParams);
      
      return {
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          source: hit._source,
          highlight: hit.highlight || {}
        }))
      };
    } catch (error) {
      console.error(`Search in table ${tableName} failed:`, error.message);
      throw error;
    }
  }

  async getAvailableTables() {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          size: 0,
          aggs: {
            tables: {
              terms: {
                field: 'table',
                size: 100
              }
            }
          }
        }
      });

      return response.body.aggregations.tables.buckets.map(bucket => ({
        table: bucket.key,
        count: bucket.doc_count
      }));
    } catch (error) {
      console.error('Failed to get available tables:', error.message);
      throw error;
    }
  }

  async deleteIndex() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (indexExists) {
        await this.client.indices.delete({
          index: this.indexName
        });
        console.log(`✅ Deleted index: ${this.indexName}`);
        return true;
      } else {
        console.log(`Index ${this.indexName} does not exist`);
        return false;
      }
    } catch (error) {
      console.error('Failed to delete index:', error.message);
      throw error;
    }
  }

  async refresh() {
    try {
      await this.client.indices.refresh({
        index: this.indexName
      });
      return true;
    } catch (error) {
      console.error('Failed to refresh index:', error.message);
      throw error;
    }
  }

  async getClusterHealth() {
    try {
      const response = await this.client.cluster.health();
      return response.body;
    } catch (error) {
      console.error('Failed to get cluster health:', error.message);
      throw error;
    }
  }

  async getIndexStats() {
    try {
      const response = await this.client.indices.stats({
        index: this.indexName
      });
      return response.body;
    } catch (error) {
      console.error('Failed to get index stats:', error.message);
      throw error;
    }
  }
}

export default ElasticsearchClient;
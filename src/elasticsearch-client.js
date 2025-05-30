import { Client } from '@elastic/elasticsearch';
import 'dotenv/config';

class ElasticsearchClient {
  constructor() {
    const baseUrl = process.env.ELASTICSEARCH_URL || "http://localhost:9200";

    const config = {
      node: baseUrl,
    };

    // Only add auth if credentials are provided
    if (
      process.env.ELASTICSEARCH_USERNAME &&
      process.env.ELASTICSEARCH_PASSWORD
    ) {
      config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      };
    }

    this.client = new Client(config);
  }

  async searchFromBackup(query, options = {}) {
    const {
      size = 10,
      from = 0,
      fields = ["*"],
      filters = {},
      sort = [{ _score: { order: "desc" } }],
    } = options;

    try {
      const searchBody = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: [
                    "title^3",
                    "content^2",
                    "excerpt",
                    "meta_value",
                    "term_name",
                    "description",
                  ],
                  type: "best_fields",
                  operator: "or",
                },
              },
            ],
            filter: [],
          },
        },
        size,
        from,
        sort,
        _source: fields,
        highlight: {
          fields: {
            title: {},
            content: {},
            excerpt: {},
          },
          pre_tags: ["<mark>"],
          post_tags: ["</mark>"],
        },
      };

      // Add filters if provided
      Object.entries(filters).forEach(([field, value]) => {
        searchBody.query.bool.filter.push({
          term: { [field]: value },
        });
      });

      const response = await this.client.search({
        index: this.backupIndex,
        body: searchBody,
      });

      return {
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map((hit) => ({
          id: hit._id,
          source: hit._source,
          score: hit._score,
          highlight: hit.highlight || {},
          table: hit._source.source_table || "unknown",
        })),
      };
    } catch (error) {
      console.error("Elasticsearch search failed:", error.message);
      throw error;
    }
  }

  async searchByTable(query, tableName, options = {}) {
    const tableFilters = { source_table: tableName };
    return this.searchFromBackup(query, {
      ...options,
      filters: { ...options.filters, ...tableFilters },
    });
  }

  async getAvailableTables() {
    try {
      const response = await this.client.search({
        index: this.backupIndex,
        body: {
          size: 0,
          aggs: {
            tables: {
              terms: {
                field: "source_table.keyword",
                size: 100,
              },
            },
          },
        },
      });

      return response.body.aggregations.tables.buckets.map((bucket) => ({
        table: bucket.key,
        count: bucket.doc_count,
      }));
    } catch (error) {
      console.error("Failed to get available tables:", error.message);
      throw error;
    }
  }

  async searchMultipleTables(query, tableNames = [], options = {}) {
    const results = {};

    if (tableNames.length === 0) {
      // Search all tables
      const allResults = await this.searchFromBackup(query, options);

      // Group by table
      allResults.hits.forEach((hit) => {
        const table = hit.table;
        if (!results[table]) {
          results[table] = [];
        }
        results[table].push(hit);
      });
    } else {
      // Search specific tables
      for (const tableName of tableNames) {
        try {
          const tableResults = await this.searchByTable(
            query,
            tableName,
            options
          );
          results[tableName] = tableResults.hits;
        } catch (error) {
          console.error(`Search failed for table ${tableName}:`, error.message);
          results[tableName] = [];
        }
      }
    }

    return results;
  }

  async indexData(data, id = null) {
    try {
      const document = {
        ...data,
        indexed_at: new Date().toISOString(),
      };

      const indexParams = {
        index: this.backupIndex,
        body: document,
      };

      if (id) {
        indexParams.id = id;
      }

      const response = await this.client.index(indexParams);
      return response.body;
    } catch (error) {
      console.error("Failed to index data:", error.message);
      throw error;
    }
  }

  async checkConnection() {
    try {
      const response = await this.client.ping();
      return response.statusCode === 200;
    } catch (error) {
      console.error("Elasticsearch connection failed:", error.message);
      return false;
    }
  }

  async createBackupIndex() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.backupIndex,
      });

      if (!indexExists.body) {
        await this.client.indices.create({
          index: this.backupIndex,
          body: {
            mappings: {
              properties: {
                title: { type: "text", analyzer: "standard" },
                content: { type: "text", analyzer: "standard" },
                excerpt: { type: "text", analyzer: "standard" },
                meta_value: { type: "text", analyzer: "standard" },
                term_name: { type: "text", analyzer: "standard" },
                description: { type: "text", analyzer: "standard" },
                source_table: { type: "keyword" },
                post_type: { type: "keyword" },
                post_status: { type: "keyword" },
                post_date: { type: "date" },
                indexed_at: { type: "date" },
              },
            },
          },
        });
        console.log(`Created index: ${this.backupIndex}`);
      }
    } catch (error) {
      console.error("Failed to create backup index:", error.message);
      throw error;
    }
  }
}

export default ElasticsearchClient;
import mysql from "mysql2/promise";
import "dotenv/config";

class WordPressDatabase {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: "utf8mb4",
    };
    this.connection = null;
    this.tablePrefix = process.env.TABLE_PREFIX || "dvp_";
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(this.config);
      console.log("Connected to WordPress database");
    } catch (error) {
      console.error("Database connection failed:", error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log("Disconnected from database");
    }
  }

  async getAllPosts(limit = 10) {
    if (!this.connection) {
      await this.connect();
    }

    // Convert limit to integer and validate
    const limitInt = Math.max(1, parseInt(limit, 10) || 10);

    // Use string interpolation for LIMIT since it can't be parameterized in all MySQL versions
    const query = `
      SELECT 
          ID,
          post_title,
          post_content,
          post_excerpt,
          post_date,
          post_status,
          post_type
      FROM ${this.tablePrefix}posts 
      WHERE 
          post_status = 'publish' 
          AND post_type IN ('post', 'page')
      ORDER BY post_date DESC
      LIMIT ${limitInt}
    `;

    try {
      const [rows] = await this.connection.execute(query);
      return rows;
    } catch (error) {
      console.error("Query failed:", error.message);
      throw error;
    }
  }

  async searchPosts(searchTerm, limit = 10) {
    if (!this.connection) {
      await this.connect();
    }

    // Convert limit to integer and validate
    const limitInt = Math.max(1, parseInt(limit, 10) || 10);
    const searchPattern = `%${searchTerm}%`;

    const query = `
      SELECT 
          ID,
          post_title,
          post_content,
          post_excerpt,
          post_date,
          post_status,
          post_type
      FROM ${this.tablePrefix}posts 
      WHERE 
          post_status = 'publish' 
          AND post_type IN ('post', 'page')
          AND (
              post_title LIKE ? 
              OR post_content LIKE ? 
              OR post_excerpt LIKE ?
          )
      ORDER BY post_date DESC
      LIMIT ${limitInt}
    `;

    try {
      const [rows] = await this.connection.execute(query, [
        searchPattern,
        searchPattern,
        searchPattern,
      ]);
      return rows;
    } catch (error) {
      console.error("Search query failed:", error.message);
      throw error;
    }
  }

  async checkTableExists() {
    if (!this.connection) {
      await this.connect();
    }

    try {
      const [rows] = await this.connection.execute(
        `SHOW TABLES LIKE '${this.tablePrefix}posts'`
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking table existence:", error.message);
      return false;
    }
  }
}

export default WordPressDatabase;

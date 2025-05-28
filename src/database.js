import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class WordPressDatabase {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            charset: 'utf8mb4'
        };
        this.connection = null;
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection(this.config);
            console.log('Connected to WordPress database');
        } catch (error) {
            console.error('Database connection failed:', error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            console.log('Disconnected from database');
        }
    }

    async searchPosts(searchTerm, limit = 10) {
        if (!this.connection) {
            await this.connect();
        }

        const query = `
            SELECT 
                ID,
                post_title,
                post_content,
                post_excerpt,
                post_date,
                post_status,
                post_type
            FROM wp_posts 
            WHERE 
                post_status = 'publish' 
                AND post_type IN ('post', 'page')
                AND (
                    post_title LIKE ? 
                    OR post_content LIKE ? 
                    OR post_excerpt LIKE ?
                )
            ORDER BY post_date DESC
            LIMIT ?
        `;

        const searchPattern = `%${searchTerm}%`;
        
        try {
            const [rows] = await this.connection.execute(query, [
                searchPattern, 
                searchPattern, 
                searchPattern, 
                limit
            ]);
            return rows;
        } catch (error) {
            console.error('Search query failed:', error.message);
            throw error;
        }
    }

    async getAllPosts(limit = 100) {
        if (!this.connection) {
            await this.connect();
        }

        const query = `
            SELECT 
                ID,
                post_title,
                post_content,
                post_excerpt,
                post_date,
                post_status,
                post_type
            FROM wp_posts 
            WHERE 
                post_status = 'publish' 
                AND post_type IN ('post', 'page')
                AND post_content != ''
            ORDER BY post_date DESC
            LIMIT ?
        `;

        try {
            const [rows] = await this.connection.execute(query, [limit]);
            return rows;
        } catch (error) {
            console.error('Failed to fetch posts:', error.message);
            throw error;
        }
    }

    async getPostById(postId) {
        if (!this.connection) {
            await this.connect();
        }

        const query = `
            SELECT 
                ID,
                post_title,
                post_content,
                post_excerpt,
                post_date,
                post_status,
                post_type
            FROM wp_posts 
            WHERE ID = ? AND post_status = 'publish'
        `;

        try {
            const [rows] = await this.connection.execute(query, [postId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Failed to fetch post by ID:', error.message);
            throw error;
        }
    }
}

export default WordPressDatabase;
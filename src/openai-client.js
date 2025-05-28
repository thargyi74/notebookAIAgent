import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class OpenAIClient {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateEmbedding(text) {
        try {
            const response = await this.client.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
                encoding_format: 'float'
            });
            
            return response.data[0].embedding;
        } catch (error) {
            console.error('OpenAI embedding generation failed:', error.message);
            throw error;
        }
    }

    async generateMultipleEmbeddings(texts) {
        try {
            const response = await this.client.embeddings.create({
                model: 'text-embedding-3-small',
                input: texts,
                encoding_format: 'float'
            });
            
            return response.data.map(item => item.embedding);
        } catch (error) {
            console.error('OpenAI multiple embeddings generation failed:', error.message);
            throw error;
        }
    }

    async enhanceSearchQuery(query, language = 'burmese') {
        try {
            const prompt = `Given the search query "${query}" in ${language}, expand it to include:
1. Synonyms and related terms
2. Alternative spellings or expressions
3. Contextually similar concepts

Return only the expanded search terms as a comma-separated list, including the original query.`;

            const response = await this.client.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant that specializes in ${language} language and understands search query expansion. Provide only the expanded terms without explanations.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.3
            });

            const expandedTerms = response.choices[0].message.content
                .split(',')
                .map(term => term.trim())
                .filter(term => term.length > 0);

            return expandedTerms;
        } catch (error) {
            console.error('OpenAI query enhancement failed:', error.message);
            return [query];
        }
    }

    async summarizeContent(content, maxLength = 150) {
        try {
            const prompt = `Summarize the following content in ${maxLength} characters or less, preserving the main ideas and important keywords:

${content}`;

            const response = await this.client.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that creates concise summaries while preserving key information and context.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: Math.ceil(maxLength / 2),
                temperature: 0.3
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('OpenAI summarization failed:', error.message);
            return content.substring(0, maxLength) + '...';
        }
    }

    calculateCosineSimilarity(vector1, vector2) {
        if (vector1.length !== vector2.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
            magnitude1 += vector1[i] * vector1[i];
            magnitude2 += vector2[i] * vector2[i];
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }

        return dotProduct / (magnitude1 * magnitude2);
    }

    async semanticSearch(queryEmbedding, contentEmbeddings, threshold = 0.7) {
        const similarities = contentEmbeddings.map((embedding, index) => ({
            index,
            similarity: this.calculateCosineSimilarity(queryEmbedding, embedding)
        }));

        return similarities
            .filter(item => item.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity);
    }
}

export default OpenAIClient;
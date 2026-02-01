import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHNSWIndex1769916300000 implements MigrationInterface {
    name = 'AddHNSWIndex1769916300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable vector extension if not exists
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        // Add HNSW Index
        // Note: vector_cosine_ops is standard for cosine similarity (used in embeddings usually)
        // If using L2 distance (Euclidean), use vector_l2_ops
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_question_embedding" 
            ON "question" 
            USING hnsw ("embedding" vector_cosine_ops) 
            WITH (m = 16, ef_construction = 64)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_question_embedding"`);
    }

}

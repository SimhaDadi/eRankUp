import { MigrationInterface, QueryRunner } from "typeorm";

export class InitExtensions1000000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Typically we don't drop extensions in down as they might be used elsewhere
    }
}

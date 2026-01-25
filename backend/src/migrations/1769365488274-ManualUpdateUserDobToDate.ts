import { MigrationInterface, QueryRunner } from "typeorm";

export class ManualUpdateUserDobToDate1769365488274 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change column type and handle existing data with casting
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "dob" TYPE date USING "dob"::date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "dob" TYPE timestamp USING "dob"::timestamp`);
    }

}

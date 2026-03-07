import { MigrationInterface, QueryRunner } from "typeorm";

export class FixChatConversationCascade1772430000005 implements MigrationInterface {
    name = 'FixChatConversationCascade1772430000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing foreign key that has NO ACTION
        await queryRunner.query(`ALTER TABLE "ai_chat_message" DROP CONSTRAINT "FK_977abe045d7c5a0d3db31a6f958"`);

        // Re-add with CASCADE
        await queryRunner.query(`ALTER TABLE "ai_chat_message" ADD CONSTRAINT "FK_977abe045d7c5a0d3db31a6f958" FOREIGN KEY ("conversationId") REFERENCES "ai_chat_conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_chat_message" DROP CONSTRAINT "FK_977abe045d7c5a0d3db31a6f958"`);
        await queryRunner.query(`ALTER TABLE "ai_chat_message" ADD CONSTRAINT "FK_977abe045d7c5a0d3db31a6f958" FOREIGN KEY ("conversationId") REFERENCES "ai_chat_conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

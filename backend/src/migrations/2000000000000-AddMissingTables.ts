import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingTables2000000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create news_items table
        await queryRunner.query(`
            CREATE TABLE "news_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "summary" text NOT NULL,
                "content" text NOT NULL,
                "category" character varying NOT NULL,
                "imageUrl" character varying,
                "source" character varying,
                "tags" text,
                "publishedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_news_items" PRIMARY KEY ("id")
            )
        `);

        // Create category table
        await queryRunner.query(`
            CREATE TABLE "category" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "isVisible" boolean NOT NULL DEFAULT true,
                "order" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_category" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_category_name" UNIQUE ("name"),
                CONSTRAINT "UQ_category_slug" UNIQUE ("slug")
            )
        `);

        // Create community_posts table
        await queryRunner.query(`
            CREATE TABLE "community_posts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content" text NOT NULL,
                "imageUrl" character varying,
                "category" character varying NOT NULL DEFAULT 'General',
                "userId" uuid NOT NULL,
                "likesCount" integer NOT NULL DEFAULT 0,
                "commentsCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_community_posts" PRIMARY KEY ("id"),
                CONSTRAINT "FK_community_posts_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Create community_comments table
        await queryRunner.query(`
            CREATE TABLE "community_comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content" text NOT NULL,
                "userId" uuid NOT NULL,
                "postId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_community_comments" PRIMARY KEY ("id"),
                CONSTRAINT "FK_community_comments_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_community_comments_post" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Create community_likes table
        await queryRunner.query(`
            CREATE TABLE "community_likes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "postId" uuid NOT NULL,
                CONSTRAINT "PK_community_likes" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_community_likes_user_post" UNIQUE ("userId", "postId"),
                CONSTRAINT "FK_community_likes_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_community_likes_post" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "community_likes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "community_comments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "community_posts"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "category"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "news_items"`);
    }
}

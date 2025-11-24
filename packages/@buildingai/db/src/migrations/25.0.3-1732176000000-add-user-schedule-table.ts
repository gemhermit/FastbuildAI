import { DataSource } from "typeorm";

/**
 * Migration: add-user-schedule-table
 * Version: 25.0.3
 * Created: 2024-11-21T00:00:00.000Z
 */

const TABLE_NAME = "user_schedule";
const FK_NAME = "fk_user_schedule_user";
const USER_INDEX = "idx_user_schedule_user";
const TIME_INDEX = "idx_user_schedule_time";
const CATEGORY_INDEX = "idx_user_schedule_category";

/**
 * Run migration
 */
export async function up(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "${TABLE_NAME}" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "title" varchar(255) NOT NULL,
            "description" text,
            "start_time" timestamptz NOT NULL,
            "end_time" timestamptz NOT NULL,
            "category" varchar(32) NOT NULL DEFAULT 'work',
            "priority" varchar(16) NOT NULL DEFAULT 'medium',
            "is_important" boolean NOT NULL DEFAULT false,
            "is_urgent" boolean NOT NULL DEFAULT false,
            "location" varchar(255),
            "attendees" varchar(512),
            "timezone" varchar(64),
            "metadata" jsonb,
            "created_at" timestamptz NOT NULL DEFAULT now(),
            "updated_at" timestamptz NOT NULL DEFAULT now(),
            "deleted_at" timestamptz
        );
    `);

    await dataSource.query(`COMMENT ON TABLE "${TABLE_NAME}" IS '用户个人日程';`);
    await dataSource.query(
        `COMMENT ON COLUMN "${TABLE_NAME}"."metadata" IS 'AI 解析的原始字段或额外属性';`,
    );

    await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "${USER_INDEX}"
        ON "${TABLE_NAME}" ("user_id");
    `);

    await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "${TIME_INDEX}"
        ON "${TABLE_NAME}" ("user_id", "start_time");
    `);

    await dataSource.query(`
        CREATE INDEX IF NOT EXISTS "${CATEGORY_INDEX}"
        ON "${TABLE_NAME}" ("user_id", "category");
    `);

    await dataSource.query(`
        ALTER TABLE "${TABLE_NAME}"
        ADD CONSTRAINT "${FK_NAME}"
        FOREIGN KEY ("user_id") REFERENCES "user"("id")
        ON DELETE CASCADE;
    `);
}

/**
 * Revert migration
 */
export async function down(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
        ALTER TABLE "${TABLE_NAME}"
        DROP CONSTRAINT IF EXISTS "${FK_NAME}";
    `);

    await dataSource.query(`DROP TABLE IF EXISTS "${TABLE_NAME}";`);
}

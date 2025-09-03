/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = async (pgm) => {
  await pgm.sql(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'wallets'
      ) THEN
        CREATE TABLE wallets (
          id SERIAL PRIMARY KEY,
          user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          balance_cents bigint NOT NULL DEFAULT 0,
          currency varchar(10) NOT NULL DEFAULT 'BRL',
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON wallets(user_id);
      END IF;
    END $$;
  `);
};

exports.down = async (pgm) => {
  pgm.dropTable("wallets");
};

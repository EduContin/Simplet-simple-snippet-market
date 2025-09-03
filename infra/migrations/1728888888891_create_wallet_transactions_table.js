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
        SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions'
      ) THEN
        CREATE TABLE wallet_transactions (
          id SERIAL PRIMARY KEY,
          type varchar(20) NOT NULL,
          amount_cents bigint NOT NULL,
          currency varchar(10) NOT NULL DEFAULT 'BRL',
          status varchar(20) NOT NULL DEFAULT 'pending',
          from_user_id integer REFERENCES users(id) ON DELETE SET NULL,
          to_user_id integer REFERENCES users(id) ON DELETE SET NULL,
          external_ref varchar(255),
          metadata jsonb,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS wallet_transactions_from_to_idx ON wallet_transactions(from_user_id, to_user_id);
        CREATE INDEX IF NOT EXISTS wallet_transactions_status_idx ON wallet_transactions(status);
      END IF;
    END $$;
  `);
};

exports.down = async (pgm) => {
  pgm.dropTable("wallet_transactions");
};

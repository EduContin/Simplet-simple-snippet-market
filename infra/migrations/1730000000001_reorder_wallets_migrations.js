/**
 * This meta migration exists to satisfy ordering when older wallets migrations
 * appear to be before an already-run migration. It does nothing if the target tables exist.
 */

exports.up = async (pgm) => {
  // Ensure wallets exists
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

  // Ensure wallet_transactions exists
  await pgm.sql(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'wallet_transactions'
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

  // Ensure payment_methods exists
  await pgm.sql(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'payment_methods'
      ) THEN
        CREATE TABLE payment_methods (
          id SERIAL PRIMARY KEY,
          user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider varchar(40) NOT NULL DEFAULT 'custom',
          external_id varchar(255) NOT NULL,
          brand varchar(40),
          last4 varchar(4),
          exp_month integer,
          exp_year integer,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id);
        CREATE INDEX IF NOT EXISTS payment_methods_external_id_idx ON payment_methods(external_id);
      END IF;
    END $$;
  `);
};

exports.down = async (pgm) => {
  // No-op: we don't drop tables in the meta migration.
};

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
        SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods'
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
  pgm.dropTable("payment_methods");
};

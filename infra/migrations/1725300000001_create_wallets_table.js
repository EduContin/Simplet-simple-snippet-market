/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = async (pgm) => {
  pgm.createTable("wallets", {
    id: "id",
    user_id: { type: "integer", notNull: true, unique: true, references: "users", onDelete: "CASCADE" },
    balance_cents: { type: "bigint", notNull: true, default: 0 },
    currency: { type: "varchar(10)", notNull: true, default: "BRL" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });
  pgm.createIndex("wallets", ["user_id"]);
};

exports.down = async (pgm) => {
  pgm.dropTable("wallets");
};

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = async (pgm) => {
  pgm.createTable("wallet_transactions", {
    id: "id",
    type: { type: "varchar(20)", notNull: true }, // deposit, withdrawal, transfer
    amount_cents: { type: "bigint", notNull: true },
    currency: { type: "varchar(10)", notNull: true, default: "BRL" },
    status: { type: "varchar(20)", notNull: true, default: "pending" }, // pending, confirmed, failed
    from_user_id: { type: "integer", references: "users", onDelete: "SET NULL" },
    to_user_id: { type: "integer", references: "users", onDelete: "SET NULL" },
    external_ref: { type: "varchar(255)" }, // PSP or blockchain tx id
    metadata: { type: "jsonb" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });
  pgm.createIndex("wallet_transactions", ["from_user_id", "to_user_id"]);
  pgm.createIndex("wallet_transactions", ["status"]);
};

exports.down = async (pgm) => {
  pgm.dropTable("wallet_transactions");
};

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = async (pgm) => {
  pgm.createTable("payment_methods", {
    id: "id",
    user_id: { type: "integer", notNull: true, references: "users", onDelete: "CASCADE" },
    provider: { type: "varchar(40)", notNull: true, default: "custom" },
    external_id: { type: "varchar(255)", notNull: true }, // provider payment method id or token
    brand: { type: "varchar(40)" },
    last4: { type: "varchar(4)" },
    exp_month: { type: "integer" },
    exp_year: { type: "integer" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });
  pgm.createIndex("payment_methods", ["user_id"]);
  pgm.createIndex("payment_methods", ["external_id"]);
};

exports.down = async (pgm) => {
  pgm.dropTable("payment_methods");
};

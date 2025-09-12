// Adds denormalized revenue counters and backfills from existing data.
// - threads.revenue_cents: sum of snippet_purchases for that thread
// - users.earnings_cents: sum of snippet_purchases for threads owned by the user

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.shorthands = undefined;

exports.up = async (pgm) => {
  // Add columns if not exist
  pgm.sql(`ALTER TABLE threads ADD COLUMN IF NOT EXISTS revenue_cents bigint NOT NULL DEFAULT 0`);
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS earnings_cents bigint NOT NULL DEFAULT 0`);

  // Backfill threads revenue from snippet_purchases
  pgm.sql(`
    UPDATE threads t
    SET revenue_cents = COALESCE(sp.sum_cents, 0)
    FROM (
      SELECT thread_id, COALESCE(SUM(price_cents),0) AS sum_cents
      FROM snippet_purchases
      GROUP BY thread_id
    ) sp
    WHERE sp.thread_id = t.id;
  `);

  // Backfill users earnings from snippet_purchases x threads (seller is thread owner)
  pgm.sql(`
    UPDATE users u
    SET earnings_cents = COALESCE(s.sum_cents, 0)
    FROM (
      SELECT t.user_id AS seller_id, COALESCE(SUM(sp.price_cents),0) AS sum_cents
      FROM snippet_purchases sp
      JOIN threads t ON t.id = sp.thread_id
      GROUP BY t.user_id
    ) s
    WHERE s.seller_id = u.id;
  `);
};

exports.down = async (pgm) => {
  // Keep columns; only remove if explicitly desired
  // pgm.sql(`ALTER TABLE threads DROP COLUMN IF EXISTS revenue_cents`);
  // pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS earnings_cents`);
};

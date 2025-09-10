/* eslint-disable camelcase */
exports.shorthands = undefined;

// Records a purchase/ownership of a snippet (thread first post code) by a user.
// Unique per (buyer_user_id, thread_id).
// price_cents captured at purchase time for historical reference.

exports.up = (pgm) => {
  pgm.createTable('snippet_purchases', {
    id: 'id',
    buyer_user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    thread_id: { type: 'integer', notNull: true, references: 'threads', onDelete: 'CASCADE' },
    price_cents: { type: 'integer', notNull: true, default: 0 },
    currency: { type: 'text', notNull: true, default: 'USD' },
    purchased_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('snippet_purchases', ['buyer_user_id', 'thread_id'], { unique: true });
  pgm.createIndex('snippet_purchases', ['thread_id']);
  pgm.createIndex('snippet_purchases', ['buyer_user_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('snippet_purchases');
};

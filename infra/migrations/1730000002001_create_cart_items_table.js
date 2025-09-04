exports.up = (pgm) => {
  // Create table if it doesn't exist
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS "cart_items" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL REFERENCES "users" ON DELETE CASCADE,
      "thread_id" integer NOT NULL REFERENCES "threads" ON DELETE CASCADE,
      "price_cents" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp with time zone DEFAULT current_timestamp NOT NULL
    );
  `);

  // Add unique constraint if not exists
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'cart_items' AND c.conname = 'cart_items_user_thread_unique'
      ) THEN
        ALTER TABLE "cart_items"
        ADD CONSTRAINT "cart_items_user_thread_unique" UNIQUE ("user_id", "thread_id");
      END IF;
    END$$;
  `);
};

// eslint-disable-next-line no-unused-vars
exports.down = (pgm) => {
  pgm.dropTable("cart_items");
};

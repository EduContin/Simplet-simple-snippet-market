exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'banner_url'
      ) THEN
        ALTER TABLE users ADD COLUMN banner_url VARCHAR(255);
      END IF;
    END$$;
  `);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
exports.down = (pgm) => {
  // Safe to drop if exists
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'banner_url'
      ) THEN
        ALTER TABLE users DROP COLUMN banner_url;
      END IF;
    END$$;
  `);
};
exports.up = (pgm) => {
  // Add banner_url to users if not exists
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'banner_url'
      ) THEN
        ALTER TABLE users ADD COLUMN banner_url VARCHAR(255);
      END IF;
    END$$;
  `);
};

// eslint-disable-next-line no-unused-vars
exports.down = (pgm) => {
  // Safe down: drop column only if exists
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'banner_url'
      ) THEN
        ALTER TABLE users DROP COLUMN banner_url;
      END IF;
    END$$;
  `);
};

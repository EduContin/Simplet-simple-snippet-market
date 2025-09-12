exports.up = async (pgm) => {
  pgm.createTable('snippet_files', {
    id: 'id',
    thread_id: { type: 'integer', notNull: true, references: 'threads', onDelete: 'CASCADE' },
    filename: { type: 'varchar(255)', notNull: true },
    language: { type: 'varchar(64)', notNull: false },
    is_entry: { type: 'boolean', notNull: true, default: false },
    content: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('snippet_files', ['thread_id']);
  pgm.createIndex('snippet_files', ['thread_id', 'is_entry']);
};

exports.down = async (pgm) => {
  pgm.dropTable('snippet_files');
};

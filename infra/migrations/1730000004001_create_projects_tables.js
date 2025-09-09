/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('projects', {
    id: 'id',
    owner_user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    title: { type: 'text', notNull: true },
    summary: { type: 'text', notNull: true },
    description: { type: 'text', notNull: true },
    budget_cents: { type: 'integer', notNull: true, default: 0 },
    currency: { type: 'text', notNull: true, default: 'USD' },
    nda_required: { type: 'boolean', notNull: true, default: true },
    status: { type: 'text', notNull: true, default: 'open' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('projects', 'owner_user_id');
  pgm.createIndex('projects', ['status', 'created_at']);

  pgm.createTable('project_documents', {
    id: 'id',
    project_id: { type: 'integer', notNull: true, references: 'projects', onDelete: 'CASCADE' },
    filename: { type: 'text', notNull: true },
    url: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('project_documents', 'project_id');

  pgm.createTable('project_applications', {
    id: 'id',
    project_id: { type: 'integer', notNull: true, references: 'projects', onDelete: 'CASCADE' },
    applicant_user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    cover_letter: { type: 'text' },
    proposed_cents: { type: 'integer', notNull: true, default: 0 },
    nda_accepted: { type: 'boolean', notNull: true, default: false },
    nda_accepted_at: { type: 'timestamp' },
    contractor_terms_accepted: { type: 'boolean', notNull: true, default: false },
    terms_version: { type: 'text' },
    status: { type: 'text', notNull: true, default: 'applied' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('project_applications', ['project_id', 'applicant_user_id'], { unique: true });
  pgm.createIndex('project_applications', ['project_id', 'status']);
};

exports.down = (pgm) => {
  pgm.dropTable('project_applications');
  pgm.dropTable('project_documents');
  pgm.dropTable('projects');
};

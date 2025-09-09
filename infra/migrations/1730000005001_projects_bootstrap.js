/* eslint-disable camelcase */
// Idempotent bootstrap to ensure projects feature tables exist even if previous migrations were skipped.
// Creates projects, project_documents, and project_applications with latest columns.

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.shorthands = undefined;

exports.up = async (pgm) => {
  // Projects base table
  pgm.createTable(
    'projects',
    {
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
      // chosen_application_id will be added after creating applications table
      started_at: { type: 'timestamp' },
      completed_at: { type: 'timestamp' },
    },
    { ifNotExists: true }
  );
  pgm.createIndex('projects', 'owner_user_id', { ifNotExists: true });
  pgm.createIndex('projects', ['status', 'created_at'], { ifNotExists: true });

  // Project documents
  pgm.createTable(
    'project_documents',
    {
      id: 'id',
      project_id: { type: 'integer', notNull: true, references: 'projects', onDelete: 'CASCADE' },
      filename: { type: 'text', notNull: true },
      url: { type: 'text', notNull: true },
      storage_path: { type: 'text' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    },
    { ifNotExists: true }
  );
  pgm.createIndex('project_documents', 'project_id', { ifNotExists: true });

  // Applications
  pgm.createTable(
    'project_applications',
    {
      id: 'id',
      project_id: { type: 'integer', notNull: true, references: 'projects', onDelete: 'CASCADE' },
      applicant_user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
      cover_letter: { type: 'text' },
      proposed_cents: { type: 'integer', notNull: true, default: 0 },
      nda_accepted: { type: 'boolean', notNull: true, default: false },
      nda_accepted_at: { type: 'timestamp' },
      contractor_terms_accepted: { type: 'boolean', notNull: true, default: false },
      terms_version: { type: 'text' },
      accept_ip: { type: 'text' },
      accept_user_agent: { type: 'text' },
      status: { type: 'text', notNull: true, default: 'applied' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    },
    { ifNotExists: true }
  );
  pgm.createIndex('project_applications', ['project_id', 'applicant_user_id'], { ifNotExists: true, unique: true });
  pgm.createIndex('project_applications', ['project_id', 'status'], { ifNotExists: true });

  // Now add chosen_application_id referencing applications, if not already present
  pgm.addColumn('projects', { chosen_application_id: { type: 'integer', references: 'project_applications', onDelete: 'SET NULL' } }, { ifNotExists: true });
  pgm.createIndex('projects', 'chosen_application_id', { ifNotExists: true });
};

exports.down = async (pgm) => {
  // Non-destructive down: just drop added index/column if exist
  try { pgm.dropIndex('projects', 'chosen_application_id'); } catch {}
  try { pgm.dropColumn('projects', 'chosen_application_id'); } catch {}
  // Do not drop tables in down to avoid data loss.
};

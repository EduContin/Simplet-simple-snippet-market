/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('projects', {
    chosen_application_id: { type: 'integer', references: 'project_applications', onDelete: 'SET NULL' },
    started_at: { type: 'timestamp' },
    completed_at: { type: 'timestamp' },
  });
  pgm.createIndex('projects', 'chosen_application_id');
};

exports.down = (pgm) => {
  pgm.dropIndex('projects', 'chosen_application_id');
  pgm.dropColumns('projects', ['chosen_application_id', 'started_at', 'completed_at']);
};

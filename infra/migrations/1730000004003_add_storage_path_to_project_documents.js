/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('project_documents', {
    storage_path: { type: 'text' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('project_documents', 'storage_path');
};

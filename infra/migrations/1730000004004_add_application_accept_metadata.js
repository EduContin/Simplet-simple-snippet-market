/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('project_applications', {
    accept_ip: { type: 'text' },
    accept_user_agent: { type: 'text' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('project_applications', ['accept_ip', 'accept_user_agent']);
};

/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create projects table if missing
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      owner_user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
      title text NOT NULL,
      summary text NOT NULL,
      description text NOT NULL,
      budget_cents integer NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'USD',
      nda_required boolean NOT NULL DEFAULT true,
      status text NOT NULL DEFAULT 'open',
      created_at timestamp NOT NULL DEFAULT NOW(),
      updated_at timestamp NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql(`CREATE INDEX IF NOT EXISTS projects_owner_user_id_idx ON projects(owner_user_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS projects_status_created_at_idx ON projects(status, created_at);`);

  // Add columns if missing
  pgm.sql(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='chosen_application_id') THEN
      ALTER TABLE projects ADD COLUMN chosen_application_id integer REFERENCES project_applications ON DELETE SET NULL;
    END IF;
    EXCEPTION WHEN undefined_table THEN
      -- project_applications might not exist yet; ignore, will be added below
      NULL;
  END $$;`);
  pgm.sql(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='started_at') THEN
      ALTER TABLE projects ADD COLUMN started_at timestamp;
    END IF;
  END $$;`);
  pgm.sql(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='completed_at') THEN
      ALTER TABLE projects ADD COLUMN completed_at timestamp;
    END IF;
  END $$;`);

  // Create project_documents if missing
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS project_documents (
      id SERIAL PRIMARY KEY,
      project_id integer NOT NULL REFERENCES projects ON DELETE CASCADE,
      filename text NOT NULL,
      url text NOT NULL,
      storage_path text,
      created_at timestamp NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql(`CREATE INDEX IF NOT EXISTS project_documents_project_id_idx ON project_documents(project_id);`);

  // Create project_applications if missing
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS project_applications (
      id SERIAL PRIMARY KEY,
      project_id integer NOT NULL REFERENCES projects ON DELETE CASCADE,
      applicant_user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
      cover_letter text,
      proposed_cents integer NOT NULL DEFAULT 0,
      nda_accepted boolean NOT NULL DEFAULT false,
      nda_accepted_at timestamp,
      contractor_terms_accepted boolean NOT NULL DEFAULT false,
      terms_version text,
      accept_ip text,
      accept_user_agent text,
      status text NOT NULL DEFAULT 'applied',
      created_at timestamp NOT NULL DEFAULT NOW()
    );
  `);
  pgm.sql(`CREATE UNIQUE INDEX IF NOT EXISTS project_applications_unique_applicant ON project_applications(project_id, applicant_user_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS project_applications_status_idx ON project_applications(project_id, status);`);
};

exports.down = () => {};

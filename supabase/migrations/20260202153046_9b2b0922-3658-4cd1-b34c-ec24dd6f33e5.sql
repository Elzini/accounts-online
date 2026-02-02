-- Create sequence for project_number
CREATE SEQUENCE IF NOT EXISTS public.projects_project_number_seq;

-- Set default value
ALTER TABLE public.projects ALTER COLUMN project_number SET DEFAULT nextval('projects_project_number_seq'::regclass);

-- Set the sequence to start from max existing project_number + 1
SELECT setval('projects_project_number_seq', COALESCE((SELECT MAX(project_number) FROM projects), 0) + 1, false);
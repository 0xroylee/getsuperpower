ALTER TABLE board_projects ADD COLUMN IF NOT EXISTS pre_hook_script text;
ALTER TABLE board_projects ADD COLUMN IF NOT EXISTS after_hook_script text;

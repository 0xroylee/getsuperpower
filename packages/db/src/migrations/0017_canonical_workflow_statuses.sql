UPDATE board_tasks
SET status = CASE status
	WHEN 'planning' THEN 'plan'
	WHEN 'todo' THEN 'plan'
	WHEN 'implementing' THEN 'in_progress'
	WHEN 'pr_created' THEN 'in_review'
	WHEN 'reviewing' THEN 'in_review'
	WHEN 'testing' THEN 'in_review'
	WHEN 'blocked' THEN 'failed'
	WHEN 'cancelled' THEN 'canceled'
	ELSE status
END
WHERE status IN (
	'planning',
	'todo',
	'implementing',
	'pr_created',
	'reviewing',
	'testing',
	'blocked',
	'cancelled'
);

UPDATE task_execution_logs
SET status = 'failed'
WHERE status = 'blocked';

UPDATE task_execution_steps
SET status = 'failed'
WHERE status = 'blocked';

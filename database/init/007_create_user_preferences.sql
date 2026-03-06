-- UP
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    task_due_reminders BOOLEAN NOT NULL DEFAULT true,
    weekly_summary BOOLEAN NOT NULL DEFAULT false,
    default_task_view VARCHAR(20) NOT NULL DEFAULT 'board',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_preferences_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_default_task_view
        CHECK (default_task_view IN ('board', 'list'))
);

-- DOWN
-- DROP TABLE IF EXISTS user_preferences;

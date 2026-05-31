-- Add RLS policies for training_sessions
CREATE POLICY training_sessions_read_all ON training_sessions FOR SELECT USING (true);

CREATE POLICY training_sessions_insert_owner ON training_sessions FOR INSERT WITH CHECK (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);

CREATE POLICY training_sessions_delete_owner ON training_sessions FOR DELETE USING (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);

CREATE POLICY training_sessions_update_owner ON training_sessions FOR UPDATE USING (
  franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
);

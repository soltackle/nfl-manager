CREATE POLICY leagues_update_owner ON leagues FOR UPDATE USING (owner_user_id = auth.uid());  

-- Site-wide settings (maintenance mode toggle)
CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode boolean NOT NULL DEFAULT true,
  maintenance_message text DEFAULT 'Sitemiz şu anda tadilat çalışması nedeniyle geçici olarak kapalıdır.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (id, maintenance_mode)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings_admin_update"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;

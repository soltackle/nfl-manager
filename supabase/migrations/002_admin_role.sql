-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Set the user who requested this as admin (Mustafa is probably the first user or based on email)
-- Assuming we want to make all current users admins for testing purposes:
UPDATE users SET role = 'admin' WHERE username = 'mustafa' OR username = 'admin';

-- Alternatively, the user can manually run:
-- UPDATE users SET role = 'admin' WHERE email = 'YOUR_EMAIL';

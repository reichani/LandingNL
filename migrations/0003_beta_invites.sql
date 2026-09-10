-- Closed-beta invitations. An address listed here may sign in while SIGNUP_MODE is not "open".
-- Managed with D1 queries so invitations need no redeploy or Worker secret.
CREATE TABLE IF NOT EXISTS beta_invites (
  email TEXT PRIMARY KEY,
  invited_at TEXT NOT NULL,
  note TEXT
);

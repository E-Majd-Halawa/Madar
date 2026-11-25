-- Usernames are stored in lowercase so the case-sensitive unique index on
-- "username" is effectively case-insensitive. Normalize any legacy rows first.
UPDATE "users"
SET "username" = lower("username")
WHERE "username" <> lower("username");

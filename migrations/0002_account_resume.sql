ALTER TABLE users ADD COLUMN onboarding_completed_at TEXT;

UPDATE users
   SET onboarding_completed_at = COALESCE(
     (SELECT updated_at FROM user_state WHERE user_state.user_id = users.id),
     updated_at
   )
 WHERE onboarding_completed_at IS NULL
   AND EXISTS (
     SELECT 1
       FROM user_state
      WHERE user_state.user_id = users.id
        AND json_extract(payload_json, '$.age') IS NOT NULL
        AND json_extract(payload_json, '$.status') IS NOT NULL
        AND json_extract(payload_json, '$.city') IS NOT NULL
        AND json_extract(payload_json, '$.program') IS NOT NULL
        AND json_extract(payload_json, '$.housing') IS NOT NULL
   );

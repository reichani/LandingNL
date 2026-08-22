export async function upsertUser(env, identity) {
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE provider = ?1 AND provider_subject = ?2',
  ).bind(identity.provider, identity.subject).first('id');
  if (existing) {
    await env.DB.prepare(
      'UPDATE users SET email = ?1, email_verified = 1, display_name = ?2, updated_at = ?3 WHERE id = ?4',
    ).bind(identity.email, identity.name, new Date().toISOString(), existing).run();
    return existing;
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO users (id, provider, provider_subject, email, email_verified, display_name, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?6)`,
  ).bind(id, identity.provider, identity.subject, identity.email, identity.name, now).run();
  return id;
}

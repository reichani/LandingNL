import { json } from "../_lib/http.js";
import { writeCookie } from "../_lib/session.js";

export async function onRequestPost() {
  return json({ ok: true }, 200, {
    "set-cookie": writeCookie("landingnl_session", "", { maxAge: 0 }),
  });
}

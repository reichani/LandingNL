import Link from "next/link";

export function GoogleSignInButton() {
  return (
    <div className="stack" data-auth-flow="server-pkce-v2">
      <Link className="button-primary" href="/auth/google" prefetch={false}>
        Continue with Google →
      </Link>
    </div>
  );
}

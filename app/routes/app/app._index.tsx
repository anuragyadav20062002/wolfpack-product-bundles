import { json } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate } from "@remix-run/react";

// This route redirects /app → /app/dashboard using CLIENT-SIDE navigation.
//
// Why not a server-side redirect (throw redirect)?
// With unstable_newEmbeddedAuthStrategy, the parent layout (app.tsx) exchanges
// the one-shot id_token for an access token via authenticate.admin(). Remix runs
// layout and child loaders in parallel. A synchronous `throw redirect()` here
// short-circuits Promise.all before the parent's token exchange completes, so no
// session is stored. The subsequent request to /app/dashboard has no id_token,
// no Authorization header, and no session — causing a redirect to /auth/login.
//
// By returning from the loader and redirecting on the client, we ensure:
// 1. Parent's authenticate.admin() completes the token exchange
// 2. React renders → App Bridge initializes
// 3. Client-side navigation adds the Authorization header via App Bridge
// 4. Dashboard loader's authenticate.admin() finds the stored session
export function loader() {
  return json(null);
}

export default function AppIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/app/dashboard", { replace: true });
  }, [navigate]);

  return null;
}

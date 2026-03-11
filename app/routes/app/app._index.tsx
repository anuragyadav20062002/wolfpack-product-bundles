import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

// This route handles /app → renders briefly → navigates client-side to /app/dashboard.
//
// Auth strategy:
// - The layout (app.tsx) calls authenticate.admin() and handles token exchange
//   plus the exit-iframe bounce. By the time this component renders, auth is
//   complete and App Bridge is initialized.
// - This route must NOT call authenticate.admin() — Remix runs layout and child
//   loaders in parallel, and a second authenticate.admin() would race for the
//   same one-shot id_token, causing token exchange failures.
// - This route must NOT do a server-side redirect — the redirect would lose
//   auth context (no id_token, no Authorization header), causing "refused to
//   connect" at the target route.
// - Client-side navigation works because App Bridge's fetch interceptor adds
//   the Authorization header to Remix data requests automatically.
export const loader = async () => {
  return json(null);
};

export default function AppIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/app/onboarding", { replace: true });
  }, [navigate]);

  return null;
}

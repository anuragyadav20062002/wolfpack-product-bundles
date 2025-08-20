import { json } from "@remix-run/node";

export async function loader() {
  return json({ message: "Test route works!" });
}

export default function TestRoute() {
  return (
    <div>
      <h1>Test Route</h1>
      <p>If you can see this, the route system is working!</p>
    </div>
  );
}
import { flatRoutes } from "@remix-run/fs-routes";

export default Promise.all([
  flatRoutes({ rootDirectory: "routes/root" }),
  flatRoutes({ rootDirectory: "routes/api" }),
  flatRoutes({ rootDirectory: "routes/app" }),
  flatRoutes({ rootDirectory: "routes/auth" }),
  flatRoutes({ rootDirectory: "routes/assets" }),
]).then((results) => results.flat());

import fs from "node:fs";

function getExtensionProjects() {
  const projects = {};

  let extensions = [];
  try {
    extensions = fs.readdirSync("./extensions");
  } catch {
    return projects;
  }

  for (const entry of extensions) {
    const extensionPath = `./extensions/${entry}`;
    const schema = `${extensionPath}/schema.graphql`;

    if (!fs.existsSync(schema)) {
      continue;
    }

    projects[entry] = {
      schema,
      documents: [`${extensionPath}/**/*.graphql`],
    };
  }

  return projects;
}

const config = {
  projects: {
    default: {
      schema: "./app/types/admin-2025-07.schema.json",
      documents: ["./app/**/*.{js,ts,jsx,tsx}", "./app/.server/**/*.{js,ts,jsx,tsx}"],
    },
    ...getExtensionProjects(),
  },
};

export default config;

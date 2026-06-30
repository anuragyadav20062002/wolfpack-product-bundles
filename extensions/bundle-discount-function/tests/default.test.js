import path from "path";
import fs from "fs";
import { describe, beforeAll, test, expect } from "vitest";
import { loadSchema, loadInputQuery, loadFixture, validateTestAssets } from "@shopify/shopify-function-test-helpers";

describe("bundle discount function fixtures", () => {
  let schema;
  let functionDir;
  let schemaPath;
  let targeting;

  beforeAll(async () => {
    functionDir = path.dirname(__dirname);
    schemaPath = path.join(functionDir, "schema.graphql");
    targeting = {
      "cart.lines.discounts.generate.run": {
        inputQueryPath: path.join(functionDir, "src/cart_lines_discounts_generate_run.graphql"),
      },
    };
    schema = await loadSchema(schemaPath);
  });

  const fixturesDir = path.join(__dirname, "fixtures");
  const fixtureFiles = fs
    .readdirSync(fixturesDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(fixturesDir, file));

  fixtureFiles.forEach((fixtureFile) => {
    test(`runs ${path.relative(fixturesDir, fixtureFile)}`, async () => {
      const fixture = await loadFixture(fixtureFile);
      const targetInputQueryPath = targeting[fixture.target].inputQueryPath;
      const inputQueryAST = await loadInputQuery(targetInputQueryPath);

      const validationResult = await validateTestAssets({ schema, fixture, inputQueryAST });
      expect(validationResult.inputQuery.errors).toEqual([]);
      expect(validationResult.inputFixture.errors).toEqual([]);
      expect(validationResult.outputFixture.errors).toEqual([]);
    }, 10000);
  });
});

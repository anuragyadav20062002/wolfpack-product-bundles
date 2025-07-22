import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader() {
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const bundleName = formData.get("bundleName");
  const description = formData.get("description");

  if (typeof bundleName !== "string" || bundleName.length === 0) {
    // TODO: Handle error: bundle name is required
    return json({ error: "Bundle name is required" }, { status: 400 });
  }

  try {
    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        description: typeof description === "string" ? description : null,
        shopId: shop,
      },
    });

    // Redirect to the newly created bundle's builder page
    return redirect(`/app/bundles/${newBundle.id}/design`);
  } catch (error) {
    console.error("Error creating bundle:", error);
    // TODO: Handle database error more gracefully
    return json({ error: "Failed to create bundle" }, { status: 500 });
  }
}

export default function CreateBundlePage() {
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Page>
      <TitleBar title="Create Bundle" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <p>
                Give your bundle a name and description that helps identify its
                purpose.
              </p>
              <Form method="post">
                <FormLayout>
                  <TextField
                    label="Bundle name"
                    helpText=""
                    name="bundleName"
                    value={bundleName}
                    onChange={setBundleName}
                    autoComplete="off"
                  />
                  <TextField
                    label="Description"
                    helpText="Optional: Add more details about what this bundle offers"
                    name="description"
                    value={description}
                    onChange={setDescription}
                    multiline={4}
                    autoComplete="off"
                  />
                  <Button submit variant="primary">
                    Create bundle
                  </Button>
                </FormLayout>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <h2>What's next?</h2>
              <p>After creating your bundle, you'll be able to:</p>
              <ul>
                <li>Add product selection steps</li>
                <li>Configure quantity limits</li>
                <li>Choose product categories</li>
                <li>Set up pricing rules</li>
                <li>Preview and publish</li>
              </ul>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

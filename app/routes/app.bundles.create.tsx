import { useState } from "react";
import { Page, Layout, Card, FormLayout, TextField, Button, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json, type ActionFunctionArgs } from "@remix-run/node";
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

  if (typeof bundleName !== 'string' || bundleName.length === 0) {
    // TODO: Handle error: bundle name is required
    return json({ error: 'Bundle name is required' }, { status: 400 });
  }

  try {
    const newBundle = await db.bundle.create({
      data: {
        name: bundleName,
        description: typeof description === 'string' ? description : null,
        shopId: shop,
      },
    });

    // Redirect to the newly created bundle's builder page
    return json({ id: newBundle.id });

  } catch (error) {
    console.error("Error creating bundle:", error);
    // TODO: Handle database error more gracefully
    return json({ error: 'Failed to create bundle' }, { status: 500 });
  }
}

export default function CreateBundlePage() {
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreateBundle() {
    const formData = new FormData();
    formData.append("bundleName", bundleName);
    formData.append("description", description);

    try {
      // Post the data to the action function
      const response = await fetch("/app/bundles/create", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // If successful, redirect to the new bundle page
        const newBundle = await response.json(); // Assuming action returns bundle data or ID on success
        if (newBundle && newBundle.id) {
             window.location.href = `/app/bundles/${newBundle.id}`;
        } else {
            // Handle unexpected successful response format
            console.error("Unexpected response format after bundle creation:", newBundle);
            alert("Bundle created, but could not navigate. Check console.");
        }
      } else {
        // Handle server-side errors (e.g., validation from action function)
        const errorData = await response.json();
        console.error("Error creating bundle:", errorData);
        alert(`Failed to create bundle: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      // Handle network or client-side errors
      console.error("Network or unexpected error:", error);
      alert("An unexpected error occurred. Check console.");
    }
  }

  return (
    <Page>
      <TitleBar title="Create Bundle" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <p>Give your bundle a name and description that helps identify its purpose.</p>
              <FormLayout>
                <TextField
                  label="Bundle name"
                  helpText="A clear name helps customers understand what products they can combine"
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
                <Button
                  variant="primary"
                  onClick={handleCreateBundle}
                >
                  Create bundle
                </Button>
              </FormLayout>
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
import { Page, Layout, Card, FormLayout, TextField, Button, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json, type ActionFunctionArgs } from "@remix-run/node";

export async function loader() {
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const bundleName = formData.get("bundleName");
  const description = formData.get("description");

  // Here you would typically save the bundle to your database
  console.log("Creating bundle:", { bundleName, description });

  // TODO: Add actual bundle creation logic using Prisma

  return json({ success: true });
}

export default function CreateBundlePage() {

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
                  autoComplete="off"
                />
                <TextField
                  label="Description"
                  helpText="Optional: Add more details about what this bundle offers"
                  name="description"
                  multiline={4}
                  autoComplete="off"
                />
                <Button submit variant="primary">Create bundle</Button>
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
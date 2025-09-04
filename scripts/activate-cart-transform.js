#!/usr/bin/env node

// Script to activate cart transform function
// Run with: node scripts/activate-cart-transform.js

import dotenv from 'dotenv';
import { GraphQLClient } from 'graphql-request';

dotenv.config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP || 'wolfpack-store-test-1.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_APP_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ SHOPIFY_APP_ACCESS_TOKEN not found in environment variables');
  console.log('Set your access token in .env file or environment');
  process.exit(1);
}

const client = new GraphQLClient(`https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`, {
  headers: {
    'X-Shopify-Access-Token': ACCESS_TOKEN,
  },
});

// Step 1: Find cart transform function
const FIND_FUNCTIONS_QUERY = `
  query FindCartTransformFunction {
    shopifyFunctions(first: 25) {
      nodes {
        id
        title
        apiType
        app {
          title
        }
      }
    }
  }
`;

// Step 2: Create cartTransform object
const CREATE_CART_TRANSFORM_MUTATION = `
  mutation CreateCartTransform($functionId: String!) {
    cartTransformCreate(functionId: $functionId) {
      cartTransform {
        id
        functionId
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function activateCartTransform() {
  try {
    console.log('🔍 Finding cart transform function...');
    
    // Find the function
    const functionsData = await client.request(FIND_FUNCTIONS_QUERY);
    
    console.log('📋 Available functions:');
    functionsData.shopifyFunctions.nodes.forEach(func => {
      console.log(`  - ${func.title} (${func.apiType}) - ID: ${func.id}`);
    });
    
    // Find cart transform function
    const cartTransformFunction = functionsData.shopifyFunctions.nodes.find(
      func => func.apiType === 'cart_transform'
    );
    
    if (!cartTransformFunction) {
      console.error('❌ No cart transform function found!');
      console.log('Make sure your function is deployed with: shopify app deploy');
      process.exit(1);
    }
    
    console.log(`✅ Found cart transform function: ${cartTransformFunction.title}`);
    console.log(`📍 Function ID: ${cartTransformFunction.id}`);
    
    // Create cartTransform object
    console.log('🚀 Activating cart transform function...');
    
    const activationData = await client.request(CREATE_CART_TRANSFORM_MUTATION, {
      functionId: cartTransformFunction.id
    });
    
    if (activationData.cartTransformCreate.userErrors.length > 0) {
      console.error('❌ Failed to activate cart transform:');
      activationData.cartTransformCreate.userErrors.forEach(error => {
        console.error(`  - ${error.message}`);
      });
      process.exit(1);
    }
    
    console.log('🎉 Cart transform function activated successfully!');
    console.log(`📍 CartTransform ID: ${activationData.cartTransformCreate.cartTransform.id}`);
    console.log('✅ Your cart transform function is now active and ready to process carts');
    
  } catch (error) {
    console.error('❌ Error activating cart transform:', error.message);
    if (error.response?.errors) {
      console.error('GraphQL Errors:', error.response.errors);
    }
    process.exit(1);
  }
}

activateCartTransform();
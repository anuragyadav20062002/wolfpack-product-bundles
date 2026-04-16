use shopify_function::prelude::*;
use shopify_function::Result;
use crate::schema;

/// Cart transform entry point.
///
/// Dispatches to merge() or expand() based on whether cart lines belong
/// to a bundle group. Returns an empty operations list if no bundles are found.
///
/// # How to test (Commit 1 — stub)
/// Build with: `cargo build --target=wasm32-unknown-unknown --release`
/// Run locally: `shopify app function run`
/// Send any cart JSON — expect `{ "operations": [] }` back.
#[shopify_function]
fn run(input: schema::run::Input) -> Result<schema::FunctionRunResult> {
    // Stub: return empty operations until MERGE and EXPAND are implemented
    Ok(schema::FunctionRunResult {
        operations: vec![],
    })
}

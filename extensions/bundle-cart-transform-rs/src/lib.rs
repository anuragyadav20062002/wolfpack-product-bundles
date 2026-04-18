use shopify_function::prelude::*;

mod expand;
mod helpers;
mod merge;
mod pricing;
mod run;
mod types;

#[typegen("schema.graphql")]
pub mod schema {
    #[query("src/run.graphql")]
    pub mod run {}
}

// Re-export the inner function so integration tests can call run_function_with_input(cart_transform_run, json)
pub use run::cart_transform_run;

use shopify_function::prelude::*;
use std::process;

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

fn main() {
    log!("Please invoke a named export");
    process::abort();
}

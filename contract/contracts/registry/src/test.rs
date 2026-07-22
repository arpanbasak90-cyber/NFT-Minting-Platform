#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_initialize_registry() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(NFTRegistry, ());
    let client = NFTRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    assert_eq!(client.get_admin(), admin);
}

#[test]
fn test_list_collections_empty() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(NFTRegistry, ());
    let client = NFTRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let collections = client.list_collections();
    assert_eq!(collections.len(), 0);
}

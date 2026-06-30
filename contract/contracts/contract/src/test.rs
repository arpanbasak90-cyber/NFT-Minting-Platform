#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, BytesN};

#[test]
fn test_mint_nft() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(NFTContract, ());
    let client = NFTContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[1u8; 32]);

    client.mint(&owner, &1u64, &metadata);

    let nft = client.get_nft(&1u64);
    assert_eq!(nft.owner, owner);
    assert_eq!(nft.token_id, 1u64);
}

#[test]
fn test_transfer_nft() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(NFTContract, ());
    let client = NFTContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[2u8; 32]);

    client.mint(&owner, &2u64, &metadata);
    client.transfer(&owner, &new_owner, &2u64);

    let nft = client.get_nft(&2u64);
    assert_eq!(nft.owner, new_owner);
}

#[test]
#[should_panic(expected = "NFT already exists")]
fn test_mint_duplicate_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(NFTContract, ());
    let client = NFTContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[3u8; 32]);

    client.mint(&owner, &3u64, &metadata);
    client.mint(&owner, &3u64, &metadata);
}
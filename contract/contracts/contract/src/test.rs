#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, BytesN, String};

fn setup() -> (Env, NFTContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(NFTContract, ());
    let client = NFTContractClient::new(&env, &contract_id);
    (env, client)
}

// ── Test 1: Mint NFT successfully ────────────────────────────────────────────
#[test]
fn test_mint_nft() {
    let (env, client) = setup();
    let owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[1u8; 32]);
    let name = String::from_str(&env, "CryptoKitty #1");

    client.mint(&owner, &1u64, &metadata, &name);

    let nft = client.get_nft(&1u64);
    assert_eq!(nft.owner, owner);
    assert_eq!(nft.token_id, 1u64);
}

// ── Test 2: Transfer NFT to new owner ────────────────────────────────────────
#[test]
fn test_transfer_nft() {
    let (env, client) = setup();
    let owner = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[2u8; 32]);
    let name = String::from_str(&env, "CryptoKitty #2");

    client.mint(&owner, &2u64, &metadata, &name);
    client.transfer(&owner, &new_owner, &2u64);

    let nft = client.get_nft(&2u64);
    assert_eq!(nft.owner, new_owner);
}

// ── Test 3: Duplicate mint returns AlreadyExists error ───────────────────────
#[test]
fn test_mint_duplicate_fails() {
    let (env, client) = setup();
    let owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[3u8; 32]);
    let name = String::from_str(&env, "CryptoKitty #3");

    client.mint(&owner, &3u64, &metadata, &name);
    let result = client.try_mint(&owner, &3u64, &metadata, &name);
    assert!(result.is_err());
}

// ── Test 4: Burn NFT removes it from storage ─────────────────────────────────
#[test]
fn test_burn_nft() {
    let (env, client) = setup();
    let owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[4u8; 32]);
    let name = String::from_str(&env, "CryptoKitty #4");

    client.mint(&owner, &4u64, &metadata, &name);
    assert_eq!(client.total_supply(), 1u64);

    client.burn(&owner, &4u64);
    assert_eq!(client.total_supply(), 0u64);

    let result = client.try_get_nft(&4u64);
    assert!(result.is_err());
}

// ── Test 5: get_owner returns correct address ─────────────────────────────────
#[test]
fn test_get_owner() {
    let (env, client) = setup();
    let owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[5u8; 32]);
    let name = String::from_str(&env, "CryptoKitty #5");

    client.mint(&owner, &5u64, &metadata, &name);
    let fetched_owner = client.get_owner(&5u64);
    assert_eq!(fetched_owner, owner);
}

// ── Test 6: Total supply increments on mint ───────────────────────────────────
#[test]
fn test_total_supply() {
    let (env, client) = setup();
    let owner = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[6u8; 32]);

    assert_eq!(client.total_supply(), 0u64);

    client.mint(&owner, &10u64, &metadata, &String::from_str(&env, "NFT #10"));
    client.mint(&owner, &11u64, &metadata, &String::from_str(&env, "NFT #11"));
    client.mint(&owner, &12u64, &metadata, &String::from_str(&env, "NFT #12"));

    assert_eq!(client.total_supply(), 3u64);
}

// ── Test 7: Transfer by non-owner fails ───────────────────────────────────────
#[test]
fn test_transfer_not_owner_fails() {
    let (env, client) = setup();
    let owner = Address::generate(&env);
    let attacker = Address::generate(&env);
    let metadata = BytesN::from_array(&env, &[7u8; 32]);
    let name = String::from_str(&env, "CryptoKitty #7");

    client.mint(&owner, &7u64, &metadata, &name);
    let result = client.try_transfer(&attacker, &owner, &7u64);
    assert!(result.is_err());
}
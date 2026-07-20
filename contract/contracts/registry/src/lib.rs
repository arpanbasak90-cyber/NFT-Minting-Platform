//! NFT Registry Contract — Inter-Contract Communication Demo
//!
//! This contract acts as a central registry that:
//! 1. Tracks all deployed NFT collection contracts
//! 2. Calls into NFTContract to verify ownership (cross-contract call)
//! 3. Emits registry events for real-time indexing

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    Address, Env, Symbol, Vec, String,
};

// ─── Errors ──────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u32)]
pub enum RegistryError {
    CollectionAlreadyRegistered = 1,
    CollectionNotFound          = 2,
    Unauthorized                = 3,
}

// ─── Data Types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct Collection {
    pub contract_id: Address,
    pub name:        String,
    pub creator:     Address,
    pub total_minted: u64,
}

#[contracttype]
pub enum DataKey {
    Collection(Address),
    AllCollections,
    Admin,
}

// ─── NFTContract Interface (for cross-contract calls) ────────────────────────

mod nft_contract {
    use soroban_sdk::{contractclient, Address, Env};

    #[contractclient(name = "NFTContractClient")]
    pub trait NFTContractTrait {
        fn total_supply(env: Env) -> u64;
        fn get_owner(env: Env, token_id: u64) -> Result<Address, soroban_sdk::Error>;
    }
}

// ─── Registry Contract ───────────────────────────────────────────────────────

#[contract]
pub struct NFTRegistry;

#[contractimpl]
impl NFTRegistry {

    // ── Initialize registry with admin ───────────────────────────────────────
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(
            &DataKey::AllCollections,
            &Vec::<Address>::new(&env),
        );
    }

    // ── Register a new NFT collection contract ───────────────────────────────
    pub fn register_collection(
        env: Env,
        creator: Address,
        nft_contract_id: Address,
        name: String,
    ) -> Result<(), RegistryError> {
        creator.require_auth();

        if env.storage().persistent().has(&DataKey::Collection(nft_contract_id.clone())) {
            return Err(RegistryError::CollectionAlreadyRegistered);
        }

        // ── Cross-contract call: fetch total_supply from NFTContract ─────────
        let nft_client = nft_contract::NFTContractClient::new(&env, &nft_contract_id);
        let total_minted: u64 = nft_client.total_supply();

        let collection = Collection {
            contract_id: nft_contract_id.clone(),
            name: name.clone(),
            creator: creator.clone(),
            total_minted,
        };

        env.storage().persistent().set(
            &DataKey::Collection(nft_contract_id.clone()),
            &collection,
        );

        // Track in all collections list
        let mut all: Vec<Address> = env.storage().instance()
            .get(&DataKey::AllCollections)
            .unwrap_or(Vec::new(&env));
        all.push_back(nft_contract_id.clone());
        env.storage().instance().set(&DataKey::AllCollections, &all);

        // Emit registration event
        env.events().publish(
            (Symbol::new(&env, "register"), creator.clone()),
            (nft_contract_id, name),
        );

        Ok(())
    }

    // ── Get a collection's info ───────────────────────────────────────────────
    pub fn get_collection(
        env: Env,
        nft_contract_id: Address,
    ) -> Result<Collection, RegistryError> {
        env.storage().persistent()
            .get(&DataKey::Collection(nft_contract_id))
            .ok_or(RegistryError::CollectionNotFound)
    }

    // ── List all registered collections ──────────────────────────────────────
    pub fn list_collections(env: Env) -> Vec<Address> {
        env.storage().instance()
            .get(&DataKey::AllCollections)
            .unwrap_or(Vec::new(&env))
    }

    // ── Get admin address ─────────────────────────────────────────────────────
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance()
            .get(&DataKey::Admin)
            .expect("not initialized")
    }
}

mod test;

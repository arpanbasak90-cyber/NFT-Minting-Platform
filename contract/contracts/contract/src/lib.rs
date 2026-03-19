#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Map, Symbol, BytesN
};

#[contracttype]
#[derive(Clone)]
pub struct NFT {
    pub owner: Address,
    pub token_id: u64,
    pub metadata: BytesN<32>, // better than Symbol
}

#[contract]
pub struct NFTContract;

#[contractimpl]
impl NFTContract {

    // Mint NFT
    pub fn mint(env: Env, to: Address, token_id: u64, metadata: BytesN<32>) {
        // AUTH CHECK
        to.require_auth();

        let mut storage: Map<u64, NFT> =
            env.storage().instance().get(&Symbol::short("NFT"))
            .unwrap_or(Map::new(&env));

        if storage.contains_key(token_id) {
            panic!("NFT already exists");
        }

        let nft = NFT {
            owner: to.clone(),
            token_id,
            metadata,
        };

        storage.set(token_id, nft);

        env.storage().instance().set(&Symbol::short("NFT"), &storage);
    }

    // Transfer NFT
    pub fn transfer(env: Env, from: Address, to: Address, token_id: u64) {
        from.require_auth();

        let mut storage: Map<u64, NFT> =
            env.storage().instance().get(&Symbol::short("NFT"))
            .expect("No NFTs exist");

        let mut nft = storage.get(token_id).expect("NFT not found");

        if nft.owner != from {
            panic!("Not the owner");
        }

        nft.owner = to;
        storage.set(token_id, nft);

        env.storage().instance().set(&Symbol::short("NFT"), &storage);
    }

    // Get NFT
    pub fn get_nft(env: Env, token_id: u64) -> NFT {
        let storage: Map<u64, NFT> =
            env.storage().instance().get(&Symbol::short("NFT"))
            .expect("No NFTs exist");

        storage.get(token_id).expect("NFT not found")
    }
}
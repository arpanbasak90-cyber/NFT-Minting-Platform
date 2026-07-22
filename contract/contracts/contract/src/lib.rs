#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    Address, Env, Symbol, BytesN, String,
};

// ─── Error Types ────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq)]
#[repr(u32)]
pub enum NFTError {
    AlreadyExists   = 1,
    NotFound        = 2,
    NotOwner        = 3,
    NoStorage       = 4,
    Unauthorized    = 5,
}

// ─── Data Types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct NFT {
    pub owner:    Address,
    pub token_id: u64,
    pub metadata: BytesN<32>,
    pub name:     String,
}

#[contracttype]
pub enum DataKey {
    NFT(u64),
    TotalSupply,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct NFTContract;

#[contractimpl]
impl NFTContract {

    // ── Mint ─────────────────────────────────────────────────────────────────
    pub fn mint(
        env: Env,
        to: Address,
        token_id: u64,
        metadata: BytesN<32>,
        name: String,
    ) -> Result<(), NFTError> {
        to.require_auth();

        if env.storage().persistent().has(&DataKey::NFT(token_id)) {
            return Err(NFTError::AlreadyExists);
        }

        let nft = NFT {
            owner: to.clone(),
            token_id,
            metadata,
            name: name.clone(),
        };

        env.storage().persistent().set(&DataKey::NFT(token_id), &nft);

        // Update total supply
        let supply: u64 = env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0u64);
        env.storage().instance().set(&DataKey::TotalSupply, &(supply + 1));

        // Emit mint event
        env.events().publish(
            (Symbol::new(&env, "mint"), to.clone()),
            (token_id, name),
        );

        Ok(())
    }

    // ── Transfer ─────────────────────────────────────────────────────────────
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token_id: u64,
    ) -> Result<(), NFTError> {
        from.require_auth();

        let mut nft: NFT = env.storage().persistent()
            .get(&DataKey::NFT(token_id))
            .ok_or(NFTError::NotFound)?;

        if nft.owner != from {
            return Err(NFTError::NotOwner);
        }

        nft.owner = to.clone();
        env.storage().persistent().set(&DataKey::NFT(token_id), &nft);

        // Emit transfer event
        env.events().publish(
            (Symbol::new(&env, "transfer"), from.clone()),
            (to, token_id),
        );

        Ok(())
    }

    // ── Burn ──────────────────────────────────────────────────────────────────
    pub fn burn(
        env: Env,
        owner: Address,
        token_id: u64,
    ) -> Result<(), NFTError> {
        owner.require_auth();

        let nft: NFT = env.storage().persistent()
            .get(&DataKey::NFT(token_id))
            .ok_or(NFTError::NotFound)?;

        if nft.owner != owner {
            return Err(NFTError::NotOwner);
        }

        env.storage().persistent().remove(&DataKey::NFT(token_id));

        // Update total supply
        let supply: u64 = env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(1u64);
        env.storage().instance().set(&DataKey::TotalSupply, &(supply - 1));

        // Emit burn event
        env.events().publish(
            (Symbol::new(&env, "burn"), owner.clone()),
            (token_id,),
        );

        Ok(())
    }

    // ── Get NFT ──────────────────────────────────────────────────────────────
    pub fn get_nft(env: Env, token_id: u64) -> Result<NFT, NFTError> {
        env.storage().persistent()
            .get(&DataKey::NFT(token_id))
            .ok_or(NFTError::NotFound)
    }

    // ── Get Owner ────────────────────────────────────────────────────────────
    pub fn get_owner(env: Env, token_id: u64) -> Result<Address, NFTError> {
        let nft: NFT = env.storage().persistent()
            .get(&DataKey::NFT(token_id))
            .ok_or(NFTError::NotFound)?;
        Ok(nft.owner)
    }

    // ── Total Supply ─────────────────────────────────────────────────────────
    pub fn total_supply(env: Env) -> u64 {
        env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0u64)
    }
}

mod test;
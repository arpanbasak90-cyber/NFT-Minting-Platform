#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    Address, Env, Symbol, BytesN, String, Vec,
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
    EmptyBatch      = 6,
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
#[derive(Clone)]
pub struct BatchMintItem {
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

    // ── Batch Mint ───────────────────────────────────────────────────────────
    pub fn batch_mint(
        env: Env,
        to: Address,
        items: Vec<BatchMintItem>,
    ) -> Result<(), NFTError> {
        to.require_auth();

        if items.is_empty() {
            return Err(NFTError::EmptyBatch);
        }

        let mut supply: u64 = env.storage().instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0u64);

        for item in items.iter() {
            if env.storage().persistent().has(&DataKey::NFT(item.token_id)) {
                return Err(NFTError::AlreadyExists);
            }

            let nft = NFT {
                owner: to.clone(),
                token_id: item.token_id,
                metadata: item.metadata.clone(),
                name: item.name.clone(),
            };

            env.storage().persistent().set(&DataKey::NFT(item.token_id), &nft);
            supply += 1;

            env.events().publish(
                (Symbol::new(&env, "batch_mint"), to.clone()),
                (item.token_id, item.name),
            );
        }

        env.storage().instance().set(&DataKey::TotalSupply, &supply);
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

    // ── Batch Transfer ───────────────────────────────────────────────────────
    pub fn batch_transfer(
        env: Env,
        from: Address,
        to: Address,
        token_ids: Vec<u64>,
    ) -> Result<(), NFTError> {
        from.require_auth();

        if token_ids.is_empty() {
            return Err(NFTError::EmptyBatch);
        }

        for token_id in token_ids.iter() {
            let mut nft: NFT = env.storage().persistent()
                .get(&DataKey::NFT(token_id))
                .ok_or(NFTError::NotFound)?;

            if nft.owner != from {
                return Err(NFTError::NotOwner);
            }

            nft.owner = to.clone();
            env.storage().persistent().set(&DataKey::NFT(token_id), &nft);

            env.events().publish(
                (Symbol::new(&env, "batch_transfer"), from.clone()),
                (to.clone(), token_id),
            );
        }

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

#[cfg(test)]
mod test;
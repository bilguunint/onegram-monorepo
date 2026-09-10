"use strict";

// TEST-ONLY custodial wallets. Derives a deterministic wallet per userId from a
// single master mnemonic, so the same user always maps to the same on-chain
// address without storing per-user keys.
//
// ⚠️ Amoy/testing only. For mainnet, replace this with Cloud KMS or an MPC
//    provider (Fireblocks, Web3Auth) — NEVER derive real-value keys from a raw
//    mnemonic sitting in an env var.
//
// `ethers` is required lazily, so this module is only loaded in real
// (non-shadow) mode — shadow mode never touches it.
function userWallet(userId) {
  const ethers = require("ethers");
  const { getProvider } = require("./chainClient");
  const mnemonic = process.env.CUSTODY_TEST_MNEMONIC;
  if (!mnemonic) throw new Error("CUSTODY_TEST_MNEMONIC not set");
  // Hash userId into a valid (< 2^31) HD account index for a stable path.
  const index = Number(BigInt(ethers.id(userId)) % 2147483648n);
  const path = `m/44'/60'/0'/0/${index}`;
  return ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path).connect(
    getProvider()
  );
}

function userAddress(userId) {
  return userWallet(userId).address;
}

module.exports = { userWallet, userAddress };

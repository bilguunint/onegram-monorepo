"use strict";

// Thin wrapper the payment functions call to mirror balance changes on-chain.
//
// Shadow mode (DEFAULT ON): logs the intended on-chain op but does NOT
// broadcast — and requires no `ethers` dependency, no env, no keys. This lets
// you wire the calls into verifyOrder / verifyWithdraw / acceptGift and watch
// them in Cloud Functions logs with zero production impact.
//
// Real mode (CHAIN_SHADOW_MODE=false): lazily loads ethers + the backend signer
// and actually broadcasts to the configured network (Amoy testnet first).
//
// Callers should still wrap these in try/catch — a chain error must never break
// the Firestore flow that already succeeded.
const SHADOW = process.env.CHAIN_SHADOW_MODE !== "false";

// Minimal ABI — only what the backend calls.
const TOKEN_ABI = [
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
];

function getToken(signer) {
  const { getSigner, getEthers } = require("./chainClient");
  const { Contract } = getEthers();
  const address = process.env.ONEGRAM_TOKEN_ADDRESS;
  if (!address) throw new Error("ONEGRAM_TOKEN_ADDRESS not set");
  return new Contract(address, TOKEN_ABI, signer || getSigner());
}

function gramsToUnits(grams) {
  return require("./chainClient").getEthers().parseUnits(String(grams), 18);
}
function unitsToGrams(units) {
  return Number(require("./chainClient").getEthers().formatUnits(units, 18));
}

// Deposit settled (verifyOrder) -> mint grams to the user's custodial wallet.
async function recordMint(userId, grams, meta = {}) {
  if (SHADOW) {
    console.log("[chain:shadow] mint", { userId, grams, ...meta });
    return { shadow: true };
  }
  const { userAddress } = require("./walletService");
  const to = userAddress(userId);
  const tx = await getToken().mint(to, gramsToUnits(grams));
  const receipt = await tx.wait();
  console.log("[chain] mint", { userId, to, grams, hash: receipt.hash });
  return { hash: receipt.hash, to };
}

// Physical withdrawal (verifyWithdraw) -> burn grams from the user's wallet.
async function recordBurn(userId, grams, meta = {}) {
  if (SHADOW) {
    console.log("[chain:shadow] burn", { userId, grams, ...meta });
    return { shadow: true };
  }
  const { userAddress } = require("./walletService");
  const from = userAddress(userId);
  const tx = await getToken().burn(from, gramsToUnits(grams));
  const receipt = await tx.wait();
  console.log("[chain] burn", { userId, from, grams, hash: receipt.hash });
  return { hash: receipt.hash, from };
}

// Gift (acceptGift) -> transfer signed by the sender's custodial wallet.
async function recordTransfer(fromUserId, toUserId, grams, meta = {}) {
  if (SHADOW) {
    console.log("[chain:shadow] transfer", { fromUserId, toUserId, grams, ...meta });
    return { shadow: true };
  }
  const { userWallet, userAddress } = require("./walletService");
  const to = userAddress(toUserId);
  const tx = await getToken(userWallet(fromUserId)).transfer(to, gramsToUnits(grams));
  const receipt = await tx.wait();
  console.log("[chain] transfer", { fromUserId, toUserId, to, grams, hash: receipt.hash });
  return { hash: receipt.hash, to };
}

// Read-only — for reconciliation (Firestore balance vs on-chain).
async function balanceOfUser(userId) {
  const { userAddress } = require("./walletService");
  return unitsToGrams(await getToken().balanceOf(userAddress(userId)));
}

module.exports = { recordMint, recordBurn, recordTransfer, balanceOfUser };

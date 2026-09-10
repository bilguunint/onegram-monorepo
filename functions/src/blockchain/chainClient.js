"use strict";

// Lazy ethers provider + backend signer. `ethers` is required ONLY here and ONLY
// when actually broadcasting (non-shadow mode), so shadow-mode usage needs no
// `ethers` dependency installed and importing the adapter never affects deploy.
let _provider = null;
let _signer = null;

function getEthers() {
  return require("ethers"); // throws only if reached in real (non-shadow) mode
}

function getProvider() {
  if (_provider) return _provider;
  const { JsonRpcProvider } = getEthers();
  const url = process.env.AMOY_RPC_URL;
  if (!url) throw new Error("AMOY_RPC_URL not set");
  _provider = new JsonRpcProvider(url);
  return _provider;
}

// The backend wallet that holds MINTER/BURNER roles and pays gas.
function getSigner() {
  if (_signer) return _signer;
  const { Wallet } = getEthers();
  const pk = process.env.BACKEND_PRIVATE_KEY;
  if (!pk) throw new Error("BACKEND_PRIVATE_KEY not set");
  _signer = new Wallet(pk, getProvider());
  return _signer;
}

module.exports = { getProvider, getSigner, getEthers };

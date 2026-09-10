# OneGram (ONEGRAM) — gold-backed token

`ONEGRAM` is an asset-backed ERC-20 where **1 token = 1 gram of vaulted gold**.
This package holds the smart contract, tests, and deploy scripts. The backend
adapter that calls it lives in [`../functions/src/blockchain/`](../functions/src/blockchain/).

> **Status: testnet prototype.** Everything here targets **Polygon Amoy**
> testnet — no real money, gold, or QPay is involved. Mainnet requires the
> legal/regulatory step (VASP) first.

## How the token maps to the existing backend

| Backend function | Action | On-chain call |
|---|---|---|
| `verifyOrder` (QPay deposit) | credit gold | `mint(user, grams)` |
| `verifyWithdraw` (биетээр авах) | debit gold | `burn(user, grams)` |
| `acceptGift` (бэлэг) | move gold | `transfer(sender → receiver, grams)` |

Supply is controlled only by the backend (`MINTER_ROLE`/`BURNER_ROLE`), so
`totalSupply()` always equals vaulted grams — the proof-of-reserve invariant.

## Prerequisites

1. **Node 20+** (you have it).
2. **A testnet wallet.** Create one (e.g. MetaMask) and copy its private key.
3. **Free test-POL** from the faucet: https://faucet.polygon.technology (Amoy).
4. **An RPC URL** — free from https://alchemy.com or use the public default.

## Setup

```bash
cd blockchain
npm install
cp .env.example .env      # then fill in DEPLOYER_PRIVATE_KEY etc.
```

## 1. Compile & test (local, no network)

```bash
npm run compile
npm test
```

Tests cover mint, transfer (gift), burn (withdrawal), role-gating, and pause.

## 2. Deploy to Amoy testnet

```bash
npm run deploy:amoy
```

Copy the printed address into `.env` as `ONEGRAM_TOKEN_ADDRESS`, and also into
`functions/.env` (same var) so the backend adapter can find it.

## 3. Run the 1-user end-to-end flow

```bash
npm run test-flow:amoy
```

This mints 5g to a test user, gifts 1g to a second user, burns 2g, and prints
balances + `totalSupply` — the full deposit → gift → withdraw lifecycle on a
real testnet. View any address on the explorer:
`https://amoy.polygonscan.com/address/<address>`

## 4. Wire into Cloud Functions (shadow mode)

The adapter in [`../functions/src/blockchain/`](../functions/src/blockchain/)
defaults to **shadow mode** — it logs the intended `mint`/`burn`/`transfer` but
does **not** broadcast. In shadow mode it needs **no `ethers` dependency, no
env, no keys**, so production stays fully untouched.

**Already wired:** `verifyOrder` (deposit → `recordMint`, gold only). The call
is wrapped in try/catch after the Firestore + ledger writes, so a chain error
can never break the live flow. Example of the pattern:

```js
const chain = require("../blockchain/tokenService");
// ...after the gold balance + ledger are committed:
const r = await chain.recordMint(user_id, qty, { source: "verifyOrder", order_id });
```

To extend it: `recordBurn(userId, grams, meta)` in `verifyWithdraw`,
`recordTransfer(fromUserId, toUserId, grams, meta)` in `acceptGift`.

With `CHAIN_SHADOW_MODE` unset (or `true`) these only log. To actually broadcast
on testnet, set in `functions/.env`:

```
CHAIN_SHADOW_MODE=false
AMOY_RPC_URL=...
BACKEND_PRIVATE_KEY=0x...        # holds MINTER/BURNER roles, pays gas
ONEGRAM_TOKEN_ADDRESS=0x...      # from `npm run deploy:amoy`
CUSTODY_TEST_MNEMONIC=...        # derives per-user custodial wallets (testnet only)
```

and install ethers in functions: `cd ../functions && npm install ethers`.

## Files

```
contracts/OneGram.sol     ERC-20 + roles + pause (the token)
scripts/deploy.js         deploy to a network
scripts/grantMinter.js    grant MINTER/BURNER to a separate backend key
scripts/testFlow.js       1-user deposit → gift → withdraw demo
test/OneGram.test.js      unit tests
```

## ⚠️ Before mainnet

- Legal: clarify VASP / securities status with СЗХ.
- Key management: move off raw mnemonics to **Cloud KMS / MPC**.
- Proof-of-Reserve: publish vault audits; reconcile Firestore ↔ on-chain.

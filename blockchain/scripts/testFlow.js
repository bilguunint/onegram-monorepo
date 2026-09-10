const hre = require("hardhat");

// End-to-end 1-user flow against a deployed ONEGRAM token on testnet.
// Mirrors the real backend lifecycle:
//   verifyOrder    -> mint
//   acceptGift     -> transfer
//   verifyWithdraw -> burn
// Run: ONEGRAM_TOKEN_ADDRESS=0x... npm run test-flow:amoy
async function main() {
  const { ethers } = hre;
  const tokenAddress = process.env.ONEGRAM_TOKEN_ADDRESS;
  if (!tokenAddress) throw new Error("Set ONEGRAM_TOKEN_ADDRESS in .env");

  const [admin] = await ethers.getSigners();
  const token = await ethers.getContractAt("OneGram", tokenAddress);

  // Two simulated app users (fresh wallets for the demo).
  const alice = ethers.Wallet.createRandom().connect(ethers.provider);
  const bob = ethers.Wallet.createRandom().connect(ethers.provider);
  const g = (n) => ethers.parseUnits(String(n), 18);
  const show = async (label, addr) =>
    console.log(
      `   ${label}: ${ethers.formatUnits(await token.balanceOf(addr), 18)} ONEGRAM`
    );

  console.log("Token:", tokenAddress);
  console.log("Alice:", alice.address);
  console.log("Bob:  ", bob.address);

  // 1) Deposit settled via QPay -> mint 5g to Alice.
  console.log("\n1) mint 5g to Alice  (simulates verifyOrder)");
  await (await token.mint(alice.address, g(5))).wait();
  await show("Alice", alice.address);

  // 2) Gift 1g Alice -> Bob. Fund Alice with a little gas first (testnet POL).
  console.log("\n2) gift 1g Alice -> Bob  (simulates acceptGift)");
  await (await admin.sendTransaction({ to: alice.address, value: ethers.parseEther("0.02") })).wait();
  await (await token.connect(alice).transfer(bob.address, g(1))).wait();
  await show("Alice", alice.address);
  await show("Bob", bob.address);

  // 3) Physical withdrawal -> burn 2g from Alice.
  console.log("\n3) burn 2g from Alice  (simulates verifyWithdraw)");
  await (await token.burn(alice.address, g(2))).wait();
  await show("Alice", alice.address);

  // 4) Proof-of-reserve invariant: supply must equal vaulted grams.
  const supply = ethers.formatUnits(await token.totalSupply(), 18);
  console.log(`\n4) totalSupply = ${supply} ONEGRAM  (must equal vaulted grams)`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

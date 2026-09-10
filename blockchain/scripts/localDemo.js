const hre = require("hardhat");

// Full ONEGRAM lifecycle on Hardhat's built-in EVM node (auto-funded accounts,
// no faucet, no real network). Same EVM as Polygon — just no public explorer.
// Run: npx hardhat run scripts/localDemo.js
async function main() {
  const { ethers } = hre;
  const [admin, alice, bob] = await ethers.getSigners(); // pre-funded
  const g = (n) => ethers.parseUnits(String(n), 18);
  const fmt = (x) => ethers.formatUnits(x, 18);

  console.log("=== ONEGRAM local blockchain demo ===");
  console.log("Admin (backend):", admin.address);
  console.log("Alice (user A): ", alice.address);
  console.log("Bob   (user B): ", bob.address);

  // Deploy
  const OneGram = await ethers.getContractFactory("OneGram");
  const token = await OneGram.deploy(admin.address);
  await token.waitForDeployment();
  const addr = await token.getAddress();
  console.log(`\n📜 Contract deployed: ${addr}`);
  console.log(`   name=${await token.name()} symbol=${await token.symbol()}`);

  const show = async (label) => {
    console.log(
      `   ${label}  Alice=${fmt(await token.balanceOf(alice.address))}` +
        `  Bob=${fmt(await token.balanceOf(bob.address))}` +
        `  totalSupply=${fmt(await token.totalSupply())}`
    );
  };

  // 1) Deposit settled (verifyOrder) -> mint 5g to Alice
  let tx = await token.mint(alice.address, g(5));
  let r = await tx.wait();
  console.log(`\n1) mint 5g -> Alice   tx=${r.hash}  block=${r.blockNumber}`);
  await show("after mint:");

  // 2) Gift (acceptGift) -> Alice transfers 1g to Bob
  tx = await token.connect(alice).transfer(bob.address, g(1));
  r = await tx.wait();
  console.log(`\n2) gift 1g Alice->Bob  tx=${r.hash}  block=${r.blockNumber}`);
  await show("after gift:");

  // 3) Withdrawal (verifyWithdraw) -> burn 2g from Alice
  tx = await token.burn(alice.address, g(2));
  r = await tx.wait();
  console.log(`\n3) burn 2g <- Alice    tx=${r.hash}  block=${r.blockNumber}`);
  await show("after burn:");

  console.log(
    `\n✅ Proof-of-reserve: totalSupply = ${fmt(await token.totalSupply())} ONEGRAM`
  );
  console.log("   (each token is backed 1:1 by a vaulted gram)");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

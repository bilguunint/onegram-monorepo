const hre = require("hardhat");

// Grants MINTER + BURNER roles to the backend signer. Only needed if you
// deployed with a different admin than the backend address, or want a separate
// minter key. Run with the current admin/deployer key.
async function main() {
  const { ethers } = hre;
  const tokenAddress = process.env.ONEGRAM_TOKEN_ADDRESS;
  const backend = process.env.BACKEND_ADMIN_ADDRESS;
  if (!tokenAddress || !backend) {
    throw new Error("Set ONEGRAM_TOKEN_ADDRESS and BACKEND_ADMIN_ADDRESS in .env");
  }

  const token = await ethers.getContractAt("OneGram", tokenAddress);
  const MINTER_ROLE = await token.MINTER_ROLE();
  const BURNER_ROLE = await token.BURNER_ROLE();

  await (await token.grantRole(MINTER_ROLE, backend)).wait();
  await (await token.grantRole(BURNER_ROLE, backend)).wait();
  console.log(`✅ Granted MINTER + BURNER to ${backend}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

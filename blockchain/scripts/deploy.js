const hre = require("hardhat");

// Deploys the OneGram (ONEGRAM) token to the configured network.
// Admin/minter/burner/pauser roles all go to BACKEND_ADMIN_ADDRESS (the signer
// your Cloud Functions will use). Defaults to the deployer if unset.
async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const admin = process.env.BACKEND_ADMIN_ADDRESS || deployer.address;

  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("Admin (roles granted to):", admin);

  const OneGram = await ethers.getContractFactory("OneGram");
  const token = await OneGram.deploy(admin);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("\n✅ OneGram (ONEGRAM) deployed to:", address);
  console.log("   Add to functions/.env:  ONEGRAM_TOKEN_ADDRESS=" + address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

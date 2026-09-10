const { expect } = require("chai");
const { ethers } = require("hardhat");

const g = (n) => ethers.parseUnits(String(n), 18); // grams -> base units

describe("OneGram (ONEGRAM)", function () {
  let token, admin, alice, bob;

  beforeEach(async function () {
    [admin, alice, bob] = await ethers.getSigners();
    const OneGram = await ethers.getContractFactory("OneGram");
    token = await OneGram.deploy(admin.address);
    await token.waitForDeployment();
  });

  it("has correct metadata", async function () {
    expect(await token.name()).to.equal("OneGram Gold");
    expect(await token.symbol()).to.equal("ONEGRAM");
    expect(await token.decimals()).to.equal(18);
  });

  it("mints to a user (deposit settled)", async function () {
    await token.mint(alice.address, g(5));
    expect(await token.balanceOf(alice.address)).to.equal(g(5));
    expect(await token.totalSupply()).to.equal(g(5));
  });

  it("transfers between users (gift)", async function () {
    await token.mint(alice.address, g(5));
    await token.connect(alice).transfer(bob.address, g(1));
    expect(await token.balanceOf(alice.address)).to.equal(g(4));
    expect(await token.balanceOf(bob.address)).to.equal(g(1));
  });

  it("burns on withdrawal (supply shrinks)", async function () {
    await token.mint(alice.address, g(5));
    await token.burn(alice.address, g(2));
    expect(await token.balanceOf(alice.address)).to.equal(g(3));
    expect(await token.totalSupply()).to.equal(g(3));
  });

  it("blocks mint from a non-minter", async function () {
    await expect(
      token.connect(alice).mint(alice.address, g(1))
    ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
  });

  it("pause halts transfers", async function () {
    await token.mint(alice.address, g(5));
    await token.pause();
    await expect(
      token.connect(alice).transfer(bob.address, g(1))
    ).to.be.revertedWithCustomError(token, "EnforcedPause");
    await token.unpause();
    await token.connect(alice).transfer(bob.address, g(1));
    expect(await token.balanceOf(bob.address)).to.equal(g(1));
  });
});

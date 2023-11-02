import { ethers } from "hardhat";

async function main() {
  const signatures = await ethers.deployContract("Signatures");

  await signatures.waitForDeployment();

  console.log(`Signatures deployed to ${signatures.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

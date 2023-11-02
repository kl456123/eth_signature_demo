import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Signature Test", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const signatures = await (
      await ethers.getContractFactory("Signatures")
    ).deploy();
    await signatures.waitForDeployment();
    const wallet = await ethers.Wallet.createRandom();
    return { wallet, signatures };
  }

  describe("ethers signature utils test", function () {
    it("Should sign and verify correctly using eth_sign", async function () {
      const { wallet, signatures } = await loadFixture(deployFixture);
      const abicoder = ethers.AbiCoder.defaultAbiCoder();
      const rawUserOpHash = ethers.ZeroHash;
      const entryPoint = ethers.ZeroAddress;
      const { chainId } = await ethers.provider.getNetwork();
      const userOpHash = ethers.keccak256(
        abicoder.encode(
          ["bytes32", "address", "uint256"],
          [rawUserOpHash, entryPoint, chainId]
        )
      );
      // get userOp signature
      const userOpHashBytes = ethers.getBytes(userOpHash);
      const signature = await wallet.signMessage(userOpHashBytes);
      // verify signature
      const signerAddress = ethers.verifyMessage(userOpHashBytes, signature);
      expect(signerAddress).eq(wallet.address);

      // verify signature on chain
      await signatures.verify_signature(
        rawUserOpHash,
        entryPoint,
        signerAddress,
        signature
      );
    });

    it("Should sign and verify signature using eip712", async () => {
      const { wallet, signatures } = await loadFixture(deployFixture);
      const { chainId } = await ethers.provider.getNetwork();
      const verifyingContract = await signatures.getAddress();
      const types = {
        transferToken: [
          { name: "wallet", type: "address" },
          { name: "validUntil", type: "uint256" },
          { name: "token", type: "address" },
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "logdata", type: "bytes" },
        ],
      };
      const domain = {
        name: "Signatures",
        version: "1.0.0",
        chainId,
        verifyingContract,
      };
      const message = {
        types,
        domain,
        primaryType: "transferToken",
        value: {
          validUntil: 10,
          wallet: ethers.ZeroAddress,
          amount: 100,
          logdata: "0x",
          to: ethers.ZeroAddress,
          token: ethers.ZeroAddress,
        },
      };
      const signature = await wallet.signTypedData(
        message.domain,
        message.types,
        message.value
      );
      const signerAddress = ethers.verifyTypedData(
        message.domain,
        message.types,
        message.value,
        signature
      );
      expect(signerAddress).to.eq(wallet.address);
      await signatures.verify_signature_eip712(
        message.value,
        signerAddress,
        signature
      );
    });
  });
});

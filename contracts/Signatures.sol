// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Signatures is EIP712 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

          bytes32 public constant TRANSFER_TOKEN_TYPEHASH =
          keccak256(
              "transferToken(address wallet,uint256 validUntil,address token,address to,uint256 amount,bytes logdata)"
          );

          struct TransferToken{
            address wallet;
            uint256 validUntil;
            address token;
            address to;
            uint256 amount;
            bytes logdata;
          }

    constructor()EIP712("Signatures", "1.0.0"){
    }

    function verify_signature(bytes32 rawUserOpHash, address entryPoint, address signer, bytes memory signature) public {
        bytes32 userOpHash = keccak256(abi.encode(rawUserOpHash, entryPoint, block.chainid));
        bytes32 signedHash = userOpHash.toEthSignedMessageHash();
        require(signedHash.recover(signature)==signer, "invalid signature");
    }

    function verify_signature_eip712(TransferToken memory transferToken, address signer, bytes memory signature) public {
        bytes32 digest = _hashTypedDataV4(
              keccak256(abi.encode(
                  TRANSFER_TOKEN_TYPEHASH,
                  transferToken.wallet,
                transferToken.validUntil,
                transferToken.token,
                transferToken.to,
                transferToken.amount,
                keccak256(transferToken.logdata)))
          );
         require(digest.recover(signature)==signer,
              "invalid eip712 signature"
          );

    }
}

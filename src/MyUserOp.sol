// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.6.0
//
// Template: https://wizard.openzeppelin.com/embed?tab=Account
//  * Signature Validation
//    * Account Bound
//  * Multisig
pragma solidity ^0.8.27;

import {Account} from "@openzeppelin/contracts/account/Account.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {MultiSignerERC7913} from "@openzeppelin/contracts/utils/cryptography/signers/MultiSignerERC7913.sol";
import {ERC7739} from "@openzeppelin/contracts/utils/cryptography/signers/draft-ERC7739.sol";

contract MyUserOp is Account, EIP712, ERC7739, MultiSignerERC7913 {
    constructor(bytes[] memory signers, uint64 threshold)
        EIP712("MyUserOp", "1")
        MultiSignerERC7913(signers, threshold)
    {}

    function addSigners(bytes[] memory signers) public onlyEntryPointOrSelf {
        _addSigners(signers);
    }

    function removeSigners(bytes[] memory signers) public onlyEntryPointOrSelf {
        _removeSigners(signers);
    }

    function setThreshold(uint64 threshold) public onlyEntryPointOrSelf {
        _setThreshold(threshold);
    }
}

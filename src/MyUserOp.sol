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
import {ERC7821} from "@openzeppelin/contracts/account/extensions/draft-ERC7821.sol";
import {console} from "forge-std/console.sol";

contract MyUserOp is Account, EIP712, ERC7739, ERC7821, MultiSignerERC7913 {
    constructor(bytes[] memory signers, uint64 threshold)
        EIP712("MyUserOp", "1")
        MultiSignerERC7913(signers, threshold)
    {}

    function addSigners(bytes[] memory signers) public onlyEntryPointOrSelf {
        console.log("MyUserOp.addSigners");
        console.logBytes(signers[0]);
        _addSigners(signers);
    }

    function removeSigners(bytes[] memory signers) public onlyEntryPointOrSelf {
        _removeSigners(signers);
    }

    function setThreshold(uint64 threshold) public onlyEntryPointOrSelf {
        _setThreshold(threshold);
    }

    // https://docs.openzeppelin.com/contracts/5.x/multisig#multisignererc7913
    /// @dev Allows the entry point as an authorized executor.
    function _erc7821AuthorizedExecutor(address caller, bytes32 mode, bytes calldata executionData)
        internal
        view
        virtual
        override
        returns (bool)
    {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}

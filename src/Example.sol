// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {MyUserOp} from "./MyUserOp.sol";
import {PackedUserOperation, IEntryPoint} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";

contract Example {
    MyUserOp internal muo_;

    constructor(bytes[] memory signers, uint64 threshold) {
        muo_ = new MyUserOp(signers, threshold);
    }

    function addSigners(bytes[] memory adders, bytes[] memory signers, bytes[] memory signatures) public {
        _executeMultiSigUserOp(abi.encodeWithSelector(muo_.addSigners.selector, adders), signers, signatures);
    }

    function removeSigners(bytes[] memory removers, bytes[] memory signers, bytes[] memory signatures) public {
        _executeMultiSigUserOp(abi.encodeWithSelector(muo_.removeSigners.selector, removers), signers, signatures);
    }

    function setThreshold(uint64 threshold, bytes[] memory signers, bytes[] memory signatures) public {
        _executeMultiSigUserOp(abi.encodeWithSelector(muo_.setThreshold.selector, threshold), signers, signatures);
    }

    function _executeMultiSigUserOp(bytes memory callData, bytes[] memory signers, bytes[] memory signatures) internal {
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = PackedUserOperation({
            sender: address(muo_),
            nonce: muo_.getNonce(),
            initCode: bytes(""),
            callData: callData,
            accountGasLimits: bytes32(abi.encodePacked(uint128(150000), uint128(200000))),
            preVerificationGas: 100000,
            gasFees: bytes32(abi.encodePacked(uint128(1000000000), uint128(1000000000))),
            paymasterAndData: bytes(""),
            signature: abi.encode(signers, signatures)
        });

        IEntryPoint entryPoint = muo_.entryPoint();
        entryPoint.handleOps(ops, payable(address(this)));
    }
}

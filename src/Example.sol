// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {MyUserOp} from "./MyUserOp.sol";
import {PackedUserOperation, IEntryPoint} from "@openzeppelin/contracts/interfaces/draft-IERC4337.sol";
import {ERC4337Utils, IEntryPointExtra} from "@openzeppelin/contracts/account/utils/draft-ERC4337Utils.sol";
import {console} from "forge-std/console.sol";

contract Example {
    MyUserOp internal muo_;

    // ETH receivable for handleOps()
    // これがないとhandleOps()によるpayable(address(this))への送金が"AA91 failed send to beneficiary"によりrevertする
    receive() external payable virtual {}

    constructor(bytes[] memory signers, uint64 threshold) {
        muo_ = new MyUserOp(signers, threshold);
    }

    function getMyUserOpAddress() public view returns (address) {
        return address(muo_);
    }

    function getSigners(uint64 start, uint64 end) public view returns (bytes[] memory) {
        return muo_.getSigners(start, end);
    }

    function addSigners(bytes[] memory adders, bytes[] memory signers, bytes[] memory signatures) public {
        console.log("Example.addSigners");
        _executeMultiSigUserOp(abi.encodeWithSelector(muo_.addSigners.selector, adders), signers, signatures);
    }

    function removeSigners(bytes[] memory removers, bytes[] memory signers, bytes[] memory signatures) public {
        _executeMultiSigUserOp(abi.encodeWithSelector(muo_.removeSigners.selector, removers), signers, signatures);
    }

    function setThreshold(uint64 threshold, bytes[] memory signers, bytes[] memory signatures) public {
        _executeMultiSigUserOp(abi.encodeWithSelector(muo_.setThreshold.selector, threshold), signers, signatures);
    }

    function _executeMultiSigUserOp(bytes memory callData, bytes[] memory signers, bytes[] memory signatures) internal {
        IEntryPoint entryPoint = muo_.entryPoint();
        uint256 nonce = entryPoint.getNonce(address(muo_), uint192(0x123400000000000000000000000000000000000000000000));

        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = PackedUserOperation({
            sender: address(muo_),
            nonce: nonce,
            initCode: bytes(""),
            callData: callData,
            accountGasLimits: bytes32(abi.encodePacked(uint128(150_000), uint128(500_000))),
            preVerificationGas: 21_000,
            gasFees: bytes32(abi.encodePacked(uint128(2_000_000_000), uint128(30_000_000_000))),
            paymasterAndData: bytes(""),
            signature: abi.encode(signers, signatures)
        });

        // debug log
        bytes32 opHash = IEntryPointExtra(address(ERC4337Utils.ENTRYPOINT_V08)).getUserOpHash(ops[0]);
        console.log("opHash");
        console.logBytes32(opHash);

        entryPoint.handleOps(ops, payable(address(this)));
    }
}

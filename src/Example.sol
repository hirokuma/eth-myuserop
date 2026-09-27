// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {MyUserOp} from "./MyUserOp.sol";
import {PackedUserOperation, IEntryPoint} from "@openzeppelin/contracts/interfaces/IERC4337.sol";
import {ERC4337Utils, IEntryPointExtra} from "@openzeppelin/contracts/account/utils/ERC4337Utils.sol";
import {console} from "forge-std/console.sol";

contract Example {
    address constant ENTRYPOINT = address(ERC4337Utils.ENTRYPOINT_V09);
    uint192 constant NONCE_KEY = uint192(0x123400000000000000000000000000000000000000000000);

    // ETH receivable for handleOps()
    // これがないとhandleOps()によるpayable(address(this))への送金が"AA91 failed send to beneficiary"によりrevertする
    receive() external payable virtual {}

    function getSigners(MyUserOp muo) public view returns (bytes[] memory) {
        return muo.getSigners(0, type(uint64).max);
    }

    function addSigners(MyUserOp muo, bytes[] memory adders) public view returns (PackedUserOperation[] memory) {
        return _executeMultiSigUserOp(muo, abi.encodeWithSelector(muo.addSigners.selector, adders));
    }

    function removeSigners(MyUserOp muo, bytes[] memory removers, bytes[] memory signers, bytes[] memory signatures)
        public
        view
        returns (PackedUserOperation[] memory)
    {
        return _executeMultiSigUserOp(muo, abi.encodeWithSelector(muo.removeSigners.selector, removers));
    }

    function setThreshold(MyUserOp muo, uint64 threshold, bytes[] memory signers, bytes[] memory signatures)
        public
        view
        returns (PackedUserOperation[] memory)
    {
        return _executeMultiSigUserOp(muo, abi.encodeWithSelector(muo.setThreshold.selector, threshold));
    }

    function _executeMultiSigUserOp(MyUserOp muo, bytes memory callData) internal view returns (PackedUserOperation[] memory) {
        IEntryPoint entryPoint = muo.entryPoint();
        uint256 nonce = entryPoint.getNonce(address(muo), NONCE_KEY);

        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = PackedUserOperation({
            sender: address(muo),
            nonce: nonce,
            initCode: bytes(""),
            callData: callData,
            accountGasLimits: bytes32(abi.encodePacked(uint128(150_000), uint128(500_000))),
            preVerificationGas: 21_000,
            gasFees: bytes32(abi.encodePacked(uint128(2_000_000_000), uint128(30_000_000_000))),
            paymasterAndData: bytes(""),
            signature: ""
        });

        // // debug log
        // bytes32 opHash = IEntryPointExtra(ENTRYPOINT).getUserOpHash(ops[0]);
        // console.log("_executeMultiSigUserOp opHash");
        // console.logBytes32(opHash);

        return ops;
    }
}

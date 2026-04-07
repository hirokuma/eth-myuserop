// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MyUserOp} from "../src/MyUserOp.sol";

abstract contract HelperContract {
    address constant ALICE = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    address constant BOB = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address constant CAROL = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address constant DAVE = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
}

contract MyUserOpTest is Test, HelperContract {
    MyUserOp public op;

    function setUp() public {
        bytes[] memory signers = new bytes[](3);
        signers[0] = abi.encodePacked(ALICE);
        signers[1] = abi.encodePacked(BOB);
        signers[2] = abi.encodePacked(CAROL);
        op = new MyUserOp(signers, 2);
    }

    function test_Increment() public {
        bytes[] memory signers = new bytes[](1);
        signers[0] = abi.encodePacked(DAVE);
        vm.prank(address(op.entryPoint()));
        op.addSigners(signers);
        assertEq(op.getSignerCount(), 4);
    }
}

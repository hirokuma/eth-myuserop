// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {MyUserOp} from "../src/MyUserOp.sol";

contract DeployScript is Script {
    MyUserOp public muo;

    address constant ALICE = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    // address constant BOB = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    // address constant CAROL = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // anvil default accounts 0-2
        bytes[] memory signers = new bytes[](1);
        signers[0] = abi.encodePacked(ALICE);
        // signers[1] = abi.encodePacked(BOB);
        // signers[2] = abi.encodePacked(CAROL);
        muo = new MyUserOp(signers, 1);

        vm.stopBroadcast();
    }
}

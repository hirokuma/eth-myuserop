// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {PackedUserOperation, IAccount, IEntryPoint} from "@openzeppelin/contracts/interfaces/IERC4337.sol";
import {ERC4337Utils, IEntryPointExtra} from "@openzeppelin/contracts/account/utils/ERC4337Utils.sol";

import {Test} from "forge-std/Test.sol";
import {MyUserOp} from "../src/MyUserOp.sol";
import {Example} from "../src/Example.sol";
import {console} from "forge-std/console.sol";

abstract contract HelperContract is Test {
    address constant ALICE = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    address constant BOB = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address constant CAROL = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address constant DAVE = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);

    uint256 constant ALICE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant BOB_KEY = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 constant CAROL_KEY = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;

    IEntryPoint constant ENTRYPOINT = ERC4337Utils.ENTRYPOINT_V09;
    address constant ENTRYPOINT_ADDR = address(ENTRYPOINT);
    uint192 constant NONCE_KEY = uint192(0x123400000000000000000000000000000000000000000000);

    function sign(uint256 privateKey, bytes32 hash) public pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        return abi.encodePacked(r, s, v);
    }
}


// EntryPointはチェーン呼び出しになるためMockEntryPointが使われている
contract MockEntryPoint is IEntryPointExtra {
    mapping(address => uint256) private _nonces;

    function getNonce(address sender, uint192 key) external view returns (uint256) {
        require(key != 0, "invalid key");
        return _nonces[sender];
    }

    function balanceOf(address) external view returns (uint256) {
        return address(this).balance;
    }

    function depositTo(address) external payable {}

    function withdrawTo(address payable, uint256) external {}

    function addStake(uint32) external payable {}

    function unlockStake() external {}

    function withdrawStake(address payable) external {}

    function handleOps(PackedUserOperation[] calldata ops, address payable beneficiary) external {
        console.log("tx.origin");
        console.logAddress(tx.origin);
        console.log("msg.sender");
        console.logAddress(msg.sender);
        require(tx.origin == msg.sender && msg.sender.code.length == 0, "handleOps require error");

        for (uint256 i = 0; i < ops.length; i++) {
            PackedUserOperation calldata op = ops[i];
            require(op.nonce == _nonces[op.sender], "invalid nonce");
            bytes32 userOpHash = this.getUserOpHash(op);
            uint256 validationData = IAccount(op.sender).validateUserOp(op, userOpHash, 0);
            require(validationData == 0, "invalid user op");
            _nonces[op.sender]++;

            (bool success, bytes memory returndata) = op.sender.call(op.callData);
            require(success, string(returndata));
        }

        if (address(this).balance > 0 && beneficiary != address(0)) {
            beneficiary.transfer(address(this).balance);
        }
    }

    function handleAggregatedOps(IEntryPoint.UserOpsPerAggregator[] calldata, address payable) external pure {
        revert("unsupported");
    }

    function getUserOpHash(PackedUserOperation calldata userOp) external pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                userOp.sender,
                userOp.nonce,
                userOp.initCode,
                userOp.callData,
                userOp.accountGasLimits,
                userOp.preVerificationGas,
                userOp.gasFees,
                userOp.paymasterAndData
            )
        );
    }
}

contract ExampleTest is Test, HelperContract {
    Example public op;

    function setUp() public {
        bytes[] memory signers = new bytes[](3);
        signers[0] = abi.encodePacked(ALICE);
        signers[1] = abi.encodePacked(BOB);
        signers[2] = abi.encodePacked(CAROL);
        op = new Example(signers, 2);
        vm.etch(ENTRYPOINT_ADDR, type(MockEntryPoint).runtimeCode);
    }

    function test_getSigners() public {
        bytes[] memory currentSigners = op.getSigners();
        assertEq(currentSigners.length, 3);
        assertEq(currentSigners[0], abi.encodePacked(ALICE));
        assertEq(currentSigners[1], abi.encodePacked(BOB));
        assertEq(currentSigners[2], abi.encodePacked(CAROL));
    }

    function test_addSigners() public {
        bytes[] memory addingSigners = new bytes[](1);
        addingSigners[0] = abi.encodePacked(DAVE);
        bytes[] memory signers = new bytes[](2);
        signers[0] = abi.encodePacked(ALICE);
        signers[1] = abi.encodePacked(BOB);

        address muo = op.getMyUserOpAddress();
        PackedUserOperation[] memory ops = op.addSigners(addingSigners);
        bytes32 opHash = IEntryPointExtra(ENTRYPOINT_ADDR).getUserOpHash(ops[0]);
        bytes[] memory signatures = new bytes[](2);
        signatures[0] = sign(ALICE_KEY, opHash);
        signatures[1] = sign(BOB_KEY, opHash);
        ops[0].signature = abi.encode(signers, signatures);

        vm.prank(address(msg.sender));
        IEntryPoint(ENTRYPOINT_ADDR).handleOps(ops, payable(address(op)));

        bytes[] memory newSigners = op.getSigners();
        assertEq(newSigners.length, 4);
    }
}

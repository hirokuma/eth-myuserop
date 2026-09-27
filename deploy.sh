#!/bin/bash

pushd ./lib/account-abstraction
yarn install
yarn deploy --network localhost
popd
echo
echo "EntryPoint v0.9.0 deployed."
echo

URL="http://localhost:8545"
KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
forge script script/Deploy.s.sol --rpc-url $URL --broadcast --private-key $KEY
echo
echo "MyUserOp contracts deployed."
echo

# Deposit to EntryPoint
MyUserOP=$(cat broadcast/Deploy.s.sol/31337/run-latest.json | jq -r '.transactions[] | select(.contractName == "MyUserOp") | .contractAddress')
MyErc20=$(cat broadcast/Deploy.s.sol/31337/run-latest.json | jq -r '.transactions[] | select(.contractName == "MyErc20") | .contractAddress')
# ENTRYPOINT_V0_8_0="0x4337084d9e255ff0702461cf8895ce9e3b5ff108"
ENTRYPOINT_V0_9_0="0x433709009B8330FDa32311DF1C2AFA402eD8D009"
cast send $ENTRYPOINT_V0_9_0 "depositTo(address)" $MyUserOP --value 1ether --private-key $KEY --rpc-url $URL
cast send $MyUserOP --value 1ether --private-key $KEY --rpc-url $URL
cast send $MyErc20 "transfer(address,uint256)" $MyUserOP 1ether --private-key $KEY --rpc-url $URL

echo
echo "Deposit"
echo
echo "  EntryPoint ETH:"
cast balance $ENTRYPOINT_V0_9_0
echo "  MyUserOp ETH:"
cast balance $MyUserOP
echo "  MyUserOp ERC20"
cast call $MyErc20 "balanceOf(address)" $MyUserOP | cast to-dec

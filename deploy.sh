#!/bin/bash

pushd ./lib/account-abstraction
yarn install
yarn deploy --network localhost
popd

URL="http://localhost:8545"
KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
rm -f ./broadcast/Deploy.s.sol/31337/run-latest.json
forge script script/Deploy.s.sol --rpc-url $URL --broadcast --private-key $KEY

# Deposit to EntryPoint
MyUserOP=$(cat broadcast/Deploy.s.sol/31337/run-latest.json | jq -r .transactions[0].additionalContracts[0].address)
ENTRYPOINT_V0_8_0="0x4337084d9e255ff0702461cf8895ce9e3b5ff108"
# ENTRYPOINT_V0_9_0="0x433709009B8330FDa32311DF1C2AFA402eD8D009"
cast send $ENTRYPOINT_V0_8_0 "depositTo(address)" $MyUserOP --value 1ether --private-key $KEY

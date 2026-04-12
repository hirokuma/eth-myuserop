#!/bin/bash

pushd ./lib/account-abstraction
yarn install
yarn deploy --network localhost
popd

URL="http://localhost:8545"
KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
rm -f ./broadcast/Deploy.s.sol/31337/run-latest.json
forge script script/Deploy.s.sol --rpc-url $URL --broadcast --private-key $KEY

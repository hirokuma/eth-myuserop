# MyUserOp

マルチシグの書き方勉強中。

## Setup

```shell
$ git clone https://github.com/hirokuma/eth-myuserop.git
$ cd eth-myuserop
$ git submodule init
$ git submodule update
```

### Run anvil

```shell
$ cd docker
$ docker compose up
```

### Deploy EntryPoint v0.9

[GitHub repository](https://github.com/eth-infinitism/account-abstraction/tree/v0.9.0)

```shell
$ cd lib/account-abstraction
$ yarn install
$ yarn deploy --network localhost
```

### Deploy MyUserOp

* Anvil default account[0]
  * address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  * private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
* Anvil default account[1]
  * address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  * private key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

```shell
# Anvil default account 0 private key
$ URL="http://localhost:8545"
$ KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
$ forge script script/Deploy.s.sol --rpc-url $URL --broadcast --private-key $KEY
```

## Development

```shell
$ forge init my_userop
$ cd my_userop
$ forge install OpenZeppelin/openzeppelin-contracts@v5.6.1
$ forge install eth-infinitism/account-abstraction@v0.9.0
```

### TypeScript

```shell
$ node --version
v22.22.2
$ pnpm --version
10.33.0

$ mkdir viem
$ cd viem
$ pnpm add viem
$ pnpm add -D typescript tsx @types/node
$ npx tsc --version
Version 6.0.2
$ npx tsc --init
```

[OpenZeppelin Wizard](https://wizard.openzeppelin.com/embed?tab=Account)のAccountタブにして以下をチェックして作られたコードを貼り付け。

* Signature Validation
  * Account Bound
* Multisig

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

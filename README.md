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

### Deploy contracts

```shell
$ ./deploy.sh
```

### Run

```shell
$ cd viem
$ pnpm dev
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

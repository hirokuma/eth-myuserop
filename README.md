# MyUserOp

マルチシグの書き方勉強中。

## Setup

```shell
$ git clone https://github.com/hirokuma/eth-myuserop.git
$ cd eth-myuserop
$ git submodule update --init
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

EntryPoint v0.9.0ではrevertしてうまくいかなかったのでv0.8.0を使用した。

```shell
$ forge init my_userop
$ cd my_userop
$ forge install OpenZeppelin/openzeppelin-contracts@v5.5.0
$ forge install eth-infinitism/account-abstraction@v0.8.0
```

### TypeScript

```shell
$ node --version
v22.22.2
$ pnpm --version
11.1.3

$ mkdir viem
$ cd viem
$ pnpm add viem
$ pnpm add -D typescript tsx @types/node
$ npx tsc --version
Version 6.0.3
$ npx tsc --init
```

[OpenZeppelin Wizard](https://wizard.openzeppelin.com/embed?tab=Account)のAccountタブにして以下をチェックして作られたコードを貼り付け。

* Signature Validation
  * Account Bound
* Multisig

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

`MyUserOp`コントラクトは`script/Deploy.s.sol`の内容に従って展開される。  
署名者は1名登録した状態で始まる。

```shell
$ ./deploy.sh
.......
Deposit

  EntryPoint ETH:
1000000000000000000
  MyUserOp ETH:
1000000000000000000
  MyUserOp ERC20
1000000000000000000
```

### Run

```shell
$ cd viem
```

`pnpm run addSigners`は署名者を1名追加する。

```shell
$ pnpm run addSigners
$ tsx src/addSigners.ts
blockNumber=13
current signers=["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"]
sender=0xdc64a140aa3e981100a9beca4e685f962f0cf6c9
nonce=1234000000000000000000000000000000000000000000000000000000000000
userOpHash=0xe8baa8ca9dc02e448b6ea30518d93c4e361a85d8ecf74e1995b5e85b0732783c
Wait for transaction receipt...
new signers=["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266","0x70997970c51812dc3a010c7d01b50e0d17dc79c8"]
```

`pnpm run sendTransfers`は送金を行う。  
`addSigners`を実行していた場合、`ACCOUNT0`と`ACCOUNT1`が署名者になっている。  
最初にETHを送金、次にERC-20を

```shell
$ pnpm run sendTransfers
$ tsx src/sendTransfers.ts
blockNumber=220
current signers=["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266","0x70997970c51812dc3a010c7d01b50e0d17dc79c8"]
==========
Send ETH
==========
Before ETH: MyUserOP=1000000000000000000, BOB=10000000000000000000000
sender=0xdc64a140aa3e981100a9beca4e685f962f0cf6c9
nonce=1234000000000000000000000000000000000000000000000000000000000001
userOpHash=0x93cfaddfe437f8ea0a11837facf448c5033a5cf2a5b1bbc084bf40dda64b39f7
Wait for transaction receipt...
ETH transfer done: 0xdc64a140aa3e981100a9beca4e685f962f0cf6c9 -> 0x90F79bf6EB2c4f870365E785982E1f101E93b906
After ETH: MyUserOP=999000000000000000, BOB=10000001000000000000000

==========
Send ERC20: 0x5fc8d32690cc91d4c39d9d3abcbd16989f875707
==========
Before ERC20: MyUserOP=1000000000000000000, BOB=0
sender=0xdc64a140aa3e981100a9beca4e685f962f0cf6c9
nonce=1234000000000000000000000000000000000000000000000000000000000002
userOpHash=0xf290431515ab8891458c37319afec3258542eac059f68f5e2dc811c19da7bf3f
Wait for transaction receipt...
ERC-20 transfer done: 0xdc64a140aa3e981100a9beca4e685f962f0cf6c9 -> 0x90F79bf6EB2c4f870365E785982E1f101E93b906
After ERC20: MyUserOP=999999999999999999, BOB=1
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

# 修改记录

- 2025-12-09  已实现并写入合约 `mycontract.sol`：
  - 增加 `debts` 存储、`creditors` 邻接表。
  - 实现 `lookup(debtor, creditor)` 返回欠款数额。
  - 实现 `add_IOU(creditor, amount)`：包含基于 BFS 的循环检测（深度上限 10）并按最小边权值减少循环中的边；同时维护 `users` 和 `lastActive`。

- 2025-12-09  已更新 `script.js`：
  - 实现 `getUsers()`：优先使用合约的用户列表（如果可用），否则回退到扫描链上 `add_IOU` 调用。
  - 实现 `getTotalOwed(user)`：对所有用户调用 `lookup` 并求和。
  - 实现 `getLastActive(user)`：优先读取合约上的 `lastActive`，回退方案为扫描历史调用。
  - 实现 `add_IOU(creditor, amount)`：向合约提交事务。

注意：
- 合约已写入 `mycontract.sol`，但需要在 Remix/本地编译并部署，然后把生成的 ABI 填入 `script.js` 中的 `abi` 变量，并把 `contractAddress` 替换为部署后的地址，页面才能正常与合约交互。
- 我已尽量将循环检测放在合约端实现（深度限制 10），满足作业要求；如果你想把循环解析放在客户端以节省 gas，我可以把逻辑调整为客户端先计算并传入额外参数，然后由合约只做最小操作。


- 2025-12-09  部署与测试:
  - 在 WSL 中安装 Ganache CLI v6.12.2 (ganache-core: 2.13.2)
Error: listen EADDRINUSE: address already in use 127.0.0.1:8545
    at Server.setupListenHandle [as _listen2] (node:net:1811:16)
    at listenInCluster (node:net:1859:12)
    at doListen (node:net:2008:7)
    at processTicksAndRejections (node:internal/process/task_queues:83:21) 和 Truffle v5.11.5 - a development framework for Ethereum

Usage: truffle <command> [options]

Commands:
  truffle build      Execute build pipeline (if configuration present)
  truffle call       Call read-only contract function with arguments
  truffle compile    Compile contract source files
  truffle config     Set user-level configuration options
  truffle console    Run a console with contract abstractions and commands
                     available
  truffle create     Helper to create new contracts, migrations and tests
  truffle dashboard  Start Truffle Dashboard to sign development transactions
                     using browser wallet
  truffle db         Database interface commands
  truffle debug      Interactively debug any transaction on the blockchain
  truffle deploy     (alias for migrate)
  truffle develop    Open a console with a local development blockchain
  truffle exec       Execute a JS module within this Truffle environment
  truffle help       List all commands or provide information about a specific
                     command
  truffle init       Initialize new and empty Ethereum project
  truffle migrate    Run migrations to deploy contracts
  truffle networks   Show addresses for deployed contracts on each network
  truffle obtain     Fetch and cache a specified compiler
  truffle opcode     Print the compiled opcodes for a given contract
  truffle preserve   Save data to decentralized storage platforms like IPFS and
                     Filecoin
  truffle run        Run a third-party command
  truffle test       Run JavaScript and Solidity tests
  truffle unbox      Download a Truffle Box, a pre-built Truffle project
  truffle version    Show version number and exit
  truffle watch      Watch filesystem for changes and rebuild the project
                     automatically

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

See more at https://trufflesuite.com/docs/
For Ethereum JSON-RPC documentation see https://ganache.dev。
  - 启动本地 Ganache 节点并使用 Truffle 编译/部署合约到 。
  - 部署地址: 。
  - 通过 Please specify a file, passing the path of the script you'd like the run. Note that all scripts *must* call process.exit() when finished.
Truffle v5.11.5 (core: 5.11.5)
Node v18.19.1 运行简单交互脚本：调用  并验证  与 。

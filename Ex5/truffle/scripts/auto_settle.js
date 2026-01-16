// Truffle script: auto_settle.js
//  - deploys (uses deployed contract), adds an IOU, detects a cycle and settles it by calling settle_IOU

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const instance = await artifacts.require('BlockchainSplitwiseV2').deployed();

    const debtor = accounts[0];
    const creditor = accounts[1];
    const amount = 50; // sample IOU amount to add

    console.log('Accounts[0] (debtor):', debtor);
    console.log('Accounts[1] (creditor):', creditor);

    // Add IOU from debtor -> creditor
    console.log(`Adding IOU ${amount} from ${debtor} -> ${creditor}`);
    await instance.add_IOU(creditor, amount, {from: debtor});

    // Build user list from contract
    const n = (await instance.getNumUsers()).toNumber ? (await instance.getNumUsers()).toNumber() : await instance.getNumUsers();
    const users = [];
    for (let i = 0; i < n; i++) {
      users.push(await instance.usersIndex(i));
    }

    // Build adjacency: map address -> array of {to,amount}
    const adj = {};
    for (const u of users) {
      adj[u] = [];
    }
    for (const u of users) {
      for (const v of users) {
        const val = await instance.lookup(u, v);
        const owed = val.toNumber ? val.toNumber() : val;
        if (owed > 0) {
          adj[u].push({to: v, amount: owed});
        }
      }
    }

    // BFS to find path from creditor -> debtor
    function findPath(start, goal) {
      const q = [[start]];
      const seen = new Set([start]);
      while (q.length > 0) {
        const path = q.shift();
        const last = path[path.length - 1];
        if (last === goal) return path;
        for (const edge of (adj[last] || [])) {
          if (!seen.has(edge.to)) {
            seen.add(edge.to);
            q.push(path.concat([edge.to]));
          }
        }
      }
      return null;
    }

    const path = findPath(creditor, debtor);
    if (!path) {
      console.log('No cycle found for new IOU.');
      return callback();
    }

    // compute min edge along the cycle (including new edge amount)
    // path is [creditor, ..., debtor]
    let minEdge = amount;
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i+1];
      const val = await instance.lookup(from, to);
      const owed = val.toNumber ? val.toNumber() : val;
      if (owed < minEdge) minEdge = owed;
    }

    console.log('Found cycle path:', path.join(' -> '));
    console.log('Minimum edge in cycle (m):', minEdge);

    const m = minEdge;
    if (m <= 0) {
      console.log('Nothing to settle.');
      return callback();
    }

    // Settle each edge along the path by calling settle_IOU on the debtor of that edge.
    // Edges are path[i] -> path[i+1]
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i+1];
      console.log(`Settling ${m} from ${from} -> ${to} (tx from ${from})`);
      await instance.settle_IOU(to, m, {from: from});
    }

    // Finally settle the newly added edge debtor -> creditor
    console.log(`Also settling ${m} on new edge ${debtor} -> ${creditor}`);
    await instance.settle_IOU(creditor, m, {from: debtor});

    // Print updated debts along cycle
    console.log('Updated debts after settlement:');
    for (let i = 0; i < path.length - 1; i++) {
      const val = await instance.lookup(path[i], path[i+1]);
      console.log(`${path[i]} -> ${path[i+1]}:`, val.toNumber ? val.toNumber() : val);
    }
    const valNew = await instance.lookup(debtor, creditor);
    console.log(`${debtor} -> ${creditor}:`, valNew.toNumber ? valNew.toNumber() : valNew);

    return callback();
  } catch (err) {
    console.error(err);
    return callback(err);
  }
};

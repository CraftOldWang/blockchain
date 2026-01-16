pragma solidity ^0.4.24;

contract BlockchainSplitwise {
    // debts[A][B] = amount A owes B
    mapping(address => mapping(address => uint32)) public debts;

    // adjacency list to enumerate neighbors for BFS (addresses that this address owes to)
    mapping(address => address[]) public creditors; // for a debtor, list of creditors
    mapping(address => mapping(address => bool)) private creditorExists;

    // record last active time for quick lookup
    mapping(address => uint32) public lastActive;

    // Keep a list of users (addresses that have appeared)
    address[] public users;
    mapping(address => bool) public userExists;

    // temporary storage used during BFS; cleared after use
    mapping(address => bool) private _visited;
    mapping(address => address) private _parent;
    address[] private _visitedList;

    // public lookup as required
    function lookup(address debtor, address creditor) public view returns (uint32) {
        return debts[debtor][creditor];
    }

    // helper to add user once
    function _addUser(address a) internal {
        if (!userExists[a]) {
            userExists[a] = true;
            users.push(a);
        }
    }

    // add_IOU: add IOU from msg.sender to creditor
    // If a cycle exists (creditor -> ... -> debtor), reduce the cycle by the minimum edge
    function add_IOU(address creditor, uint32 amount) public {
        require(amount > 0);
        address debtor = msg.sender;

        // update user lists and timestamps
        _addUser(debtor);
        _addUser(creditor);
        lastActive[debtor] = uint32(now);
        lastActive[creditor] = uint32(now);

        // BFS from creditor to debtor (limit depth implicitly by queue size)
        // Use fixed-size memory arrays for queue
        address[] memory queue = new address[](256);
        uint[] memory depth = new uint[](256);
        uint head = 0;
        uint tail = 0;

        // init
        queue[tail] = creditor; depth[tail] = 0; tail++;
        _visited[creditor] = true; _visitedList.push(creditor);
        _parent[creditor] = address(0);
        bool found = false;
        uint maxDepth = 10;

        while (head < tail && !found) {
            address cur = queue[head];
            uint d = depth[head];
            head++;
            if (d >= maxDepth) continue;
            address[] storage neigh = creditors[cur];
            for (uint i = 0; i < neigh.length; i++) {
                address nxt = neigh[i];
                if (debts[cur][nxt] == 0) continue;
                if (!_visited[nxt]) {
                    _visited[nxt] = true; _visitedList.push(nxt);
                    _parent[nxt] = cur;
                    if (nxt == debtor) { found = true; break; }
                    queue[tail] = nxt; depth[tail] = d + 1; tail++;
                }
            }
        }

        if (found) {
            // reconstruct path from creditor -> ... -> debtor
            // first compute length
            address cur = debtor;
            uint pathLen = 0;
            address[] memory path = new address[](256);
            // build reversed path
            while (cur != address(0)) {
                path[pathLen] = cur;
                pathLen++;
                cur = _parent[cur];
            }
            // path currently debtor ... creditor; reverse it
            // compute min along edges
            uint32 minVal = debts[path[pathLen-1]][path[pathLen-2]];
            for (uint k = pathLen-1; k >= 1; k--) {
                uint32 val = debts[path[k]][path[k-1]];
                if (val < minVal) minVal = val;
                if (k == 1) break; // prevent underflow
            }
            // reduce along path
            for (k = pathLen-1; k >= 1; k--) {
                address a = path[k];
                address b = path[k-1];
                if (debts[a][b] <= minVal) {
                    debts[a][b] = 0;
                } else {
                    debts[a][b] = debts[a][b] - minVal;
                }
                if (k == 1) break;
            }

            // apply remaining amount if any
            if (amount > minVal) {
                uint32 remaining = uint32(uint(amount) - uint(minVal));
                if (debts[debtor][creditor] == 0 && !creditorExists[debtor][creditor]) {
                    creditors[debtor].push(creditor);
                    creditorExists[debtor][creditor] = true;
                }
                debts[debtor][creditor] = debts[debtor][creditor] + remaining;
            }
        } else {
            // no cycle, just add debt
            if (debts[debtor][creditor] == 0 && !creditorExists[debtor][creditor]) {
                creditors[debtor].push(creditor);
                creditorExists[debtor][creditor] = true;
            }
            debts[debtor][creditor] = debts[debtor][creditor] + amount;
        }

        // clear temporary visited/parent markers
        for (uint idx = 0; idx < _visitedList.length; idx++) {
            address a = _visitedList[idx];
            _visited[a] = false;
            _parent[a] = address(0);
        }
        delete _visitedList;
    }

    // helper to get number of users
    function getNumUsers() public view returns (uint) {
        return users.length;
    }
}

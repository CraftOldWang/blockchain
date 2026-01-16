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

	// add_IOU: add IOU from msg.sender to creditor (no on-chain cycle resolution)
	function add_IOU(address creditor, uint32 amount) public {
		require(amount > 0);
		address debtor = msg.sender;

		_addUser(debtor);
		_addUser(creditor);
		lastActive[debtor] = uint32(now);
		lastActive[creditor] = uint32(now);

		if (debts[debtor][creditor] == 0 && !creditorExists[debtor][creditor]) {
			creditors[debtor].push(creditor);
			creditorExists[debtor][creditor] = true;
		}
		debts[debtor][creditor] = debts[debtor][creditor] + amount;
	}

	// helper to get number of users
	function getNumUsers() public view returns (uint) {
		return users.length;
	}
}
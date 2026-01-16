pragma solidity ^0.4.24;

contract BlockchainSplitwiseV2 {
    // debts[debtor][creditor] = amount
    mapping(address => mapping(address => uint32)) public debts;
    address[] public users;
    mapping(address => bool) public userExists;
    mapping(address => uint32) public lastActive;

    event IOUAdded(address indexed debtor, address indexed creditor, uint32 amount);
    event IOUSettled(address indexed debtor, address indexed creditor, uint32 amount);

    function _addUser(address u) internal {
        if (!userExists[u]) {
            userExists[u] = true;
            users.push(u);
        }
    }

    function getNumUsers() public view returns (uint256) {
        return users.length;
    }

    function usersIndex(uint256 i) public view returns (address) {
        return users[i];
    }

    function lookup(address debtor, address creditor) public view returns (uint32) {
        return debts[debtor][creditor];
    }

    function add_IOU(address creditor, uint32 amount) public {
        require(creditor != address(0));
        require(amount > 0);
        address debtor = msg.sender;
        _addUser(debtor);
        _addUser(creditor);
        debts[debtor][creditor] = debts[debtor][creditor] + amount;
        lastActive[debtor] = uint32(now);
        emit IOUAdded(debtor, creditor, amount);
    }

    // Allow debtor to reduce their debt to creditor by `amount` (up to existing debt)
    function settle_IOU(address creditor, uint32 amount) public {
        address debtor = msg.sender;
        uint32 owed = debts[debtor][creditor];
        require(owed > 0);
        uint32 reduction = amount;
        if (reduction > owed) {
            reduction = owed;
        }
        debts[debtor][creditor] = owed - reduction;
        lastActive[debtor] = uint32(now);
        emit IOUSettled(debtor, creditor, reduction);
    }
}

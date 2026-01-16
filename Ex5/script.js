// =============================================================================
//                                  Config
// =============================================================================

// sets up web3.js
if (typeof web3 !== "undefined") {
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// Default account is the first one
web3.eth.defaultAccount = web3.eth.accounts[0];
// Constant we use later
var GENESIS =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

// This is the ABI for your contract (get it from Remix, in the 'Compile' tab)
// ============================================================
var abi = [
    {
        constant: true,
        inputs: [
            {
                name: "",
                type: "address",
            },
        ],
        name: "userExists",
        outputs: [
            {
                name: "",
                type: "bool",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
        name: "users",
        outputs: [
            {
                name: "",
                type: "address",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            {
                name: "",
                type: "address",
            },
            {
                name: "",
                type: "address",
            },
        ],
        name: "debts",
        outputs: [
            {
                name: "",
                type: "uint32",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            {
                name: "",
                type: "address",
            },
        ],
        name: "lastActive",
        outputs: [
            {
                name: "",
                type: "uint32",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            {
                name: "",
                type: "address",
            },
            {
                name: "",
                type: "uint256",
            },
        ],
        name: "creditors",
        outputs: [
            {
                name: "",
                type: "address",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            {
                name: "debtor",
                type: "address",
            },
            {
                name: "creditor",
                type: "address",
            },
        ],
        name: "lookup",
        outputs: [
            {
                name: "",
                type: "uint32",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            {
                name: "creditor",
                type: "address",
            },
            {
                name: "amount",
                type: "uint32",
            },
        ],
        name: "add_IOU",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "getNumUsers",
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
]; // ABI inserted by script after compiling/deploying
// ============================================================
abiDecoder.addABI(abi);
// call abiDecoder.decodeMethod to use this - see 'getAllFunctionCalls' for more

// Reads in the ABI
var BlockchainSplitwiseContractSpec = web3.eth.contract(abi);

// This is the address of the contract you want to connect to; copy this from Remix
var contractAddress = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"; // deployed address inserted by script
var BlockchainSplitwise = BlockchainSplitwiseContractSpec.at(contractAddress);

// =============================================================================
//                            Functions To Implement
// =============================================================================

// TODO: Add any helper functions here!

// Return a list of all users (creditors or debtors) in the system
function getUsers() {
    var users = [];
    try {
        // Try to use on-chain user list if available
        var n = BlockchainSplitwise.getNumUsers.call();
        n = n.toNumber();
        for (var i = 0; i < n; i++) {
            try {
                users.push(BlockchainSplitwise.users(i));
            } catch (e) {
                // fallback if users getter not present
            }
        }
        if (users.length > 0) return users;
    } catch (e) {
        // contract might not expose users; fall back to scanning past txns
    }

    // Fallback: scan history for add_IOU calls
    var calls = getAllFunctionCalls(contractAddress, "add_IOU");
    var set = {};
    calls.forEach(function (c) {
        set[c.from] = true;
        if (c.args && c.args.length > 0) set[c.args[0]] = true;
    });
    return Object.keys(set);
}

// Get the total amount owed by the user specified by 'user'
function getTotalOwed(user) {
    var users = getUsers();
    var total = 0;
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if (u === user) continue;
        try {
            var bn = BlockchainSplitwise.lookup.call(user, u);
            total += bn.toNumber();
        } catch (e) {
            // lookup might throw if ABI missing
        }
    }
    return total;
}

// Get the last time this user has sent or received an IOU, in seconds since Jan. 1, 1970
// Return null if you can't find any activity.
function getLastActive(user) {
    try {
        var t = BlockchainSplitwise.lastActive.call(user);
        var tn = t.toNumber();
        if (tn === 0) return null;
        return tn;
    } catch (e) {
        // fallback: scan history for add_IOU calls and use block timestamps
        var calls = getAllFunctionCalls(contractAddress, "add_IOU");
        var last = null;
        for (var i = 0; i < calls.length; i++) {
            var c = calls[i];
            if (c.from === user || (c.args && c.args[0] === user)) {
                // we don't have timestamp in getAllFunctionCalls; so we approximate by block order
                last = Math.max(last || 0, Date.now() / 1000);
            }
        }
        if (last === null) return null;
        return Math.floor(last);
    }
}

// add an IOU ('I owe you') to the system
// The person you owe money is passed as 'creditor'
// The amount you owe them is passed as 'amount'
function add_IOU(creditor, amount) {
    // send transaction
    try {
        BlockchainSplitwise.add_IOU(creditor, amount, {
            from: web3.eth.defaultAccount,
        });
    } catch (e) {
        console.log("Error calling add_IOU", e);
    }
}

// send_IOU: client-facing API required by assignment
// Calls the contract's add_IOU. We expose this name so UI/tests can call it.
function send_IOU(creditor, amount) {
    // ensure numeric amount
    var a = parseInt(amount);
    if (isNaN(a) || a <= 0) {
        console.log("send_IOU: invalid amount", amount);
        return;
    }
    try {
        BlockchainSplitwise.add_IOU(creditor, a, {
            from: web3.eth.defaultAccount,
        });
    } catch (e) {
        console.log("Error calling send_IOU (add_IOU)", e);
    }
}

// =============================================================================
//                              Provided Functions
// =============================================================================
// (unchanged) getAllFunctionCalls and doBFS helpers

// This searches the block history for all calls to 'functionName' (string) on the 'addressOfContract' (string)
// It returns an array of objects, one for each call, containing the sender ('from') and arguments ('args')
function getAllFunctionCalls(addressOfContract, functionName) {
    var curBlock = web3.eth.blockNumber;
    var function_calls = [];
    while (curBlock !== GENESIS) {
        var b = web3.eth.getBlock(curBlock, true);
        var txns = b.transactions;
        for (var j = 0; j < txns.length; j++) {
            var txn = txns[j];
            // check that destination of txn is our contract
            if (txn.to === addressOfContract) {
                var func_call = abiDecoder.decodeMethod(txn.input);
                // check that the function getting called in this txn is 'functionName'
                if (func_call && func_call.name === functionName) {
                    var args = func_call.params.map(function (x) {
                        return x.value;
                    });
                    function_calls.push({
                        from: txn.from,
                        args: args,
                    });
                }
            }
        }
        curBlock = b.parentHash;
    }
    return function_calls;
}

// Breadth-first search implementation (provided)
function doBFS(start, end, getNeighbors) {
    var queue = [[start]];
    while (queue.length > 0) {
        var cur = queue.shift();
        var lastNode = cur[cur.length - 1];
        if (lastNode === end) {
            return cur;
        } else {
            var neighbors = getNeighbors(lastNode);
            for (var i = 0; i < neighbors.length; i++) {
                queue.push(cur.concat([neighbors[i]]));
            }
        }
    }
    return null;
}

// =============================================================================
//                                      UI
// =============================================================================

// This code updates the 'My Account' UI with the results of your functions
$("#total_owed").html("$" + getTotalOwed(web3.eth.defaultAccount));
$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)));
$("#myaccount").change(function () {
    web3.eth.defaultAccount = $(this).val();
    $("#total_owed").html("$" + getTotalOwed(web3.eth.defaultAccount));
    $("#last_active").html(
        timeConverter(getLastActive(web3.eth.defaultAccount))
    );
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
var opts = web3.eth.accounts.map(function (a) {
    return '<option value="' + a + "'>" + a + "</option>";
});
$(".account").html(opts);
$(".wallet_addresses").html(
    web3.eth.accounts.map(function (a) {
        return "<li>" + a + "</li>";
    })
);

// This code updates the 'Users' list in the UI with the results of your function
$("#all_users").html(
    getUsers().map(function (u, i) {
        return "<li>" + u + "</li>";
    })
);

// This runs the 'send_IOU' function when you click the button
// It passes the values from the two inputs above
$("#addiou").click(function () {
    send_IOU($("#creditor").val(), $("#amount").val());
    window.location.reload(true); // refreshes the page after
});

// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
    $("#log").html(
        $("#log").html() +
            description +
            ": " +
            JSON.stringify(obj, null, 2) +
            "\n\n"
    );
}

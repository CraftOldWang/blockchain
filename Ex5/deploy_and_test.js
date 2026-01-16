const fs = require("fs");
const path = require("path");
const solc = require("solc");
const Web3 = require("web3");

async function compileContract() {
    const source = fs.readFileSync(
        path.join(__dirname, "mycontract.sol"),
        "utf8"
    );
    // Try standard-json input first (newer solc), fall back to legacy compile for solc 0.4.x
    try {
        const input = {
            language: "Solidity",
            sources: { "mycontract.sol": { content: source } },
            settings: {
                outputSelection: {
                    "*": { "*": ["abi", "evm.bytecode.object"] },
                },
            },
        };
        const stdOut = solc.compile(JSON.stringify(input));
        const output = JSON.parse(stdOut);
        if (output.errors) {
            console.log("Compiler output errors/warnings:");
            output.errors.forEach((e) =>
                console.log(e.formattedMessage || e.message || e)
            );
        }
        const contracts = output.contracts["mycontract.sol"];
        const contractName = Object.keys(contracts)[0];
        const abi = contracts[contractName].abi;
        const bytecode = contracts[contractName].evm.bytecode.object;
        return { abi, bytecode };
    } catch (e) {
        // fallback for solc 0.4.x legacy API
        const legacyOut = solc.compile(source, 1);
        console.log("Raw legacy compile output (may be string or object):");
        console.log(
            legacyOut &&
                (typeof legacyOut === "string"
                    ? legacyOut.substring(0, 200)
                    : JSON.stringify(legacyOut).substring(0, 200))
        );
        let output;
        try {
            output = JSON.parse(legacyOut);
        } catch (e2) {
            output = legacyOut;
        }
        // legacyOut (parsed) should contain 'contracts'
        if (output && output.contracts) {
            // find first contract
            const keys = Object.keys(output.contracts);
            console.log("Parsed legacy contracts keys:", keys);
            const contractKey = keys[0];
            const contract = output.contracts[contractKey];
            console.log("Using contract key:", contractKey);
            console.log(
                "Contract entry keys:",
                contract && Object.keys(contract)
            );
            const abi =
                (contract.interface && JSON.parse(contract.interface)) ||
                contract.abi ||
                contract["abi"];
            const bytecode =
                contract.bytecode ||
                (contract.evm &&
                    contract.evm.bytecode &&
                    contract.evm.bytecode.object) ||
                "";
            return { abi, bytecode };
        }
        // debug output so we can see what legacyOut looks like
        console.log(
            "Legacy solc output did not include .contracts; raw output below:"
        );
        console.log(legacyOut);
        throw new Error(
            "Compilation failed; solc legacy output not recognized"
        );
    }
}

async function deployAndTest() {
    const { abi, bytecode } = await compileContract();
    const Web3 = require("web3");

    // wait for local node to be available
    const providerUrl = "http://127.0.0.1:8545";
    const maxRetries = 20;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    let web3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            web3 = new Web3(providerUrl);
            await web3.eth.net.isListening();
            break;
        } catch (e) {
            if (i === maxRetries - 1)
                throw new Error(
                    "Could not connect to local node at " + providerUrl
                );
            await delay(500);
        }
    }
    const accounts = await web3.eth.getAccounts();
    console.log("Accounts:", accounts.slice(0, 4));

    const Contract = new web3.eth.Contract(abi);
    console.log("Deploying contract from", accounts[0]);
    const deployed = await Contract.deploy({ data: "0x" + bytecode }).send({
        from: accounts[0],
        gas: 3000000,
    });
    console.log("Deployed at address", deployed.options.address);

    // Save deployed info for client injection
    fs.writeFileSync(
        path.join(__dirname, "deployed.json"),
        JSON.stringify({ address: deployed.options.address, abi: abi }, null, 2)
    );

    // Run a scenario: A->B 15, B->C 11, C->A 16 (cycle resolution expected)
    const A = accounts[0];
    const B = accounts[1];
    const C = accounts[2];

    const instance = new web3.eth.Contract(abi, deployed.options.address);

    async function lookup(d, c) {
        const v = await instance.methods.lookup(d, c).call();
        return Number(v);
    }

    console.log("\n--- BEFORE ANY IOUs ---");
    console.log("A->B", await lookup(A, B));
    console.log("B->C", await lookup(B, C));
    console.log("C->A", await lookup(C, A));

    console.log("\nA adds IOU to B: 15");
    await instance.methods.add_IOU(B, 15).send({ from: A, gas: 200000 });
    console.log("A->B", await lookup(A, B));

    console.log("\nB adds IOU to C: 11");
    await instance.methods.add_IOU(C, 11).send({ from: B, gas: 200000 });
    console.log("B->C", await lookup(B, C));

    console.log("\nC adds IOU to A: 16 (this should trigger cycle resolution)");
    await instance.methods.add_IOU(A, 16).send({ from: C, gas: 400000 });

    console.log("\n--- AFTER C->A 16 ---");
    console.log("A->B", await lookup(A, B));
    console.log("B->C", await lookup(B, C));
    console.log("C->A", await lookup(C, A));

    console.log(
        "\nTest completed. deployed.json written with ABI and address."
    );
}

deployAndTest().catch((err) => {
    console.error("Error in deployAndTest:", err);
    process.exit(1);
});

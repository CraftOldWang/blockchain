include "./mimc.circom";

/*
 * IfThenElse sets `out` to `true_value` if `condition` is 1 and `out` to
 * `false_value` if `condition` is 0.
 *
 * It enforces that `condition` is 0 or 1.
 *
 */
template IfThenElse() {
    signal input condition;
    signal input true_value;
    signal input false_value;
    signal output out;

    // Enforce that condition is 0 or 1
    condition * (1 - condition) === 0;

    // out = condition * true_value + (1 - condition) * false_value
    // Need a helper signal because we can't multiply two signals directly in output
    signal helper;
    helper <== condition * true_value;
    out <== helper + false_value - condition * false_value;
}

/*
 * SelectiveSwitch takes two data inputs (`in0`, `in1`) and produces two ouputs.
 * If the "select" (`s`) input is 1, then it inverts the order of the inputs
 * in the ouput. If `s` is 0, then it preserves the order.
 *
 * It enforces that `s` is 0 or 1.
 */
template SelectiveSwitch() {
    signal input in0;
    signal input in1;
    signal input s;
    signal output out0;
    signal output out1;

    // Use IfThenElse to implement the switch
    // When s=0: out0=in0, out1=in1
    // When s=1: out0=in1, out1=in0
    component ite0 = IfThenElse();
    component ite1 = IfThenElse();

    ite0.condition <== s;
    ite0.true_value <== in1;
    ite0.false_value <== in0;
    out0 <== ite0.out;

    ite1.condition <== s;
    ite1.true_value <== in0;
    ite1.false_value <== in1;
    out1 <== ite1.out;
}

/*
 * Verifies the presence of H(`nullifier`, `nonce`) in the tree of depth
 * `depth`, summarized by `digest`.
 * This presence is witnessed by a Merle proof provided as
 * the additional inputs `sibling` and `direction`, 
 * which have the following meaning:
 *   sibling[i]: the sibling of the node on the path to this coin
 *               at the i'th level from the bottom.
 *   direction[i]: "0" or "1" indicating whether that sibling is on the left.
 *       The "sibling" hashes correspond directly to the siblings in the
 *       SparseMerkleTree path.
 *       The "direction" keys the boolean directions from the SparseMerkleTree
 *       path, casted to string-represented integers ("0" or "1").
 */
template Spend(depth) {
    signal input digest;
    signal input nullifier;
    signal private input nonce;
    signal private input sibling[depth];
    signal private input direction[depth];

    // Compute the coin: H(nullifier, nonce)
    component coinHash = Mimc2();
    coinHash.in0 <== nullifier;
    coinHash.in1 <== nonce;

    // Store intermediate hash values along the Merkle path
    signal pathHash[depth + 1];
    pathHash[0] <== coinHash.out;

    // Components for selective switching and hashing at each level
    component switches[depth];
    component hashers[depth];

    // Traverse the Merkle path from leaf to root
    for (var i = 0; i < depth; i++) {
        // Use SelectiveSwitch to order the pair correctly
        // direction[i] = 0 means sibling is on right, so current is left
        // direction[i] = 1 means sibling is on left, so current is right
        switches[i] = SelectiveSwitch();
        switches[i].in0 <== pathHash[i];
        switches[i].in1 <== sibling[i];
        switches[i].s <== direction[i];

        // Hash the pair: Mimc2(left, right)
        hashers[i] = Mimc2();
        hashers[i].in0 <== switches[i].out0;
        hashers[i].in1 <== switches[i].out1;

        pathHash[i + 1] <== hashers[i].out;
    }

    // The final hash must equal the digest
    digest === pathHash[depth];
}

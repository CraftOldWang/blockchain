Name: []

## Question 1

In the following code-snippet from `Num2Bits`, it looks like `sum_of_bits`
might be a sum of products of signals, making the subsequent constraint not
rank-1. Explain why `sum_of_bits` is actually a _linear combination_ of
signals.

```
        sum_of_bits += (2 ** i) * bits[i];
```

## Answer 1

`sum_of_bits` is a linear combination because `(2 ** i)` is a constant (computed at compile time), not a signal. When you multiply a constant by a signal, the result is still a linear term. The expression `sum_of_bits += (2 ** i) * bits[i]` accumulates terms of the form `constant * signal`, which is by definition a linear combination. There are no products of two signals involved.

## Question 2

Explain, in your own words, the meaning of the `<==` operator.

## Answer 2

The `<==` operator in circom combines two operations into one:
1. Assignment (`<--`): It assigns the value on the right side to the signal on the left side, computing the witness.
2. Constraint (`===`): It also adds a rank-1 constraint requiring that the left side equals the right side.

In other words, `a <== b` is equivalent to writing `a <-- b; a === b;`. It's a convenience operator that both computes the signal value and enforces the equality constraint simultaneously.

## Question 3

Suppose you're reading a `circom` program and you see the following:

```
    signal input a;
    signal input b;
    signal input c;
    (a & 1) * b === c;
```

Explain why this is invalid.

## Answer 3

This is invalid because the bitwise AND operator `&` is not allowed in circom constraints. Circom's arithmetic circuit constraints only support addition and multiplication over a finite field. The `&` operator is a binary/bitwise operation that cannot be expressed as a rank-1 constraint (R1C). While you can use bitwise operations like `&` in assignment statements (`<--`) for computing witness values, you cannot use them in constraint statements (`===`). To properly constrain such logic, you would need to decompose the value into bits and build equivalent arithmetic constraints.

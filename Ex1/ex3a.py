from sys import exit
from bitcoin.core.script import *

from utils import *
from config import my_private_key, my_public_key, my_address, faucet_address
from ex1 import send_from_P2PKH_transaction


######################################################################
# TODO: Complete the scriptPubKey implementation for Exercise 3

A = 110112200   # 你的身份证前9位
B = 503080034   # 你的身份证后9位

ex3a_txout_scriptPubKey = [
    OP_2DUP,       # 复制堆栈顶部两个值 x, y
    OP_ADD,        # 计算 x + y
    A,             # 压入常数 A
    OP_EQUALVERIFY,# 验证 x+y == A
    OP_SUB,        # 计算 x - y
    B,             # 压入常数 B
    OP_EQUAL       # 验证 x-y == B
]

######################################################################

if __name__ == '__main__':
    ######################################################################
    # TODO: set these parameters correctly
    amount_to_send = 0.0001
    txid_to_spend = (
        '274913b0847ca490c18e31e0ef2864a0365673da3e72ae7d859d02795edad46b')
    utxo_index = 3
    ######################################################################

    response = send_from_P2PKH_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        ex3a_txout_scriptPubKey)
    print(response.status_code, response.reason)
    print(response.text)

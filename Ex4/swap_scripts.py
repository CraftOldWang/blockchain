from bitcoin.core.script import *

######################################################################
# This function will be used by Alice and Bob to send their respective
# coins to a utxo that is redeemable either of two cases:
# 1) Recipient provides x such that hash(x) = hash of secret 
#    and recipient signs the transaction.
# 2) Sender and recipient both sign transaction
# 
# TODO: Fill this in to create a script that is redeemable by both
#       of the above conditions.
# 
# See this page for opcode: https://en.bitcoin.it/wiki/Script
#
#

# This is the ScriptPubKey for the swap transaction
def coinExchangeScript(public_key_sender, public_key_recipient, hash_of_secret):
    return [
        OP_IF,
            # 路径1: 接收方提供密钥和签名
            OP_HASH160,
            hash_of_secret,
            OP_EQUALVERIFY,
            public_key_recipient,
            OP_CHECKSIG,
        OP_ELSE,
            # 路径2: 发送方和接收方都签名
            OP_2,
            public_key_recipient,
            public_key_sender,
            OP_2,
            OP_CHECKMULTISIG,
        OP_ENDIF
    ]

# This is the ScriptSig that the receiver will use to redeem coins
def coinExchangeScriptSig1(sig_recipient, secret):
    return [
        sig_recipient,   # 接收方签名
        secret,          # 密钥 x  
        OP_TRUE         # 选择 IF 分支
    ]

# This is the ScriptSig for sending coins back to the sender if unredeemed
def coinExchangeScriptSig2(sig_sender, sig_recipient):
    return [
        OP_0,           # CHECKMULTISIG 的虚拟值
        sig_recipient,  # 接收方签名
        sig_sender,     # 发送方签名  
        OP_FALSE       # 选择 ELSE 分支
    ]

#
#
######################################################################


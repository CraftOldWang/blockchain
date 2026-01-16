from sys import exit
from bitcoin.core.script import *

from utils import *
from config import CBitcoinSecret, my_private_key, my_public_key, my_address, faucet_address
from ex1 import send_from_P2PKH_transaction


cust1_private_key = CBitcoinSecret(
    'cPzeci19UuZ4csPvkGGiNPj18y33URUVr8CnhnG64RtSZFRUDWyd')
cust1_public_key = cust1_private_key.pub
cust2_private_key = CBitcoinSecret(
    'cVRUwWbRomePHZJdZb1drKbDsEBPy3HzY9m6pB5ELdvMatQ7ccao')
cust2_public_key = cust2_private_key.pub
cust3_private_key = CBitcoinSecret(
    'cQmQxPPED37m9fyUShipXwMCeWJ6UqTGMPzUTm9VUbZgCdYUodkM')
cust3_public_key = cust3_private_key.pub


######################################################################
# TODO: Complete the scriptPubKey implementation for Exercise 2

# You can assume the role of the bank for the purposes of this problem
# and use my_public_key and my_private_key in lieu of bank_public_key and
# bank_private_key.

redeemScript = CScript([
    my_public_key,         
    OP_CHECKSIGVERIFY,     
    OP_1,                  
    cust1_public_key,
    cust2_public_key,
    cust3_public_key,
    OP_3,                  
    OP_CHECKMULTISIG
]) # type: ignore

from bitcoin.wallet import CBitcoinAddress, P2SHBitcoinAddress 
from bitcoin.core import Hash160

redeem_hash160 = Hash160(redeemScript) 
ex2a_txout_scriptPubKey = CScript([OP_HASH160, redeem_hash160, OP_EQUAL]) # type: ignore

######################################################################

if __name__ == '__main__':
    ######################################################################
    # TODO: set these parameters correctly
    amount_to_send = 0.0001
    txid_to_spend = (
        '274913b0847ca490c18e31e0ef2864a0365673da3e72ae7d859d02795edad46b')
    utxo_index = 2
    ######################################################################

    response = send_from_P2PKH_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        ex2a_txout_scriptPubKey)
    print(response.status_code, response.reason)
    print(response.text)

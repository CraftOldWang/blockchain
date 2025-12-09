module.exports = async function(callback) {
  try {
    const instance = await artifacts.require('BlockchainSplitwise').deployed();
    const accounts = await web3.eth.getAccounts();
    console.log('Accounts:', accounts);
    const numBefore = await instance.getNumUsers.call();
    console.log('numUsers before:', numBefore.toString());
    await instance.add_IOU(accounts[1], 42, {from: accounts[0]});
    const owed = await instance.lookup.call(accounts[0], accounts[1]);
    console.log('owed 0->1:', owed.toString());
    const numAfter = await instance.getNumUsers.call();
    console.log('numUsers after:', numAfter.toString());
    callback();
  } catch (e) {
    console.error(e);
    callback(e);
  }
};

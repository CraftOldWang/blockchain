module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const instance = await artifacts.require('BlockchainSplitwiseV2').deployed();
    console.log('Adding IOU accounts[1] -> accounts[2] (30)');
    await instance.add_IOU(accounts[2], 30, {from: accounts[1]});
    console.log('Adding IOU accounts[2] -> accounts[0] (20)');
    await instance.add_IOU(accounts[0], 20, {from: accounts[2]});
    console.log('Setup done');
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};

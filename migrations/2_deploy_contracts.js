const Token = artifacts.require("Token");
const BlockSwap = artifacts.require("BlockSwap");

module.exports = async function(deployer) {
  await deployer.deploy(Token);
  const token = await Token.deployed();

  await deployer.deploy(BlockSwap, token.address);
  const blockSwap = await BlockSwap.deployed();
  
  // Transfer all tokens to BlockSwap
  await token.transfer(blockSwap.address, '1000000000000000000000000');
};

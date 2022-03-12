const { assert } = require("chai");

const Token = artifacts.require("Token");
const BlockSwap = artifacts.require("BlockSwap");

require("chai")
  .use(require("chai-as-promised"))
  .should();

const tokens = (n) => {
  return web3.utils.toWei(n, "ether");
};

contract("BlockSwap", ([deployer, investor]) => {
  let token;
  let blockSwap;

  before(async () => {
    token = await Token.new();
    blockSwap = await BlockSwap.new(token.address);

    // Transfer all tokens to BlockSwap
    await token.transfer(blockSwap.address, tokens("1000000"));
  });

  describe("Token deployment", async () => {
    it("contract has a name", async () => {
      const name = await token.name();
      assert.equal(name, "Cool Token");
    });
  });

  describe("BlockSwap deployment", async () => {
    it("contract has a name", async () => {
      const name = await blockSwap.name();
      assert.equal(name, "BlockSwap Instant Exchange");
    });

    it("contract has tokens", async () => {
      let balance = await token.balanceOf(blockSwap.address);
      assert.equal(balance.toString(), tokens("1000000"));
    });
  });

  describe("buyTokens()", async () => {
    let result;
    before(async () => {
      // Purchase tokens before each example
      result = await blockSwap.buyTokens({
        from: investor,
        value: web3.utils.toWei("1", "ether"),
      });
    });

    it("allows user to instantly purchase tokens from BlockSwap for a fixed price", async () => {
      // Check investor token balance after purchase
      let investorBalance = await token.balanceOf(investor);
      assert.equal(investorBalance.toString(), tokens("100"));

      // Check ethSwap balance after purchase
      let blockSwapBalance;
      blockSwapBalance = await token.balanceOf(blockSwap.address);
      assert.equal(blockSwapBalance.toString(), tokens("999900"));
      blockSwapBalance = await web3.eth.getBalance(blockSwap.address);
      assert.equal(blockSwapBalance.toString(), web3.utils.toWei("1", "ether"));

       // Check logs to ensure event was emitted with correct data
       const event = result.logs[0].args
       assert.equal(event.account, investor)
       assert.equal(event.token, token.address)
       assert.equal(event.amount.toString(), tokens('100').toString())
       assert.equal(event.rate.toString(), '100')
    });
  });

  describe('sellTokens()', async () => {
    let result

    before(async () => {
      // Investor must approve tokens before the purchase
      await token.approve(blockSwap.address, tokens('100'), { from: investor })
      // Investor sells tokens
      result = await blockSwap.sellTokens(tokens('100'), { from: investor })
    })

    it('Allows user to instantly sell tokens to blockSwap for a fixed price', async () => {
      // Check investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('0'))

      // Check blockSwap balance after purchase
      let blockSwapBalance
      blockSwapBalance = await token.balanceOf(blockSwap.address)
      assert.equal(blockSwapBalance.toString(), tokens('1000000'))
      blockSwapBalance = await web3.eth.getBalance(blockSwap.address)
      assert.equal(blockSwapBalance.toString(), web3.utils.toWei('0', 'Ether'))

      // Check logs to ensure event was emitted with correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')

      // FAILURE: investor can't sell more tokens than they have
      await blockSwap.sellTokens(tokens('500'), { from: investor }).should.be.rejected;
    })
  })
});

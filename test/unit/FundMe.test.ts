import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert, expect } from 'chai'
import { deployments, ethers } from 'hardhat'
import { FundMe, MockV3Aggregator } from '../../typechain-types'

describe('FundMe', async () => {
  let fundMe: FundMe
  let deployer: SignerWithAddress
  let mockV3Aggregator: MockV3Aggregator
  const sendValue = ethers.utils.parseEther('1')

  beforeEach(async () => {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    await deployments.fixture(['all'])
    fundMe = await ethers.getContract('FundMe', deployer)
    mockV3Aggregator = await ethers.getContract('MockV3Aggregator', deployer)
  })

  describe('constructor', async () => {
    it('sets the aggregator addresses correctly', async () => {
      const response = await fundMe.getPriceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })

  describe('fund', async () => {
    it("Fails if you don't send enought ETH", async () => {
      await expect(fundMe.fund()).to.be.revertedWith(
        'You need to spend more ETH!'
      )
    })
    it('updates the amount funded data stucture', async () => {
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.getAddressToAmountFunded(deployer.address)
      assert.equal(response.toString(), sendValue.toString())
    })

    it('Adds funder to array of funders', async () => {
      await fundMe.fund({ value: sendValue })
      const funder = await fundMe.getFounder(0)
      assert.equal(funder, deployer.address)
    })
  })

  describe('withdraw', async () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue })
    })

    it('Gives a single funder all their ETH back', async () => {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )

      // Act
      const txResponse = await fundMe.withdraw()
      const txReceipt = await txResponse.wait(1)

      const { gasUsed, effectiveGasPrice } = txReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )

      //   Assert
      assert.equal(endingFundMeBalance.toString(), '0')
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
    })

    it('Allows us to withdraw with multiple funders', async () => {
      // Arrange
      const accounts = await ethers.getSigners()
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i])
        await fundMeConnectedContract.fund({ value: sendValue })
      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )
      //   Act
      const txResponse = await fundMe.withdraw()
      const txReceipt = await txResponse.wait(1)

      const { gasUsed, effectiveGasPrice } = txReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      //   Assert
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )
      assert.equal(endingFundMeBalance.toString(), '0')
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
      // ? Make sure that the funders are reset properly
      await expect(fundMe.getFounder(0)).to.be.reverted

      for (let i = 1; i < 6; i++) {
        assert.equal(
          await (
            await fundMe.getAddressToAmountFunded(accounts[i].address)
          ).toString(),
          '0'
        )
      }
    })

    it('Only allows the owner to withdraw', async () => {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]
      const attackerConnectedContract = await fundMe.connect(attacker)
      await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
        'FundMe__NotOwner'
      )
    })

    it('cheaper withdraw testing', async () => {
      // Arrange
      const accounts = await ethers.getSigners()
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i])
        await fundMeConnectedContract.fund({ value: sendValue })
      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )
      //   Act
      const txResponse = await fundMe.cheaperWithdraw()
      const txReceipt = await txResponse.wait(1)

      const { gasUsed, effectiveGasPrice } = txReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      //   Assert
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      )
      assert.equal(endingFundMeBalance.toString(), '0')
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
      // ? Make sure that the funders are reset properly
      await expect(fundMe.getFounder(0)).to.be.reverted

      for (let i = 1; i < 6; i++) {
        assert.equal(
          await (
            await fundMe.getAddressToAmountFunded(accounts[i].address)
          ).toString(),
          '0'
        )
      }
    })
  })
})

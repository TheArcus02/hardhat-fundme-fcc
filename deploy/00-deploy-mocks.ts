import { network } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const DECIMALS = '18'
const INITIAL_PRICE = '2000000000000000000000' // 2000

const deployMocks: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!

  if (chainId === 31337) {
    log('Local network detected! Deploying mocks...')
    await deploy('MockV3Aggregator', {
      contract: 'MockV3Aggregator',
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_PRICE],
    })
    log('Mocks deployed!')
    log('-----------------------------------------------------')
  }
}

export default deployMocks
deployMocks.tags = ['all', 'mocks']

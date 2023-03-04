import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-gas-reporter'
import 'dotenv/config'
import 'hardhat-deploy'
import 'solidity-coverage'
import { HardhatUserConfig } from 'hardhat/config'

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ''
const GOERLI_RPC_URL =
  process.env.GOERLI_RPC_URL ||
  'https://eth-mainnet.alchemyapi.io/v2/your-api-key'
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  '0x11ee3108a03081fe260ecdc106554d09d9d1209bcafd46942b10e02943effc4a'
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: '0.8.8' }, { version: '0.6.6' }],
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },
  },
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    outputFile: 'gas-report.txt',
    noColors: true,
    // coinmarketcap: COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [],
  },
}

export default config

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "api-key";
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
const MNEMONIC = process.env.MNEMONIC || "your mnemonic"

const config: HardhatUserConfig = {
    networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Sei Pacific testnet
    "sei-testnet": {
      url: "https://evm-rpc-testnet.sei-apis.com",
      chainId: 1328,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: 1000000000, // 1 gwei
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_SEPOLIA}`,
      accounts: [WALLET_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "sei-testnet",
        chainId: 1328,
        urls: {
          apiURL: "https://seitrace.com/pacific-1/api",
          browserURL: "https://seitrace.com/pacific-1",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

export default config;

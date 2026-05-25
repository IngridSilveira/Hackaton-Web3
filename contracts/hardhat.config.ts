import { defineConfig } from "hardhat/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    version: "0.8.28",
  },

  networks: {
    localhost: {
      type: 'http',
      url: "http://127.0.0.1:8545",
    },
  }
});

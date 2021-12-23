require("@typechain/hardhat");
require("@typechain/web3-v1");
require("hardhat-abi-exporter");

module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./build/contracts",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },
  typechain: {
    outDir: "src/abis/types",
    target: "web3-v1",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["src/abis/external/*.json"], // optional array of glob patterns with external artifacts to process
  },
  abiExporter: {
    path: "src/abis/tribute-contracts",
    runOnCompile: true,
    clear: true,
    flat: true,
    pretty: false,
  },
};

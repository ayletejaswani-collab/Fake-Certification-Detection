import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import solc from "solc";
import { ethers } from "ethers";
import { getProvider, loadOrCreateWallet, explorerBase } from "../src/services/ethereum.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, "../contracts/HashRegistry.sol");

function compile() {
  const content = fs.readFileSync(SOURCE, "utf8");
  const input = {
    language: "Solidity",
    sources: { "HashRegistry.sol": { content } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  if (out.errors?.some((e) => e.severity === "error")) {
    throw new Error(out.errors.map((e) => e.formattedMessage).join("\n"));
  }
  return out.contracts["HashRegistry.sol"].HashRegistry;
}

async function main() {
  const artifact = compile();
  const provider = await getProvider();
  const wallet = loadOrCreateWallet().connect(provider);
  const balance = await provider.getBalance(wallet.address);
  console.log("Deployer", wallet.address);
  console.log("Balance ", ethers.formatEther(balance), "ETH");
  if (balance === 0n) {
    console.log("Fund this address with Sepolia ETH, then run again:");
    console.log("https://cloud.google.com/application/web3/faucet/ethereum/sepolia");
    process.exit(1);
  }
  const factory = new ethers.ContractFactory(artifact.abi, artifact.evm.bytecode.object, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("HashRegistry deployed:", address);
  console.log("Explorer:", `${explorerBase()}/address/${address}`);
  console.log("Add to server/.env:");
  console.log(`ETH_CONTRACT_ADDRESS=${address}`);
  console.log(`ETH_PRIVATE_KEY=${wallet.privateKey}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

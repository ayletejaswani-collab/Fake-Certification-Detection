import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WALLET_FILE = path.join(__dirname, "../../.eth-wallet.json");

export const ABI = [
  "function stamp(bytes32 certHash, string certId) external",
  "function register(bytes32 certHash, string certId) external",
  "function getRecord(string certId) view returns (bytes32 certHash, address issuer, uint256 timestamp)",
  "event Stamped(string certId, bytes32 certHash, address issuer, uint256 timestamp)",
];

export function explorerBase() {
  return process.env.ETH_EXPLORER || "https://sepolia.etherscan.io";
}

export function rpcUrl() {
  return process.env.ETH_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
}

export function loadOrCreateWallet() {
  if (process.env.ETH_PRIVATE_KEY) {
    return new ethers.Wallet(process.env.ETH_PRIVATE_KEY);
  }
  if (fs.existsSync(WALLET_FILE)) {
    const saved = JSON.parse(fs.readFileSync(WALLET_FILE, "utf8"));
    return new ethers.Wallet(saved.privateKey);
  }
  const wallet = ethers.Wallet.createRandom();
  fs.writeFileSync(
    WALLET_FILE,
    JSON.stringify({ address: wallet.address, privateKey: wallet.privateKey }, null, 2)
  );
  return wallet;
}

export function signerConfigured() {
  return Boolean(process.env.ETH_PRIVATE_KEY || fs.existsSync(WALLET_FILE));
}

export function ethereumConfigured() {
  return signerConfigured();
}

function toBytes32(hashHex) {
  const clean = String(hashHex).replace(/^0x/, "");
  return `0x${clean.padStart(64, "0").slice(0, 64)}`;
}

export async function getProvider() {
  return new ethers.JsonRpcProvider(rpcUrl(), Number(process.env.ETH_CHAIN_ID || 11155111));
}

export async function publishHash(certId, hashHex) {
  if (!signerConfigured()) {
    return { published: false, reason: "wallet_missing" };
  }
  try {
    const provider = await getProvider();
    const wallet = loadOrCreateWallet().connect(provider);
    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      return {
        published: false,
        reason: "unfunded",
        address: wallet.address,
        faucet: "https://sepoliafaucet.com",
      };
    }

    const network = await provider.getNetwork();
    const contractAddr = process.env.ETH_CONTRACT_ADDRESS;
    let tx;

    if (contractAddr) {
      const contract = new ethers.Contract(contractAddr, ABI, wallet);
      tx = await contract.stamp(toBytes32(hashHex), certId);
    } else {
      tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0,
        data: ethers.hexlify(ethers.toUtf8Bytes(`ALITS|${certId}|${hashHex}`)),
      });
    }

    const receipt = await tx.wait();
    return {
      published: true,
      txHash: receipt.hash,
      network: network.name === "unknown" ? "sepolia" : network.name,
      chainId: Number(network.chainId),
      explorer: `${explorerBase()}/tx/${receipt.hash}`,
      mode: contractAddr ? "contract" : "calldata",
    };
  } catch (error) {
    console.error("Ethereum publish failed:", error.message);
    return { published: false, reason: error.message };
  }
}

export async function readOnChain(certId) {
  const contractAddr = process.env.ETH_CONTRACT_ADDRESS;
  if (!contractAddr) return { found: false, reason: "no_contract" };
  try {
    const provider = await getProvider();
    const contract = new ethers.Contract(contractAddr, ABI, provider);
    const rec = await contract.getRecord(certId);
    const ts = Number(rec.timestamp);
    if (!ts) return { found: false };
    return {
      found: true,
      certHash: rec.certHash,
      issuer: rec.issuer,
      timestamp: ts,
    };
  } catch (error) {
    return { found: false, reason: error.message };
  }
}

export async function ethereumStatus() {
  const wallet = signerConfigured() ? loadOrCreateWallet() : null;
  let balanceEth = null;
  let network = "sepolia";
  if (wallet) {
    try {
      const provider = await getProvider();
      const net = await provider.getNetwork();
      network = net.name === "unknown" ? "sepolia" : net.name;
      balanceEth = ethers.formatEther(await provider.getBalance(wallet.address));
    } catch {
      balanceEth = "unreachable";
    }
  }
  return {
    enabled: signerConfigured(),
    ready: signerConfigured() && Number(balanceEth) > 0,
    contract: process.env.ETH_CONTRACT_ADDRESS || null,
    rpc: rpcUrl(),
    explorer: explorerBase(),
    address: wallet?.address || null,
    balanceEth,
    network,
    faucet: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
    mode: process.env.ETH_CONTRACT_ADDRESS ? "contract" : "calldata",
  };
}

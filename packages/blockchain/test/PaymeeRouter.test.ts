import { expect } from "chai";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  hexToBytes,
  getContract,
  zeroAddress,
} from "viem";
import { foundry } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import paymeeRouterArtifact from "../artifacts/contracts/Sepolia/PaymeeRouter.sol/PaymeeRouter.json";
import mockTokenArtifact from "../artifacts/contracts/Sepolia/MockToken.sol/MockToken.json";
import { describe, it, beforeEach } from "vitest";

// Replace with your local node RPC URL
const rpcUrl = "http://127.0.0.1:8545";

// Replace with your test accounts' private keys
const OWNER_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; //hardhat default account
const FREELANCER_PK =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // Replace with actual freelancer private key
const CONTRACTOR_PK =
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

describe("PaymeeRouter (viem)", function () {
  let paymeeRouter: any;
  let mockToken: any;
  let paymeeRouterAddress: `0x${string}`;
  let mockTokenAddress: `0x${string}`;
  let owner: any;
  let freelancer: any;
  let contractor: any;
  let publicClient: any;
  let ownerClient: any;
  let freelancerClient: any;
  let contractorClient: any;

  beforeEach(async function () {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(rpcUrl),
    });

    owner = privateKeyToAccount(OWNER_PK);
    freelancer = privateKeyToAccount(FREELANCER_PK);
    contractor = privateKeyToAccount(CONTRACTOR_PK);

    ownerClient = createWalletClient({
      account: owner,
      chain: foundry,
      transport: http(rpcUrl),
    });
    freelancerClient = createWalletClient({
      account: freelancer,
      chain: foundry,
      transport: http(rpcUrl),
    });
    contractorClient = createWalletClient({
      account: contractor,
      chain: foundry,
      transport: http(rpcUrl),
    });

    // Deploy MockToken
    mockTokenAddress = await ownerClient.deployContract({
      abi: mockTokenArtifact.abi,
      bytecode: mockTokenArtifact.bytecode as `0x${string}`,
      args: [],
    });
    mockToken = getContract({
      address: mockTokenAddress,
      abi: mockTokenArtifact.abi,
      client: publicClient,
    });

    // Deploy PaymeeRouter
    paymeeRouterAddress = await ownerClient.deployContract({
      abi: paymeeRouterArtifact.abi,
      bytecode: paymeeRouterArtifact.bytecode as `0x${string}`,
      args: [
        "0x6EDCE65403992e310A62460808c4b910D972f10f", // Sepolia LZ endpoint
        owner.address,
      ],
    });
    paymeeRouter = getContract({
      address: paymeeRouterAddress,
      abi: paymeeRouterArtifact.abi,
      client: publicClient,
    });
  });

  it("Should create and store a payment link", async function () {
    const amount = parseUnits("100", 18);
    const token = mockTokenAddress;
    const destinationEid = 40168;
    const metadata = "QmCID";

    // Create payment link
    const { transactionHash } = await freelancerClient.writeContract({
      address: paymeeRouterAddress,
      abi: paymeeRouterArtifact.abi,
      functionName: "createPaymentLink",
      args: [amount, token, destinationEid, metadata],
    });

    // Get event from tx receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash,
    });
    const event = receipt.logs.find(
      (log: any) =>
        log.topics[0] ===
        paymeeRouter.abi.find((e: any) => e.name === "PaymentLinkCreated")
          .selector
    );

    expect(event).to.not.be.undefined;

    // Decode event log
    const decoded = publicClient.decodeEventLog({
      abi: paymeeRouterArtifact.abi,
      data: event.data,
      topics: event.topics,
    });

    const linkId = decoded.args.linkId;

    // Read payment link
    const link = await publicClient.readContract({
      address: paymeeRouterAddress,
      abi: paymeeRouterArtifact.abi,
      functionName: "paymentLinks",
      args: [linkId],
    });

    expect(link[0]).to.equal(freelancer.address); // freelancer
    expect(link[1]).to.equal(amount); // amount
    expect(link[2]).to.equal(token); // token
    expect(link[3]).to.equal(true); // isActive
    expect(link[4]).to.equal(metadata); // metadata
  });

  it("Should process payment and prevent double payment", async function () {
    const amount = parseUnits("100", 18);
    const token = mockTokenAddress;
    const destinationEid = 40168;
    const metadata = "QmCID";
    const freelancerSolanaAddr =
      "0x" + Buffer.from(Array(32).fill(1)).toString("hex");
    const options = "0x";

    // Create payment link
    const { transactionHash } = await freelancerClient.writeContract({
      address: paymeeRouterAddress,
      abi: paymeeRouterArtifact.abi,
      functionName: "createPaymentLink",
      args: [amount, token, destinationEid, metadata],
    });
    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash,
    });
    const event = receipt.logs.find(
      (log: any) =>
        log.topics[0] ===
        paymeeRouter.abi.find((e: any) => e.name === "PaymentLinkCreated")
          .selector
    );
    const decoded = publicClient.decodeEventLog({
      abi: paymeeRouterArtifact.abi,
      data: event.data,
      topics: event.topics,
    });
    const linkId = decoded.args.linkId;

    // Mint tokens to contractor
    await ownerClient.writeContract({
      address: mockTokenAddress,
      abi: mockTokenArtifact.abi,
      functionName: "mint",
      args: [contractor.address, amount],
    });

    // Approve PaymeeRouter
    await contractorClient.writeContract({
      address: mockTokenAddress,
      abi: mockTokenArtifact.abi,
      functionName: "approve",
      args: [paymeeRouterAddress, amount],
    });

    // Get quote
    const quote = await publicClient.readContract({
      address: paymeeRouterAddress,
      abi: paymeeRouterArtifact.abi,
      functionName: "quote",
      args: [linkId, options],
    });

    // Process payment
    await contractorClient.writeContract({
      address: paymeeRouterAddress,
      abi: paymeeRouterArtifact.abi,
      functionName: "processPayment",
      args: [linkId, freelancerSolanaAddr, options],
      value: quote[0], // assuming quote.nativeFee is the first return value
    });

    // Check processedPayments
    const isProcessed = await publicClient.readContract({
      address: paymeeRouterAddress,
      abi: paymeeRouterArtifact.abi,
      functionName: "processedPayments",
      args: [linkId],
    });
    expect(isProcessed).to.equal(true);

    // Try double payment, expect revert
    let reverted = false;
    try {
      await contractorClient.writeContract({
        address: paymeeRouterAddress,
        abi: paymeeRouterArtifact.abi,
        functionName: "processPayment",
        args: [linkId, freelancerSolanaAddr, options],
        value: quote[0],
      });
    } catch (err: any) {
      reverted = true;
      expect(err.message).to.include("Already processed");
    }
    expect(reverted).to.equal(true);
  });
});

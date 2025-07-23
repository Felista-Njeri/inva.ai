import { Plugin, IAgentRuntime, Memory, Action, HandlerCallback } from "@elizaos/core";
import { ethers } from "ethers";

// Smart contract ABIs (simplified for key functions)
const INVOICE_ESCROW_ABI = [
  "function createInvoice(address client, uint256 amount, address token, tuple(uint256,uint256,uint256,bool,address) terms, string ipfsHash) external returns (uint256)",
  "function makePayment(uint256 invoiceId) external payable",
  "function approveInvoice(uint256 invoiceId) external",
  "function raiseDispute(uint256 invoiceId, string reason) external",
  "function resolveDispute(uint256 invoiceId, bool favorProvider) external",
  "function getInvoice(uint256 invoiceId) external view returns (tuple(uint256,address,address,uint256,address,tuple(uint256,uint256,uint256,bool,address),uint8,uint256,uint256,uint256,string))",
  "function getProviderInvoices(address provider) external view returns (uint256[])",
  "function getClientInvoices(address client) external view returns (uint256[])",
  "event InvoiceCreated(uint256 indexed invoiceId, address indexed provider, address indexed client, uint256 amount, address token, string ipfsHash)",
  "event PaymentMade(uint256 indexed invoiceId, address indexed payer, uint256 amount, uint256 actualAmount, bool earlyPayment)",
  "event FundsReleased(uint256 indexed invoiceId, address indexed recipient, uint256 amount, uint256 platformFee)",
  "event DisputeRaised(uint256 indexed invoiceId, address indexed initiator, string reason)",
  "event DisputeResolved(uint256 indexed invoiceId, address indexed resolver, bool favorProvider)"
];

interface SmartContractConfig {
  rpcUrl: string;
  contractAddress: string;
  privateKey: string;
  chainId: number;
}

interface InvoiceData {
  id: number;
  provider: string;
  client: string;
  amount: string;
  token: string;
  status: number;
  terms: PaymentTerms;
  createdAt: number;
  dueDate: number;
  ipfsHash: string;
}

interface PaymentTerms {
  paymentWindow: number;
  earlyPaymentDiscountBps: number;
  earlyPaymentDeadline: number;
  requiresApproval: boolean;
  arbitrator: string;
}

class SmartContractService {
  private provider: ethers.Provider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;
  private _config: SmartContractConfig;

  constructor(config: SmartContractConfig) {
    this._config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.contractAddress,
      INVOICE_ESCROW_ABI,
      this.signer
    );
  }

  async createInvoice(
    clientAddress: string,
    amount: string,
    tokenAddress: string,
    terms: PaymentTerms,
    ipfsHash: string
  ): Promise<{ invoiceId: number; txHash: string }> {
    try {
      const amountWei = ethers.parseUnits(amount, tokenAddress === ethers.ZeroAddress ? 18 : 6);
      
      const termsArray = [
        terms.paymentWindow,
        terms.earlyPaymentDiscountBps,
        terms.earlyPaymentDeadline,
        terms.requiresApproval,
        terms.arbitrator
      ];

      const tx = await this.contract.createInvoice(
        clientAddress,
        amountWei,
        tokenAddress,
        termsArray,
        ipfsHash
      );

      const receipt = await tx.wait();
      
      // Parse the InvoiceCreated event to get the invoice ID
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id("InvoiceCreated(uint256,address,address,uint256,address,string)")
      );
      
      const invoiceId = parseInt(event.topics[1], 16);

      return {
        invoiceId,
        txHash: receipt.hash
      };
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  async getInvoice(invoiceId: number): Promise<InvoiceData> {
    try {
      const invoice = await this.contract.getInvoice(invoiceId);
      
      return {
        id: invoice[0],
        provider: invoice[1],
        client: invoice[2],
        amount: ethers.formatUnits(invoice[3], invoice[4] === ethers.ZeroAddress ? 18 : 6),
        token: invoice[4],
        status: invoice[6],
        terms: {
          paymentWindow: invoice[5][0],
          earlyPaymentDiscountBps: invoice[5][1],
          earlyPaymentDeadline: invoice[5][2],
          requiresApproval: invoice[5][3],
          arbitrator: invoice[5][4]
        },
        createdAt: invoice[7],
        dueDate: invoice[8],
        ipfsHash: invoice[10]
      };
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }
  }

  async getUserInvoices(userAddress: string, type: 'provider' | 'client'): Promise<number[]> {
    try {
      const invoiceIds = type === 'provider' 
        ? await this.contract.getProviderInvoices(userAddress)
        : await this.contract.getClientInvoices(userAddress);
      
      return invoiceIds.map((id: any) => parseInt(id.toString()));
    } catch (error) {
      console.error("Error fetching user invoices:", error);
      throw new Error(`Failed to fetch user invoices: ${error.message}`);
    }
  }

  async makePayment(invoiceId: number, amount?: string): Promise<string> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      const paymentAmount = amount || invoice.amount;
      
      let tx;
      if (invoice.token === ethers.ZeroAddress) {
        // Native SEI payment
        const amountWei = ethers.parseEther(paymentAmount);
        tx = await this.contract.makePayment(invoiceId, { value: amountWei });
      } else {
        // ERC20 token payment (requires pre-approval)
        tx = await this.contract.makePayment(invoiceId);
      }

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error making payment:", error);
      throw new Error(`Failed to make payment: ${error.message}`);
    }
  }

  async approveInvoice(invoiceId: number): Promise<string> {
    try {
      const tx = await this.contract.approveInvoice(invoiceId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error approving invoice:", error);
      throw new Error(`Failed to approve invoice: ${error.message}`);
    }
  }

  async raiseDispute(invoiceId: number, reason: string): Promise<string> {
    try {
      const tx = await this.contract.raiseDispute(invoiceId, reason);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error raising dispute:", error);
      throw new Error(`Failed to raise dispute: ${error.message}`);
    }
  }

  async resolveDispute(invoiceId: number, favorProvider: boolean): Promise<string> {
    try {
      const tx = await this.contract.resolveDispute(invoiceId, favorProvider);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Error resolving dispute:", error);
      throw new Error(`Failed to resolve dispute: ${error.message}`);
    }
  }

  async listenToEvents(callback: (event: any) => void): Promise<void> {
    // Listen to all invoice-related events
    const eventFilters = [
      this.contract.filters.InvoiceCreated(),
      this.contract.filters.PaymentMade(),
      this.contract.filters.FundsReleased(),
      this.contract.filters.DisputeRaised(),
      this.contract.filters.DisputeResolved()
    ];

    eventFilters.forEach(filter => {
      this.contract.on(filter, callback);
    });
  }
}

// ElizaOS Actions
const createInvoiceAction: Action = {
  name: "CREATE_INVOICE",
  similes: [
    "create invoice",
    "generate invoice", 
    "make invoice",
    "new invoice",
    "invoice creation"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || "";
    return text.includes("create") && text.includes("invoice");
  },
  description: "Creates a new invoice on the blockchain",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const config = runtime.getSetting("SMART_CONTRACT_CONFIG") as SmartContractConfig;
      const service = new SmartContractService(config);

      // Extract invoice parameters from message (simplified parsing)
      const params = extractInvoiceParams(message.content.text || "");
      
      const result = await service.createInvoice(
        params.clientAddress,
        params.amount,
        params.tokenAddress || ethers.ZeroAddress,
        params.terms,
        params.ipfsHash || ""
      );

      callback({
        text: `✅ Invoice created successfully!\n\n**Invoice ID:** ${result.invoiceId}\n**Transaction:** ${result.txHash}\n**Amount:** ${params.amount} ${params.token || 'SEI'}\n**Payment Terms:** Net ${params.terms.paymentWindow / (24 * 60 * 60)} days\n\nThe invoice has been deployed to the blockchain and is ready for payment.`,
        action: "CREATE_INVOICE_SUCCESS",
        data: result
      });
    } catch (error) {
      callback({
        text: `❌ Failed to create invoice: ${error.message}`,
        action: "CREATE_INVOICE_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Create an invoice for $5000 to client 0x742d35Cc..." }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll create that invoice for you right away. Let me process the blockchain transaction...",
          action: "CREATE_INVOICE"
        }
      }
    ]
  ]
};

const getInvoiceAction: Action = {
  name: "GET_INVOICE",
  similes: [
    "get invoice",
    "check invoice",
    "invoice status",
    "show invoice",
    "invoice details"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || "";
    return (text.includes("get") || text.includes("check") || text.includes("show")) && 
           text.includes("invoice");
  },
  description: "Retrieves invoice details from the blockchain",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const config = runtime.getSetting("SMART_CONTRACT_CONFIG") as SmartContractConfig;
      const service = new SmartContractService(config);

      const invoiceId = extractInvoiceId(message.content.text || "");
      const invoice = await service.getInvoice(invoiceId);

      const statusText = getStatusText(invoice.status);
      const daysUntilDue = Math.ceil((invoice.dueDate * 1000 - Date.now()) / (1000 * 60 * 60 * 24));

      callback({
        text: `📋 **Invoice #${invoice.id}**\n\n**Amount:** ${invoice.amount} ${getTokenSymbol(invoice.token)}\n**Status:** ${statusText}\n**Provider:** ${invoice.provider}\n**Client:** ${invoice.client}\n**Payment Terms:** Net ${invoice.terms.paymentWindow / (24 * 60 * 60)} days\n**Days Until Due:** ${daysUntilDue}\n**Early Payment Discount:** ${invoice.terms.earlyPaymentDiscountBps / 100}%\n\nNeed help with next steps? I can assist with payments, approvals, or dispute resolution.`,
        action: "GET_INVOICE_SUCCESS",
        data: invoice
      });
    } catch (error) {
      callback({
        text: `❌ Failed to retrieve invoice: ${error.message}`,
        action: "GET_INVOICE_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Show me invoice #123" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "Let me fetch the details for invoice #123...",
          action: "GET_INVOICE"
        }
      }
    ]
  ]
};

// Helper functions
function extractInvoiceParams(text: string): any {
  // Simple parameter extraction (you can enhance this with better NLP)
  const amountMatch = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
  
  return {
    amount: amountMatch ? amountMatch[1].replace(',', '') : "1000",
    clientAddress: addressMatch ? addressMatch[0] : ethers.ZeroAddress,
    tokenAddress: ethers.ZeroAddress, // Default to native SEI
    terms: {
      paymentWindow: 30 * 24 * 60 * 60, // 30 days
      earlyPaymentDiscountBps: 200, // 2%
      earlyPaymentDeadline: 0,
      requiresApproval: false,
      arbitrator: ethers.ZeroAddress
    },
    ipfsHash: "QmDefaultHash123"
  };
}

function extractInvoiceId(text: string): number {
  const match = text.match(/#?(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function getStatusText(status: number): string {
  const statuses = [
    "Created", "Paid", "Approved", "Completed", 
    "Disputed", "Cancelled", "Refunded"
  ];
  return statuses[status] || "Unknown";
}

function getTokenSymbol(tokenAddress: string): string {
  if (tokenAddress === ethers.ZeroAddress) return "SEI";
  // Add token address to symbol mapping
  return "TOKEN";
}

export const smartContractPlugin: Plugin = {
  name: "smartContract",
  description: "Handles blockchain interactions for invoice management",
  actions: [createInvoiceAction, getInvoiceAction],
  evaluators: [],
  providers: []
};
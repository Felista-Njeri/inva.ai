import { Plugin, IAgentRuntime, Memory, Action, Evaluator, HandlerCallback } from "@elizaos/core";
import { ethers } from "ethers";
import BlockchainService from '../../src/services/blockchainService.ts';
import contractData from '../../src/services/sei-testnet.json';

interface InvoiceRequest {
  clientAddress: string;
  amount: string;
  currency: string;
  description: string;
  paymentTerms?: {
    paymentWindow?: number; // days
    earlyPaymentDiscountBps?: number;
    requiresApproval?: boolean;
  };
  dueDate?: string;
  metadata?: any;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  defaultTerms: PaymentTerms;
  lineItems: LineItem[];
  customFields: CustomField[];
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

interface CustomField {
  name: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

interface PaymentTerms {
  paymentWindow: number;
  earlyPaymentDiscountBps: number;
  requiresApproval: boolean;
  currency: string;
}

class InvoiceService {
  private runtime: IAgentRuntime;
  private templates: Map<string, InvoiceTemplate> = new Map();
  private blockchainService: BlockchainService;
  
  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
    
    // Initialize blockchain service with environment variables
    this.blockchainService = new BlockchainService({
      rpcUrl: process.env.SEI_RPC_URL || 'https://evm-rpc-testnet.sei-apis.com',
      privateKey: process.env.PRIVATE_KEY!,
      contractAddress: contractData.contracts.InvoiceEscrow,
      chainId: parseInt(process.env.CHAIN_ID || '1328')
    });
    
    this.initializeService();
    this.initializeDefaultTemplates();
  }
  
  async initializeService(): Promise<void> {
    try {
      await this.blockchainService.initialize();
      console.log('✅ InvoiceService initialized with blockchain connection');
    } catch (error) {
      console.error('❌ Failed to initialize InvoiceService:', error);
    }
  }

  // Constructor moved above - this duplicate removed

  private initializeDefaultTemplates() {
    // Web Development Template
    this.templates.set('web-dev', {
      id: 'web-dev',
      name: 'Web Development Services',
      description: 'Template for web development projects',
      defaultTerms: {
        paymentWindow: 30,
        earlyPaymentDiscountBps: 200, // 2%
        requiresApproval: false,
        currency: 'USD'
      },
      lineItems: [
        {
          description: 'Frontend Development',
          quantity: 1,
          unitPrice: 0,
          total: 0,
          category: 'development'
        },
        {
          description: 'Backend Development',
          quantity: 1,
          unitPrice: 0,
          total: 0,
          category: 'development'
        }
      ],
      customFields: [
        { name: 'Project Name', value: '', type: 'text' },
        { name: 'Completion Date', value: '', type: 'date' },
        { name: 'Repository URL', value: '', type: 'text' }
      ]
    });

    // Consulting Template
    this.templates.set('consulting', {
      id: 'consulting',
      name: 'Consulting Services',
      description: 'Template for consulting work',
      defaultTerms: {
        paymentWindow: 15,
        earlyPaymentDiscountBps: 300, // 3%
        requiresApproval: true,
        currency: 'USD'
      },
      lineItems: [
        {
          description: 'Consulting Hours',
          quantity: 0,
          unitPrice: 150,
          total: 0,
          category: 'consulting'
        }
      ],
      customFields: [
        { name: 'Consultation Period', value: '', type: 'text' },
        { name: 'Deliverables', value: '', type: 'text' }
      ]
    });

    // Design Template
    this.templates.set('design', {
      id: 'design',
      name: 'Design Services',
      description: 'Template for design projects',
      defaultTerms: {
        paymentWindow: 21,
        earlyPaymentDiscountBps: 250, // 2.5%
        requiresApproval: false,
        currency: 'USD'
      },
      lineItems: [
        {
          description: 'Design Concepts',
          quantity: 1,
          unitPrice: 0,
          total: 0,
          category: 'design'
        },
        {
          description: 'Revisions',
          quantity: 3,
          unitPrice: 0,
          total: 0,
          category: 'design'
        }
      ],
      customFields: [
        { name: 'Design Type', value: '', type: 'text' },
        { name: 'Brand Guidelines', value: '', type: 'text' }
      ]
    });
  }

  async generateInvoiceFromDescription(description: string): Promise<InvoiceRequest> {
    try {
      // Simple parsing logic - can be enhanced with better NLP
      const amount = this.extractAmount(description);
      const serviceType = this.detectServiceType(description);
      const template = this.templates.get(serviceType) || this.templates.get('web-dev');
      
      return {
        clientAddress: ethers.ZeroAddress, // Will be set later
        amount: amount.toString(),
        currency: template!.defaultTerms.currency,
        description: description,
        paymentTerms: {
          paymentWindow: template!.defaultTerms.paymentWindow,
          earlyPaymentDiscountBps: template!.defaultTerms.earlyPaymentDiscountBps,
          requiresApproval: template!.defaultTerms.requiresApproval
        },
        metadata: {
          template: serviceType,
          generatedAt: Date.now(),
          aiGenerated: true
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate invoice from description: ${error.message}`);
    }
  }

  private extractAmount(description: string): number {
    // Extract amount from description
    const amountRegex = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;
    const match = description.match(amountRegex);
    
    if (match) {
      return parseFloat(match[1].replace(',', ''));
    }
    
    // Default amount based on service type
    if (description.toLowerCase().includes('consulting')) return 1500;
    if (description.toLowerCase().includes('design')) return 2500;
    if (description.toLowerCase().includes('development')) return 5000;
    
    return 1000; // Default
  }

  private detectServiceType(description: string): string {
    const text = description.toLowerCase();
    
    if (text.includes('web') || text.includes('app') || text.includes('development') || text.includes('coding')) {
      return 'web-dev';
    }
    if (text.includes('consult') || text.includes('advice') || text.includes('strategy')) {
      return 'consulting';
    }
    if (text.includes('design') || text.includes('logo') || text.includes('brand') || text.includes('ui')) {
      return 'design';
    }
    
    return 'web-dev'; // Default
  }

  async optimizePaymentTerms(
    baseTerms: PaymentTerms,
    clientHistory?: any,
    projectContext?: any
  ): Promise<PaymentTerms> {
    const optimizedTerms = { ...baseTerms };

    // Adjust based on client history
    if (clientHistory) {
      if (clientHistory.paymentReliabilityScore > 90) {
        // Excellent client - offer better terms
        optimizedTerms.paymentWindow = Math.min(optimizedTerms.paymentWindow + 15, 60);
        optimizedTerms.earlyPaymentDiscountBps = Math.max(optimizedTerms.earlyPaymentDiscountBps - 50, 100);
      } else if (clientHistory.paymentReliabilityScore < 60) {
        // Risky client - stricter terms
        optimizedTerms.paymentWindow = Math.max(optimizedTerms.paymentWindow - 10, 15);
        optimizedTerms.requiresApproval = true;
      }
    }

    // Adjust based on project context
    if (projectContext) {
      if (projectContext.urgency === 'high') {
        optimizedTerms.earlyPaymentDiscountBps += 100; // Extra incentive for urgent projects
      }
      if (projectContext.amount > 10000) {
        optimizedTerms.requiresApproval = true; // Large amounts require approval
      }
    }

    return optimizedTerms;
  }

  async createDetailedInvoice(request: InvoiceRequest): Promise<any> {
    try {
      console.log('📝 Creating blockchain invoice...', request);
      
      // Validate the request
      const validation = await this.validateInvoiceData(request);
      if (!validation.valid) {
        throw new Error(`Invalid invoice data: ${validation.errors.join(', ')}`);
      }
      
      const template = this.templates.get(request.metadata?.template || 'web-dev');
      
      // Prepare payment terms for blockchain
      const paymentWindow = request.paymentTerms?.paymentWindow || 30;
      const earlyPaymentDiscountBps = request.paymentTerms?.earlyPaymentDiscountBps || 200;
      const requiresApproval = request.paymentTerms?.requiresApproval || false;
      
      // Calculate early payment deadline (half of payment window)
      const earlyPaymentDeadline = Math.floor(Date.now() / 1000) + (paymentWindow * 24 * 60 * 60 / 2);
      
      // Get token address (default to zero address for native SEI)
      const tokenAddress = request.currency === 'USDC' 
        ? contractData.config.supportedTokens.USDC 
        : ethers.ZeroAddress;
      
      // Create IPFS metadata
      const ipfsData = {
        title: `Invoice for ${request.description}`,
        description: request.description,
        amount: request.amount,
        currency: request.currency,
        clientAddress: request.clientAddress,
        paymentTerms: {
          paymentWindow,
          earlyPaymentDiscountBps,
          requiresApproval
        },
        lineItems: this.generateLineItems(request, template),
        createdAt: new Date().toISOString(),
        template: template?.name
      };
      
      // For now, use a mock IPFS hash (in production, upload to IPFS)
      const ipfsHash = `QmMock${Date.now()}`;
      
      // Create invoice on blockchain
      const blockchainParams = {
        clientAddress: request.clientAddress,
        amount: request.amount,
        token: tokenAddress,
        paymentTerms: {
          paymentWindow: paymentWindow,
          earlyPaymentDiscountBps: earlyPaymentDiscountBps,
          earlyPaymentDeadline: earlyPaymentDeadline,
          requiresApproval: requiresApproval,
          arbitrator: contractData.deployer // Use deployer as arbitrator
        },
        ipfsHash: ipfsHash
      };
      
      console.log('🔗 Calling blockchain service...', blockchainParams);
      const blockchainResult = await this.blockchainService.createInvoice(blockchainParams);
      
      const invoice = {
        id: blockchainResult.invoiceId,
        txHash: blockchainResult.txHash,
        clientAddress: request.clientAddress,
        amount: parseFloat(request.amount),
        currency: request.currency,
        description: request.description,
        paymentTerms: {
          paymentWindow,
          earlyPaymentDiscountBps,
          requiresApproval
        },
        lineItems: this.generateLineItems(request, template),
        metadata: {
          ...request.metadata,
          template: template?.name,
          createdAt: new Date().toISOString(),
          dueDate: this.calculateDueDate(paymentWindow),
          blockchain: {
            contractAddress: contractData.contracts.InvoiceEscrow,
            network: 'sei-testnet',
            chainId: 1328
          }
        },
        ipfsData,
        ipfsHash,
        onChain: true
      };
      
      console.log('✅ Invoice created on blockchain:', invoice);
      return invoice;
      
    } catch (error) {
      console.error('❌ Error creating blockchain invoice:', error);
      
      // Fallback to off-chain invoice for demo purposes
      console.log('📝 Creating fallback off-chain invoice...');
      return this.createOffChainInvoice(request);
    }
  }
  
  private async createOffChainInvoice(request: InvoiceRequest): Promise<any> {
    const template = this.templates.get(request.metadata?.template || 'web-dev');
    
    const invoice = {
      id: Date.now(),
      clientAddress: request.clientAddress,
      amount: parseFloat(request.amount),
      currency: request.currency,
      description: request.description,
      paymentTerms: request.paymentTerms,
      lineItems: this.generateLineItems(request, template),
      metadata: {
        ...request.metadata,
        template: template?.name,
        createdAt: new Date().toISOString(),
        dueDate: this.calculateDueDate(request.paymentTerms?.paymentWindow || 30)
      },
      onChain: false
    };
    
    return invoice;
  }

  private generateLineItems(request: InvoiceRequest, template?: InvoiceTemplate): LineItem[] {
    const amount = parseFloat(request.amount);
    
    if (template) {
      // Use template line items and distribute amount
      const items = template.lineItems.map(item => ({
        ...item,
        total: amount / template.lineItems.length
      }));
      return items;
    }

    // Default single line item
    return [{
      description: request.description,
      quantity: 1,
      unitPrice: amount,
      total: amount,
      category: 'service'
    }];
  }

  private calculateDueDate(paymentWindowDays: number): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentWindowDays);
    return dueDate.toISOString();
  }

  getTemplate(templateId: string): InvoiceTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): InvoiceTemplate[] {
    return Array.from(this.templates.values());
  }

  async validateInvoiceData(request: InvoiceRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!request.clientAddress || request.clientAddress === ethers.ZeroAddress) {
      errors.push("Client address is required");
    }

    if (!request.amount || parseFloat(request.amount) <= 0) {
      errors.push("Amount must be greater than 0");
    }

    if (!request.description || request.description.trim().length === 0) {
      errors.push("Description is required");
    }

    // Validate Ethereum address format
    if (request.clientAddress && !ethers.isAddress(request.clientAddress)) {
      errors.push("Invalid client address format");
    }

    // Validate payment terms
    if (request.paymentTerms) {
      if (request.paymentTerms.paymentWindow && request.paymentTerms.paymentWindow > 90) {
        errors.push("Payment window cannot exceed 90 days");
      }
      if (request.paymentTerms.earlyPaymentDiscountBps && request.paymentTerms.earlyPaymentDiscountBps > 1000) {
        errors.push("Early payment discount cannot exceed 10%");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ElizaOS Actions
const generateInvoiceAction: Action = {
  name: "GENERATE_INVOICE",
  description: "Generates a detailed invoice from a service description",
  similes: [
    "generate invoice",
    "create invoice from description",
    "make invoice for",
    "invoice for services",
    "bill client for"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    console.log('🔍 Validating invoice action for text:', text);
    const isMatch = (text.includes("generate") || text.includes("create") || text.includes("make") || text.includes("invoice for")) && 
           text.includes("invoice");
    console.log('✅ Invoice action validation result:', isMatch);
    return isMatch;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      console.log('📧 GENERATE_INVOICE action handler called!');
      console.log('📝 Message text:', message.content.text);
      
      const invoiceService = new InvoiceService(runtime);
      
      // Extract description from message
      const description = extractServiceDescription(message.content.text || '');
      
      // Generate invoice request
      const invoiceRequest = await invoiceService.generateInvoiceFromDescription(description);
      
      // Create detailed invoice
      const detailedInvoice = await invoiceService.createDetailedInvoice(invoiceRequest);
      
      // Validate invoice data
      const validation = await invoiceService.validateInvoiceData(invoiceRequest);
      
      if (!validation.valid) {
        callback({
          text: `❌ **Invoice Generation Issues:**\n\n${validation.errors.map(e => `• ${e}`).join('\n')}\n\nPlease provide more details and try again.`,
          action: "GENERATE_INVOICE_ERROR",
          data: { errors: validation.errors }
        });
        return;
      }

      const responseText = `📋 **Invoice Generated Successfully!**\n\n` +
        `**Service:** ${detailedInvoice.description}\n` +
        `**Amount:** $${detailedInvoice.amount.toLocaleString()} ${detailedInvoice.currency}\n` +
        `**Payment Terms:** Net ${detailedInvoice.paymentTerms.paymentWindow} days\n` +
        `**Early Payment Discount:** ${detailedInvoice.paymentTerms.earlyPaymentDiscountBps / 100}%\n` +
        `**Template Used:** ${detailedInvoice.metadata.template}\n\n` +
        `**Line Items:**\n${detailedInvoice.lineItems.map((item: LineItem) => 
          `• ${item.description}: $${item.total.toLocaleString()}`
        ).join('\n')}\n\n` +
        `**Next Steps:**\n` +
        `1. Provide client address to deploy to blockchain\n` +
        `2. Review and modify terms if needed\n` +
        `3. Send invoice to client\n\n` +
        `Would you like me to deploy this invoice to the blockchain?`;

      callback({
        text: responseText,
        action: "GENERATE_INVOICE_SUCCESS",
        data: detailedInvoice
      });

    } catch (error) {
      callback({
        text: `❌ Failed to generate invoice: ${error.message}`,
        action: "GENERATE_INVOICE_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Generate an invoice for web development services worth $5000" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll generate a detailed invoice for your web development services...",
          action: "GENERATE_INVOICE"
        }
      }
    ]
  ]
};

const listTemplatesAction: Action = {
  name: "LIST_TEMPLATES",
  similes: [
    "show templates",
    "list invoice templates",
    "available templates",
    "invoice types",
    "template options"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes("template") && (
      text.includes("list") || text.includes("show") || text.includes("available")
    );
  },
  description: "Lists available invoice templates",
  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const invoiceService = new InvoiceService(runtime);
      const templates = invoiceService.getAllTemplates();

      const responseText = `📋 **Available Invoice Templates:**\n\n` +
        templates.map(template => 
          `**${template.name}** (${template.id})\n` +
          `• ${template.description}\n` +
          `• Default Terms: Net ${template.defaultTerms.paymentWindow} days\n` +
          `• Early Discount: ${template.defaultTerms.earlyPaymentDiscountBps / 100}%\n` +
          `• Requires Approval: ${template.defaultTerms.requiresApproval ? 'Yes' : 'No'}\n`
        ).join('\n') +
        `\n**Usage:** Mention the service type in your invoice description, and I'll automatically select the best template!`;

      callback({
        text: responseText,
        action: "LIST_TEMPLATES_SUCCESS",
        data: { templates }
      });

    } catch (error) {
      callback({
        text: `❌ Failed to retrieve templates: ${error.message}`,
        action: "LIST_TEMPLATES_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Show me available invoice templates" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "Here are the available invoice templates...",
          action: "LIST_TEMPLATES"
        }
      }
    ]
  ]
};

const optimizeTermsAction: Action = {
  name: "OPTIMIZE_TERMS",
  similes: [
    "optimize payment terms",
    "suggest better terms",
    "improve payment conditions",
    "recommend terms",
    "best payment terms"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes("optimize") || text.includes("suggest") || text.includes("recommend") &&
           (text.includes("terms") || text.includes("payment"));
  },
  description: "Optimizes payment terms based on client history and project context",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: any,
    options: any,
    callback: HandlerCallback
  ) => {
    try {
      const invoiceService = new InvoiceService(runtime);
      
      // Extract context from message
      const context = extractOptimizationContext(message.content.text || '');
      
      // Mock client history (in real app, fetch from database)
      const mockClientHistory = {
        paymentReliabilityScore: 75,
        averagePaymentDelay: 5,
        totalVolume: 25000,
        numberOfInvoices: 8
      };

      const baseTerms: PaymentTerms = {
        paymentWindow: 30,
        earlyPaymentDiscountBps: 200,
        requiresApproval: false,
        currency: 'USD'
      };

      const optimizedTerms = await invoiceService.optimizePaymentTerms(
        baseTerms,
        mockClientHistory,
        context
      );

      const responseText = `🎯 **Optimized Payment Terms:**\n\n` +
        `**Current Recommendation:**\n` +
        `• Payment Window: Net ${optimizedTerms.paymentWindow} days\n` +
        `• Early Payment Discount: ${optimizedTerms.earlyPaymentDiscountBps / 100}%\n` +
        `• Requires Approval: ${optimizedTerms.requiresApproval ? 'Yes' : 'No'}\n\n` +
        `**Optimization Factors:**\n` +
        `• Client Reliability Score: ${mockClientHistory.paymentReliabilityScore}%\n` +
        `• Average Payment Delay: ${mockClientHistory.averagePaymentDelay} days\n` +
        `• Project Context: ${context.urgency || 'Standard'} priority\n\n` +
        `**Business Impact:**\n` +
        `• Expected payment time: ${optimizedTerms.paymentWindow - 5} days\n` +
        `• Cash flow improvement: ${optimizedTerms.earlyPaymentDiscountBps > 200 ? 'High' : 'Medium'}\n` +
        `• Risk level: ${optimizedTerms.requiresApproval ? 'Low' : 'Very Low'}\n\n` +
        `These terms balance cash flow optimization with client relationship management.`;

      callback({
        text: responseText,
        action: "OPTIMIZE_TERMS_SUCCESS",
        data: { optimizedTerms, clientHistory: mockClientHistory }
      });

    } catch (error) {
      callback({
        text: `❌ Failed to optimize terms: ${error.message}`,
        action: "OPTIMIZE_TERMS_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Optimize payment terms for a $10,000 urgent project" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll analyze the optimal payment terms for your project...",
          action: "OPTIMIZE_TERMS"
        }
      }
    ]
  ]
};

// Helper functions
function extractServiceDescription(text: string): string {
  // Remove command words and extract the core description
  const cleanText = text
    .replace(/^(generate|create|make)\s+invoice\s+(for\s+)?/i, '')
    .trim();
  
  return cleanText || "Professional services";
}

function extractOptimizationContext(text: string): any {
  const context: any = {};
  
  // Extract urgency
  if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('rush')) {
    context.urgency = 'high';
  }
  
  // Extract amount
  const amountMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  if (amountMatch) {
    context.amount = parseFloat(amountMatch[1].replace(',', ''));
  }
  
  return context;
}

// Evaluator for tracking invoice success
const invoiceSuccessEvaluator: Evaluator = {
  name: "INVOICE_SUCCESS",
  similes: ["invoice created", "invoice generated", "billing success"],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return message.content.action === "GENERATE_INVOICE_SUCCESS";
  },
  description: "Evaluates successful invoice generation",
  handler: async (runtime: IAgentRuntime, message: Memory) => {
    // Evaluators don't need to return anything in ElizaOS
    return;
  },
  examples: []
};

export const invoicePlugin: Plugin = {
  name: "invoice",
  description: "Handles intelligent invoice generation and management with templates and optimization",
  actions: [generateInvoiceAction, listTemplatesAction, optimizeTermsAction],
  evaluators: [invoiceSuccessEvaluator],
  providers: []
};
import { Plugin, IAgentRuntime, Memory, Action, Evaluator, HandlerCallback } from "@elizaos/core";
import { ethers } from "ethers";

interface PaymentRequest {
  invoiceId: number;
  payerAddress: string;
  amount: string;
  currency: string;
  paymentMethod: 'native' | 'erc20';
  gasPreference?: 'fast' | 'standard' | 'slow';
}

interface PaymentStatus {
  invoiceId: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'refunded';
  txHash?: string;
  amount: string;
  currency: string;
  paidAt?: number;
  confirmations?: number;
  gasUsed?: string;
  gasPrice?: string;
  earlyPayment?: boolean;
  discountApplied?: string;
}

interface PaymentAnalytics {
  totalProcessed: string;
  averagePaymentTime: number;
  earlyPaymentRate: number;
  failureRate: number;
  gasEfficiency: number;
  currencyBreakdown: Record<string, string>;
}

interface ExchangeRates {
  [currency: string]: number;
}

class PaymentService {
  private exchangeRates: ExchangeRates = {};
  private paymentHistory: Map<number, PaymentStatus> = new Map();

  constructor(_runtime: IAgentRuntime) {
    this.initializeExchangeRates();
  }

  private initializeExchangeRates() {
    // Mock exchange rates (in real app, fetch from API)
    this.exchangeRates = {
      'USD': 1.0,
      'SEI': 0.15, // 1 SEI = $0.15
      'USDC': 1.0,
      'USDT': 1.0,
      'ETH': 2400,
      'BTC': 45000
    };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentStatus> {
    try {
      console.log(`Processing payment for invoice ${request.invoiceId}`);
      
      // Validate payment request
      const validation = await this.validatePaymentRequest(request);
      if (!validation.valid) {
        throw new Error(`Payment validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for early payment discount
      const earlyPaymentInfo = await this.checkEarlyPaymentDiscount(request.invoiceId);
      
      // Calculate final amount
      const finalAmount = earlyPaymentInfo.eligible 
        ? this.applyDiscount(request.amount, earlyPaymentInfo.discountBps)
        : request.amount;

      // Create payment status
      const paymentStatus: PaymentStatus = {
        invoiceId: request.invoiceId,
        status: 'processing',
        amount: finalAmount,
        currency: request.currency,
        earlyPayment: earlyPaymentInfo.eligible,
        discountApplied: earlyPaymentInfo.eligible ? earlyPaymentInfo.discountBps.toString() : undefined
      };

      // Simulate blockchain transaction
      const txResult = await this.executeBlockchainPayment(request, finalAmount);
      
      paymentStatus.txHash = txResult.hash;
      paymentStatus.status = 'confirmed';
      paymentStatus.paidAt = Date.now();
      paymentStatus.confirmations = txResult.confirmations;
      paymentStatus.gasUsed = txResult.gasUsed;
      paymentStatus.gasPrice = txResult.gasPrice;

      // Store payment history
      this.paymentHistory.set(request.invoiceId, paymentStatus);

      return paymentStatus;

    } catch (error) {
      const failedStatus: PaymentStatus = {
        invoiceId: request.invoiceId,
        status: 'failed',
        amount: request.amount,
        currency: request.currency
      };
      
      this.paymentHistory.set(request.invoiceId, failedStatus);
      throw error;
    }
  }

  private async validatePaymentRequest(request: PaymentRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!request.invoiceId || request.invoiceId <= 0) {
      errors.push("Invalid invoice ID");
    }

    if (!request.payerAddress || !ethers.isAddress(request.payerAddress)) {
      errors.push("Invalid payer address");
    }

    if (!request.amount || parseFloat(request.amount) <= 0) {
      errors.push("Invalid payment amount");
    }

    if (!request.currency) {
      errors.push("Currency is required");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async checkEarlyPaymentDiscount(_invoiceId: number): Promise<{
    eligible: boolean;
    discountBps: number;
    deadline?: number;
  }> {
    // In real app, fetch from smart contract or database
    // Mock early payment check
    const mockInvoice = {
      createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
      paymentWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
      earlyPaymentDiscountBps: 200, // 2%
      earlyPaymentDeadline: 10 * 24 * 60 * 60 * 1000 // 10 days for discount
    };

    const timeElapsed = Date.now() - mockInvoice.createdAt;
    const isEarlyPayment = timeElapsed <= mockInvoice.earlyPaymentDeadline;

    return {
      eligible: isEarlyPayment && mockInvoice.earlyPaymentDiscountBps > 0,
      discountBps: mockInvoice.earlyPaymentDiscountBps,
      deadline: mockInvoice.createdAt + mockInvoice.earlyPaymentDeadline
    };
  }

  private applyDiscount(amount: string, discountBps: number): string {
    const amountNum = parseFloat(amount);
    const discountAmount = (amountNum * discountBps) / 10000;
    return (amountNum - discountAmount).toString();
  }

  private async executeBlockchainPayment(
    _request: PaymentRequest, 
    _finalAmount: string
  ): Promise<{
    hash: string;
    confirmations: number;
    gasUsed: string;
    gasPrice: string;
  }> {
    // In real app, this would interact with smart contracts
    // Mock blockchain transaction
    const mockTxHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      hash: mockTxHash,
      confirmations: 12,
      gasUsed: "85000",
      gasPrice: "20000000000" // 20 gwei
    };
  }

  async getPaymentStatus(invoiceId: number): Promise<PaymentStatus | null> {
    return this.paymentHistory.get(invoiceId) || null;
  }

  async getPaymentHistory(_userAddress: string): Promise<PaymentStatus[]> {
    // In real app, filter by user address
    return Array.from(this.paymentHistory.values());
  }

  async calculateOptimalGasPrice(): Promise<{
    slow: string;
    standard: string;
    fast: string;
    recommended: string;
  }> {
    // Mock gas price calculation (in real app, fetch from network)
    return {
      slow: "15000000000",     // 15 gwei
      standard: "25000000000", // 25 gwei  
      fast: "35000000000",     // 35 gwei
      recommended: "25000000000"
    };
  }

  async convertCurrency(
    amount: string, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<string> {
    const fromRate = this.exchangeRates[fromCurrency];
    const toRate = this.exchangeRates[toCurrency];
    
    if (!fromRate || !toRate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
    }
    
    const amountNum = parseFloat(amount);
    const usdAmount = amountNum * fromRate;
    const convertedAmount = usdAmount / toRate;
    
    return convertedAmount.toFixed(6);
  }

  async getPaymentAnalytics(_timeframe: '7d' | '30d' | '90d' = '30d'): Promise<PaymentAnalytics> {
    const payments = Array.from(this.paymentHistory.values());
    const confirmedPayments = payments.filter(p => p.status === 'confirmed');
    
    // Calculate metrics
    const totalProcessed = confirmedPayments
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
      .toString();
    
    const averagePaymentTime = confirmedPayments.length > 0
      ? confirmedPayments.reduce((sum, p) => sum + (p.paidAt || 0), 0) / confirmedPayments.length
      : 0;
    
    const earlyPayments = confirmedPayments.filter(p => p.earlyPayment).length;
    const earlyPaymentRate = confirmedPayments.length > 0 
      ? (earlyPayments / confirmedPayments.length) * 100 
      : 0;
    
    const failedPayments = payments.filter(p => p.status === 'failed').length;
    const failureRate = payments.length > 0 
      ? (failedPayments / payments.length) * 100 
      : 0;
    
    // Currency breakdown
    const currencyBreakdown: Record<string, string> = {};
    confirmedPayments.forEach(payment => {
      if (!currencyBreakdown[payment.currency]) {
        currencyBreakdown[payment.currency] = '0';
      }
      currencyBreakdown[payment.currency] = (
        parseFloat(currencyBreakdown[payment.currency]) + parseFloat(payment.amount)
      ).toString();
    });

    return {
      totalProcessed,
      averagePaymentTime,
      earlyPaymentRate,
      failureRate,
      gasEfficiency: 85, // Mock efficiency score
      currencyBreakdown
    };
  }

  async refundPayment(invoiceId: number, _reason: string): Promise<PaymentStatus> {
    const payment = this.paymentHistory.get(invoiceId);
    
    if (!payment) {
      throw new Error("Payment not found");
    }
    
    if (payment.status !== 'confirmed') {
      throw new Error("Can only refund confirmed payments");
    }

    // Mock refund transaction
    const refundTxHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
    
    const refundedPayment: PaymentStatus = {
      ...payment,
      status: 'refunded',
      txHash: refundTxHash
    };
    
    this.paymentHistory.set(invoiceId, refundedPayment);
    
    return refundedPayment;
  }

  async estimatePaymentFees(
    amount: string,
    _currency: string,
    paymentMethod: 'native' | 'erc20'
  ): Promise<{
    networkFee: string;
    platformFee: string;
    totalFees: string;
    estimatedTime: string;
  }> {
    const gasPrices = await this.calculateOptimalGasPrice();
    const gasUsed = paymentMethod === 'native' ? '21000' : '65000';
    
    const networkFeeWei = BigInt(gasPrices.recommended) * BigInt(gasUsed);
    const networkFeeEth = ethers.formatEther(networkFeeWei);
    
    // Convert to USD (mock conversion)
    const networkFeeUsd = (parseFloat(networkFeeEth) * 2400).toFixed(2); // ETH price mock
    
    const platformFeeRate = 0.005; // 0.5%
    const platformFee = (parseFloat(amount) * platformFeeRate).toFixed(2);
    
    const totalFees = (parseFloat(networkFeeUsd) + parseFloat(platformFee)).toFixed(2);
    
    return {
      networkFee: networkFeeUsd,
      platformFee,
      totalFees,
      estimatedTime: "< 1 minute" // Sei network speed
    };
  }
}

// ElizaOS Actions
const processPaymentAction: Action = {
  name: "PROCESS_PAYMENT",
  similes: [
    "process payment",
    "make payment", 
    "pay invoice",
    "send payment",
    "execute payment"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return (text.includes("process") || text.includes("make") || text.includes("pay")) && 
           text.includes("payment");
  },
  description: "Processes a payment for an invoice",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const paymentService = new PaymentService(runtime);
      
      // Extract payment details from message
      const paymentRequest = extractPaymentRequest(message.content.text || '');
      
      // Process the payment
      const paymentStatus = await paymentService.processPayment(paymentRequest);
      
      const responseText = `💰 **Payment Processed Successfully!**\n\n` +
        `**Invoice:** #${paymentStatus.invoiceId}\n` +
        `**Amount:** ${parseFloat(paymentStatus.amount).toLocaleString()} ${paymentStatus.currency}\n` +
        `**Transaction Hash:** \`${paymentStatus.txHash}\`\n` +
        `**Status:** ${paymentStatus.status.charAt(0).toUpperCase() + paymentStatus.status.slice(1)}\n` +
        `**Confirmations:** ${paymentStatus.confirmations}\n` +
        `${paymentStatus.earlyPayment ? `**🎉 Early Payment Discount Applied:** ${parseFloat(paymentStatus.discountApplied || '0') / 100}%\n` : ''}` +
        `**Gas Used:** ${paymentStatus.gasUsed} gas\n` +
        `**Network:** Sei Network (Sub-400ms finality)\n\n` +
        `✅ Payment is now in escrow and will be released according to the invoice terms.`;

      callback({
        text: responseText,
        action: "PROCESS_PAYMENT_SUCCESS",
        data: paymentStatus
      });

    } catch (error) {
      callback({
        text: `❌ Payment processing failed: ${error.message}\n\nPlease check your details and try again. If the issue persists, contact support.`,
        action: "PROCESS_PAYMENT_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Process payment for invoice #123 with $5000" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll process the payment for invoice #123...",
          action: "PROCESS_PAYMENT"
        }
      }
    ]
  ]
};

const checkPaymentStatusAction: Action = {
  name: "CHECK_PAYMENT_STATUS",
  similes: [
    "check payment status",
    "payment status",
    "track payment",
    "payment info",
    "transaction status"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes("payment") && (
      text.includes("status") || text.includes("check") || text.includes("track")
    );
  },
  description: "Checks the status of a payment",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const paymentService = new PaymentService(runtime);
      
      // Extract invoice ID from message
      const invoiceId = extractInvoiceId(message.content.text || '');
      
      // Get payment status
      const paymentStatus = await paymentService.getPaymentStatus(invoiceId);
      
      if (!paymentStatus) {
        callback({
          text: `❌ No payment found for invoice #${invoiceId}.\n\nThis invoice may not have been paid yet, or the invoice ID might be incorrect.`,
          action: "CHECK_PAYMENT_STATUS_NOT_FOUND",
          data: { invoiceId }
        });
        return;
      }

      const statusEmoji = {
        'pending': '⏳',
        'processing': '🔄',
        'confirmed': '✅',
        'failed': '❌',
        'refunded': '↩️'
      };

      const responseText = `${statusEmoji[paymentStatus.status]} **Payment Status: ${paymentStatus.status.toUpperCase()}**\n\n` +
        `**Invoice:** #${paymentStatus.invoiceId}\n` +
        `**Amount:** ${parseFloat(paymentStatus.amount).toLocaleString()} ${paymentStatus.currency}\n` +
        `${paymentStatus.txHash ? `**Transaction:** \`${paymentStatus.txHash}\`\n` : ''}` +
        `${paymentStatus.confirmations ? `**Confirmations:** ${paymentStatus.confirmations}\n` : ''}` +
        `${paymentStatus.paidAt ? `**Paid At:** ${new Date(paymentStatus.paidAt).toLocaleString()}\n` : ''}` +
        `${paymentStatus.earlyPayment ? `**Early Payment Discount:** ${parseFloat(paymentStatus.discountApplied || '0') / 100}% ✨\n` : ''}` +
        `${paymentStatus.gasUsed ? `**Gas Used:** ${paymentStatus.gasUsed}\n` : ''}\n` +
        `${getStatusDescription(paymentStatus.status)}`;

      callback({
        text: responseText,
        action: "CHECK_PAYMENT_STATUS_SUCCESS",
        data: paymentStatus
      });

    } catch (error) {
      callback({
        text: `❌ Failed to check payment status: ${error.message}`,
        action: "CHECK_PAYMENT_STATUS_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Check payment status for invoice #123" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "Let me check the payment status for invoice #123...",
          action: "CHECK_PAYMENT_STATUS"
        }
      }
    ]
  ]
};

const paymentAnalyticsAction: Action = {
  name: "PAYMENT_ANALYTICS",
  similes: [
    "payment analytics",
    "payment statistics", 
    "payment metrics",
    "payment insights",
    "payment report"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes("payment") && (
      text.includes("analytics") || text.includes("statistics") || 
      text.includes("metrics") || text.includes("insights") || text.includes("report")
    );
  },
  description: "Provides payment analytics and insights",
  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const paymentService = new PaymentService(runtime);
      
      // Get analytics
      const analytics = await paymentService.getPaymentAnalytics('30d');
      
      const responseText = `📊 **Payment Analytics (Last 30 Days)**\n\n` +
        `**💰 Total Processed:** ${parseFloat(analytics.totalProcessed).toLocaleString()}\n` +
        `**⚡ Early Payment Rate:** ${analytics.earlyPaymentRate.toFixed(1)}%\n` +
        `**📉 Failure Rate:** ${analytics.failureRate.toFixed(1)}%\n` +
        `**⛽ Gas Efficiency Score:** ${analytics.gasEfficiency}%\n\n` +
        `**💱 Currency Breakdown:**\n${Object.entries(analytics.currencyBreakdown)
          .map(([currency, amount]) => `• ${currency}: ${parseFloat(amount).toLocaleString()}`)
          .join('\n')}\n\n` +
        `**📈 Key Insights:**\n` +
        `• ${analytics.earlyPaymentRate > 50 ? 'Excellent early payment adoption!' : 'Consider increasing early payment incentives'}\n` +
        `• ${analytics.failureRate < 5 ? 'Very low failure rate - great payment flow' : 'Payment failures may need attention'}\n` +
        `• Sei Network provides sub-400ms transaction finality\n` +
        `• Average gas costs optimized for efficiency`;

      callback({
        text: responseText,
        action: "PAYMENT_ANALYTICS_SUCCESS",
        data: analytics
      });

    } catch (error) {
      callback({
        text: `❌ Failed to generate analytics: ${error.message}`,
        action: "PAYMENT_ANALYTICS_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Show me payment analytics" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll generate your payment analytics report...",
          action: "PAYMENT_ANALYTICS"
        }
      }
    ]
  ]
};

const estimateFeesAction: Action = {
  name: "ESTIMATE_FEES",
  similes: [
    "estimate fees",
    "calculate fees",
    "payment costs",
    "transaction fees",
    "fee breakdown"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return (text.includes("estimate") || text.includes("calculate")) && 
           (text.includes("fees") || text.includes("cost"));
  },
  description: "Estimates payment fees and costs",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const paymentService = new PaymentService(runtime);
      
      // Extract amount and currency from message
      const { amount, currency } = extractAmountAndCurrency(message.content.text || '');
      
      // Estimate fees
      const fees = await paymentService.estimatePaymentFees(amount, currency, 'native');
      
      const responseText = `💳 **Payment Fee Estimate**\n\n` +
        `**Payment Amount:** ${parseFloat(amount).toLocaleString()} ${currency}\n\n` +
        `**Fee Breakdown:**\n` +
        `• Network Fee: ${fees.networkFee}\n` +
        `• Platform Fee (0.5%): ${fees.platformFee}\n` +
        `• **Total Fees: ${fees.totalFees}**\n\n` +
        `**Estimated Time:** ${fees.estimatedTime}\n` +
        `**Network:** Sei (Ultra-fast finality)\n\n` +
        `💡 **Fee Optimization Tips:**\n` +
        `• Sei Network offers some of the lowest fees in DeFi\n` +
        `• Early payments can save ${fees.platformFee > '25' ? '2-3%' : '1-2%'} with our discount program\n` +
        `• Batch multiple payments to save on network fees`;

      callback({
        text: responseText,
        action: "ESTIMATE_FEES_SUCCESS",
        data: fees
      });

    } catch (error) {
      callback({
        text: `❌ Failed to estimate fees: ${error.message}`,
        action: "ESTIMATE_FEES_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Estimate fees for $5000 payment" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll calculate the payment fees for $5000...",
          action: "ESTIMATE_FEES"
        }
      }
    ]
  ]
};

// Helper functions
function extractPaymentRequest(text: string): PaymentRequest {
  const invoiceIdMatch = text.match(/#?(\d+)/);
  const amountMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  
  return {
    invoiceId: invoiceIdMatch ? parseInt(invoiceIdMatch[1]) : 1,
    payerAddress: "0x742d35Cc6634C0532925a3b8D084d54b8a11D3", // Mock address
    amount: amountMatch ? amountMatch[1].replace(',', '') : "1000",
    currency: "USD",
    paymentMethod: 'native'
  };
}

function extractInvoiceId(text: string): number {
  const match = text.match(/#?(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function extractAmountAndCurrency(text: string): { amount: string; currency: string } {
  const amountMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  const amount = amountMatch ? amountMatch[1].replace(',', '') : "1000";
  
  // Detect currency
  let currency = "USD";
  if (text.toLowerCase().includes('sei')) currency = 'SEI';
  if (text.toLowerCase().includes('usdc')) currency = 'USDC';
  if (text.toLowerCase().includes('usdt')) currency = 'USDT';
  
  return { amount, currency };
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'pending': 'Payment is waiting to be processed.',
    'processing': 'Payment is being processed on the blockchain.',
    'confirmed': 'Payment has been confirmed and is in escrow.',
    'failed': 'Payment failed. Please try again or contact support.',
    'refunded': 'Payment has been refunded to the payer.'
  };
  
  return descriptions[status] || 'Unknown status.';
}

// Evaluator for tracking payment success
const paymentSuccessEvaluator: Evaluator = {
  name: "PAYMENT_SUCCESS",
  similes: ["payment successful", "payment confirmed", "transaction complete"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    return message.content.action === "PROCESS_PAYMENT_SUCCESS";
  },
  description: "Evaluates successful payment processing",
  handler: async (_runtime: IAgentRuntime, _message: Memory): Promise<void> => {
    // Evaluators typically don't return values in v2 compatibility
    return;
  },
  examples: [
    {
      prompt: "Evaluate if payment processing was successful",
      messages: [
        {
          name: "{{user1}}",
          content: { text: "Payment went through perfectly!" }
        },
        {
          name: "{{agentName}}",
          content: {
            text: "Excellent! I'm glad the payment processed smoothly.",
            action: "PAYMENT_SUCCESS"
          }
        }
      ],
      outcome: "Payment success should be positively evaluated"
    }
  ]
};

export const paymentPlugin: Plugin = {
  name: "payment",
  description: "Handles payment processing, status tracking, and analytics with intelligent fee optimization",
  actions: [processPaymentAction, checkPaymentStatusAction, paymentAnalyticsAction, estimateFeesAction],
  evaluators: [paymentSuccessEvaluator],
  providers: []
};
import { Plugin, IAgentRuntime, Memory, Action, Evaluator, HandlerCallback } from "@elizaos/core";

interface NegotiationContext {
  invoiceId: number;
  originalTerms: PaymentTerms;
  proposedTerms: PaymentTerms;
  clientRequest: string;
  providerPreferences: ProviderPreferences;
  clientHistory: ClientPaymentHistory;
  negotiationHistory: NegotiationMessage[];
}

interface PaymentTerms {
  paymentWindow: number; // in days
  earlyPaymentDiscountBps: number; // basis points (100 = 1%)
  requiresApproval: boolean;
  amount: number;
  currency: string;
}

interface ProviderPreferences {
  maxPaymentWindow: number;
  minEarlyDiscountBps: number;
  maxEarlyDiscountBps: number;
  requiresApprovalForAmountsOver: number;
  priorityCashFlow: boolean;
  acceptableRiskLevel: 'low' | 'medium' | 'high';
}

interface ClientPaymentHistory {
  averagePaymentDelay: number;
  paymentReliabilityScore: number; // 0-100
  totalTransactionVolume: number;
  numberOfLatePayments: number;
  numberOfDisputes: number;
  averageInvoiceAmount: number;
}

interface NegotiationMessage {
  timestamp: number;
  sender: 'client' | 'provider' | 'agent';
  message: string;
  termsProposed?: PaymentTerms;
  reasoning?: string;
}

interface NegotiationStrategy {
  approach: 'collaborative' | 'competitive' | 'accommodating';
  maxConcessions: number;
  priorityFactors: string[];
  fallbackOptions: string[];
}

class NegotiationEngine {
  private strategies: Map<string, NegotiationStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies() {
    // Collaborative strategy - win-win solutions
    this.strategies.set('collaborative', {
      approach: 'collaborative',
      maxConcessions: 3,
      priorityFactors: ['relationship_building', 'mutual_benefit', 'long_term_value'],
      fallbackOptions: ['partial_payments', 'service_bundling', 'future_discounts']
    });

    // Competitive strategy - maximize provider terms
    this.strategies.set('competitive', {
      approach: 'competitive',
      maxConcessions: 1,
      priorityFactors: ['cash_flow', 'profit_margin', 'risk_minimization'],
      fallbackOptions: ['firm_terms', 'alternative_clients', 'service_reduction']
    });

    // Accommodating strategy - flexible terms for good clients
    this.strategies.set('accommodating', {
      approach: 'accommodating',
      maxConcessions: 5,
      priorityFactors: ['client_satisfaction', 'volume_maintenance', 'reputation'],
      fallbackOptions: ['extended_terms', 'reduced_rates', 'additional_services']
    });
  }

  analyzeNegotiationRequest(context: NegotiationContext): {
    recommendation: 'accept' | 'counter' | 'reject';
    counterOffer?: PaymentTerms;
    reasoning: string;
    riskAssessment: string;
  } {
    const { originalTerms, proposedTerms, clientHistory, providerPreferences } = context;

    // Calculate risk score
    const riskScore = this.calculateRiskScore(proposedTerms, clientHistory, providerPreferences);
    
    // Determine strategy based on client history and proposal
    const strategy = this.selectStrategy(clientHistory, riskScore);
    
    // Analyze the proposal
    const analysis = this.analyzeProposal(originalTerms, proposedTerms, clientHistory);

    if (analysis.acceptabilityScore > 80) {
      return {
        recommendation: 'accept',
        reasoning: this.generateAcceptanceReasoning(analysis, strategy),
        riskAssessment: this.generateRiskAssessment(riskScore)
      };
    } else if (analysis.acceptabilityScore > 40) {
      const counterOffer = this.generateCounterOffer(
        originalTerms, 
        proposedTerms, 
        providerPreferences, 
        strategy
      );
      
      return {
        recommendation: 'counter',
        counterOffer,
        reasoning: this.generateCounterReasoning(analysis, counterOffer, strategy),
        riskAssessment: this.generateRiskAssessment(riskScore)
      };
    } else {
      return {
        recommendation: 'reject',
        reasoning: this.generateRejectionReasoning(analysis, strategy),
        riskAssessment: this.generateRiskAssessment(riskScore)
      };
    }
  }

  private calculateRiskScore(
    terms: PaymentTerms, 
    history: ClientPaymentHistory, 
    preferences: ProviderPreferences
  ): number {
    let riskScore = 0;

    // Payment window risk
    if (terms.paymentWindow > preferences.maxPaymentWindow) {
      riskScore += (terms.paymentWindow - preferences.maxPaymentWindow) * 2;
    }

    // Client history risk
    riskScore += (100 - history.paymentReliabilityScore) * 0.5;
    riskScore += history.averagePaymentDelay * 0.1;
    riskScore += history.numberOfDisputes * 10;

    // Amount risk
    if (terms.amount > history.averageInvoiceAmount * 2) {
      riskScore += 20;
    }

    return Math.min(riskScore, 100);
  }

  private selectStrategy(history: ClientPaymentHistory, riskScore: number): NegotiationStrategy {
    if (history.paymentReliabilityScore > 85 && riskScore < 30) {
      return this.strategies.get('accommodating')!;
    } else if (history.paymentReliabilityScore < 60 || riskScore > 70) {
      return this.strategies.get('competitive')!;
    } else {
      return this.strategies.get('collaborative')!;
    }
  }

  private analyzeProposal(
    original: PaymentTerms,
    proposed: PaymentTerms,
    history: ClientPaymentHistory
  ): { acceptabilityScore: number; factors: any } {
    let score = 50; // Base score
    const factors: any = {};

    // Payment window analysis
    const windowIncrease = proposed.paymentWindow - original.paymentWindow;
    if (windowIncrease <= 0) {
      score += 20;
      factors.paymentWindow = 'favorable';
    } else if (windowIncrease <= 15) {
      score += 10;
      factors.paymentWindow = 'acceptable';
    } else if (windowIncrease <= 30) {
      score -= 10;
      factors.paymentWindow = 'concerning';
    } else {
      score -= 30;
      factors.paymentWindow = 'problematic';
    }

    // Discount analysis
    const discountChange = proposed.earlyPaymentDiscountBps - original.earlyPaymentDiscountBps;
    if (discountChange >= 0) {
      score += 15;
      factors.discount = 'maintained_or_improved';
    } else {
      score -= Math.abs(discountChange) * 0.1;
      factors.discount = 'reduced';
    }

    // Client reliability factor
    score += (history.paymentReliabilityScore - 50) * 0.4;
    factors.reliability = history.paymentReliabilityScore > 80 ? 'high' : 
                         history.paymentReliabilityScore > 60 ? 'medium' : 'low';

    // Amount factor
    if (proposed.amount > original.amount) {
      score += 10;
      factors.amount = 'increased';
    }

    return { acceptabilityScore: Math.max(0, Math.min(100, score)), factors };
  }

  private generateCounterOffer(
    original: PaymentTerms,
    proposed: PaymentTerms,
    preferences: ProviderPreferences,
    strategy: NegotiationStrategy
  ): PaymentTerms {
    const windowDifference = proposed.paymentWindow - original.paymentWindow;
    
    let counterOffer: PaymentTerms = { ...original };

    if (strategy.approach === 'collaborative') {
      // Meet in the middle approach
      counterOffer.paymentWindow = original.paymentWindow + Math.floor(windowDifference * 0.6);
      
      // Offer slight discount increase for extended terms
      if (windowDifference > 0) {
        counterOffer.earlyPaymentDiscountBps = Math.min(
          original.earlyPaymentDiscountBps + 50,
          preferences.maxEarlyDiscountBps
        );
      }
    } else if (strategy.approach === 'competitive') {
      // Minimal concessions
      counterOffer.paymentWindow = original.paymentWindow + Math.min(windowDifference * 0.3, 10);
      
      // Require higher amount for extended terms
      if (windowDifference > 15) {
        counterOffer.amount = original.amount * 1.02; // 2% increase
      }
    } else { // accommodating
      // More generous concessions
      counterOffer.paymentWindow = original.paymentWindow + Math.floor(windowDifference * 0.8);
      counterOffer.earlyPaymentDiscountBps = Math.min(
        original.earlyPaymentDiscountBps + 100,
        preferences.maxEarlyDiscountBps
      );
    }

    // Ensure terms stay within provider preferences
    counterOffer.paymentWindow = Math.min(counterOffer.paymentWindow, preferences.maxPaymentWindow);
    
    return counterOffer;
  }

  private generateAcceptanceReasoning(analysis: any, strategy: NegotiationStrategy): string {
    const { acceptabilityScore, factors } = analysis;
    
    let reasoning = `✅ **Recommendation: ACCEPT**\n\n`;
    reasoning += `**Analysis Score:** ${acceptabilityScore}/100\n\n`;
    reasoning += `**Key Factors:**\n`;
    
    if (factors.paymentWindow === 'favorable') {
      reasoning += `• Payment terms are favorable or unchanged\n`;
    }
    
    if (factors.reliability === 'high') {
      reasoning += `• Client has excellent payment history (${factors.reliability} reliability)\n`;
    }
    
    if (factors.amount === 'increased') {
      reasoning += `• Invoice amount has been increased\n`;
    }
    
    reasoning += `\n**Strategy:** ${strategy.approach} approach selected based on client profile\n`;
    reasoning += `**Business Impact:** Low risk, maintains client relationship, good cash flow terms`;
    
    return reasoning;
  }

  private generateCounterReasoning(
    analysis: any, 
    counterOffer: PaymentTerms, 
    strategy: NegotiationStrategy
  ): string {
    let reasoning = `🔄 **Recommendation: COUNTER-OFFER**\n\n`;
    reasoning += `**Analysis Score:** ${analysis.acceptabilityScore}/100\n\n`;
    reasoning += `**Proposed Counter-Terms:**\n`;
    reasoning += `• Payment Window: Net ${counterOffer.paymentWindow} days\n`;
    reasoning += `• Early Payment Discount: ${counterOffer.earlyPaymentDiscountBps / 100}%\n`;
    
    if (counterOffer.amount > analysis.originalAmount) {
      reasoning += `• Adjusted Amount: ${counterOffer.amount.toLocaleString()}\n`;
    }
    
    reasoning += `\n**Justification:**\n`;
    
    if (strategy.approach === 'collaborative') {
      reasoning += `• Balanced approach that considers both parties' needs\n`;
      reasoning += `• Maintains good business relationship while protecting cash flow\n`;
    } else if (strategy.approach === 'competitive') {
      reasoning += `• Firm stance based on standard business terms\n`;
      reasoning += `• Protects profit margins and operational needs\n`;
    } else {
      reasoning += `• Flexible terms to accommodate valued client\n`;
      reasoning += `• Long-term relationship prioritized over short-term gains\n`;
    }
    
    return reasoning;
  }

  private generateRejectionReasoning(analysis: any, _strategy: NegotiationStrategy): string {
    let reasoning = `❌ **Recommendation: REJECT**\n\n`;
    reasoning += `**Analysis Score:** ${analysis.acceptabilityScore}/100 (Below threshold)\n\n`;
    reasoning += `**Rejection Factors:**\n`;
    
    if (analysis.factors.paymentWindow === 'problematic') {
      reasoning += `• Payment terms exceed acceptable business limits\n`;
    }
    
    if (analysis.factors.reliability === 'low') {
      reasoning += `• Client payment history indicates high risk\n`;
    }
    
    reasoning += `\n**Alternative Suggestions:**\n`;
    reasoning += `• Propose original terms with additional incentives\n`;
    reasoning += `• Consider milestone-based payment structure\n`;
    reasoning += `• Offer alternative services with more suitable terms\n`;
    
    return reasoning;
  }

  private generateRiskAssessment(riskScore: number): string {
    if (riskScore < 30) {
      return `🟢 **Low Risk** (Score: ${riskScore}/100) - Proceed with confidence`;
    } else if (riskScore < 60) {
      return `🟡 **Medium Risk** (Score: ${riskScore}/100) - Monitor closely`;
    } else {
      return `🔴 **High Risk** (Score: ${riskScore}/100) - Consider additional protections`;
    }
  }

  generateNegotiationMessage(
    context: NegotiationContext,
    recommendation: any
  ): string {
    let message = `Hello! I've reviewed your request for modified payment terms.\n\n`;
    
    message += recommendation.reasoning + `\n\n`;
    message += recommendation.riskAssessment + `\n\n`;
    
    if (recommendation.recommendation === 'counter' && recommendation.counterOffer) {
      message += `**Our Counter-Proposal:**\n`;
      message += `• Payment Terms: Net ${recommendation.counterOffer.paymentWindow} days\n`;
      message += `• Early Payment Discount: ${recommendation.counterOffer.earlyPaymentDiscountBps / 100}% if paid within 10 days\n`;
      
      if (recommendation.counterOffer.amount !== context.originalTerms.amount) {
        message += `• Adjusted Amount: ${recommendation.counterOffer.amount.toLocaleString()}\n`;
      }
      
      message += `\nThis proposal balances your needs with our business requirements. `;
      message += `Would you like to proceed with these terms?\n\n`;
    } else if (recommendation.recommendation === 'accept') {
      message += `We're happy to accept your proposed terms. `;
      message += `I'll update the invoice accordingly and send you the revised version.\n\n`;
    } else {
      message += `Unfortunately, we cannot accommodate the requested terms. `;
      message += `However, I'd be happy to discuss alternative arrangements that work for both parties.\n\n`;
    }
    
    message += `Please let me know your thoughts, and I'm here to help find a solution that works for everyone.`;
    
    return message;
  }
}

// ElizaOS Actions for Negotiation
const negotiateTermsAction: Action = {
  name: "NEGOTIATE_TERMS",
  similes: [
    "negotiate",
    "modify terms",
    "change payment",
    "extend deadline",
    "payment terms",
    "discount request"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return (
      text.includes("negotiate") ||
      text.includes("extend") ||
      text.includes("modify") ||
      text.includes("change") ||
      text.includes("terms")
    ) && (
      text.includes("payment") ||
      text.includes("invoice") ||
      text.includes("due")
    );
  },
  description: "Handles payment term negotiations with intelligent analysis",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const negotiationEngine = new NegotiationEngine();
      
      // Extract negotiation context from message
      const context = await extractNegotiationContext(runtime, message);
      
      // Analyze the negotiation request
      const recommendation = negotiationEngine.analyzeNegotiationRequest(context);
      
      // Generate response message
      const responseMessage = negotiationEngine.generateNegotiationMessage(context, recommendation);
      
      // Store negotiation in memory
      await storeNegotiation(runtime, context, recommendation);
      
      callback({
        text: responseMessage,
        action: "NEGOTIATE_TERMS_COMPLETE",
        data: {
          recommendation: recommendation.recommendation,
          terms: recommendation.counterOffer,
          reasoning: recommendation.reasoning
        }
      });
      
    } catch (error) {
      callback({
        text: `I encountered an error while analyzing the negotiation request: ${error.message}. Let me connect you with a human to handle this personally.`,
        action: "NEGOTIATE_TERMS_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Can we extend the payment terms from Net 30 to Net 60?" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll analyze your request for extended payment terms and provide a recommendation based on our business relationship and current terms.",
          action: "NEGOTIATE_TERMS"
        }
      }
    ]
  ]
};

const analyzeClientRiskAction: Action = {
  name: "ANALYZE_CLIENT_RISK",
  similes: [
    "check client",
    "client history",
    "payment history",
    "risk assessment",
    "client profile"
  ],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes("client") && (
      text.includes("check") ||
      text.includes("history") ||
      text.includes("risk") ||
      text.includes("profile")
    );
  },
  description: "Analyzes client payment history and risk profile",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: any,
    _options: any,
    callback: HandlerCallback
  ) => {
    try {
      const clientAddress = extractClientAddress(message.content.text || '');
      const clientHistory = await getClientPaymentHistory(runtime, clientAddress);
      
      const riskEngine = new NegotiationEngine();
      const defaultTerms: PaymentTerms = {
        paymentWindow: 30,
        earlyPaymentDiscountBps: 200,
        requiresApproval: false,
        amount: 1000,
        currency: 'USD'
      };
      
      const defaultPreferences: ProviderPreferences = {
        maxPaymentWindow: 60,
        minEarlyDiscountBps: 100,
        maxEarlyDiscountBps: 500,
        requiresApprovalForAmountsOver: 10000,
        priorityCashFlow: true,
        acceptableRiskLevel: 'medium'
      };
      
      const riskScore = riskEngine['calculateRiskScore'](defaultTerms, clientHistory, defaultPreferences);
      
      let riskLevel = 'Low';
      if (riskScore > 60) riskLevel = 'High';
      else if (riskScore > 30) riskLevel = 'Medium';
      
      const responseText = `📊 **Client Risk Analysis**\n\n` +
        `**Client:** ${clientAddress}\n` +
        `**Risk Score:** ${riskScore}/100 (${riskLevel} Risk)\n` +
        `**Payment Reliability:** ${clientHistory.paymentReliabilityScore}%\n` +
        `**Average Payment Delay:** ${clientHistory.averagePaymentDelay} days\n` +
        `**Transaction Volume:** ${clientHistory.totalTransactionVolume.toLocaleString()}\n` +
        `**Dispute History:** ${clientHistory.numberOfDisputes} disputes\n\n` +
        `**Recommended Terms:**\n` +
        `• Payment Window: Net ${riskLevel === 'High' ? 15 : riskLevel === 'Medium' ? 30 : 45} days\n` +
        `• Early Payment Discount: ${riskLevel === 'High' ? 3 : 2}%\n` +
        `• Approval Required: ${riskLevel === 'High' ? 'Yes' : 'No'}\n\n` +
        `**Notes:** ${generateRiskNotes(clientHistory, riskLevel)}`;
      
      callback({
        text: responseText,
        action: "ANALYZE_CLIENT_RISK_COMPLETE",
        data: {
          riskScore,
          riskLevel,
          clientHistory,
          recommendations: {
            paymentWindow: riskLevel === 'High' ? 15 : riskLevel === 'Medium' ? 30 : 45,
            requiresApproval: riskLevel === 'High'
          }
        }
      });
      
    } catch (error) {
      callback({
        text: `Unable to analyze client risk: ${error.message}`,
        action: "ANALYZE_CLIENT_RISK_ERROR",
        data: { error: error.message }
      });
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Check the payment history for client 0x742d35Cc..." }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "I'll analyze the payment history and risk profile for this client.",
          action: "ANALYZE_CLIENT_RISK"
        }
      }
    ]
  ]
};

// Helper functions
async function extractNegotiationContext(
  _runtime: IAgentRuntime, 
  message: Memory
): Promise<NegotiationContext> {
  // This would extract context from the message and user history
  // For now, returning a mock context
  return {
    invoiceId: 1,
    originalTerms: {
      paymentWindow: 30,
      earlyPaymentDiscountBps: 200,
      requiresApproval: false,
      amount: 5000,
      currency: 'USD'
    },
    proposedTerms: {
      paymentWindow: 60,
      earlyPaymentDiscountBps: 200,
      requiresApproval: false,
      amount: 5000,
      currency: 'USD'
    },
    clientRequest: message.content.text || '',
    providerPreferences: {
      maxPaymentWindow: 45,
      minEarlyDiscountBps: 100,
      maxEarlyDiscountBps: 500,
      requiresApprovalForAmountsOver: 10000,
      priorityCashFlow: true,
      acceptableRiskLevel: 'medium'
    },
    clientHistory: {
      averagePaymentDelay: 5,
      paymentReliabilityScore: 85,
      totalTransactionVolume: 50000,
      numberOfLatePayments: 2,
      numberOfDisputes: 0,
      averageInvoiceAmount: 3000
    },
    negotiationHistory: []
  };
}

async function getClientPaymentHistory(
  _runtime: IAgentRuntime, 
  _clientAddress: string
): Promise<ClientPaymentHistory> {
  // This would fetch real client history from your database
  // For now, returning mock data
  return {
    averagePaymentDelay: Math.floor(Math.random() * 20),
    paymentReliabilityScore: 60 + Math.floor(Math.random() * 40),
    totalTransactionVolume: Math.floor(Math.random() * 100000),
    numberOfLatePayments: Math.floor(Math.random() * 5),
    numberOfDisputes: Math.floor(Math.random() * 3),
    averageInvoiceAmount: 1000 + Math.floor(Math.random() * 5000)
  };
}

function extractClientAddress(text: string): string {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : "0x742d35Cc6634C0532925a3b8D084d54b8a11D3";
}

function generateRiskNotes(_history: ClientPaymentHistory, riskLevel: string): string {
  if (riskLevel === 'High') {
    return "Recommend stricter terms and closer monitoring. Consider requiring partial upfront payment.";
  } else if (riskLevel === 'Medium') {
    return "Standard terms appropriate. Monitor payment patterns for any changes.";
  } else {
    return "Excellent client relationship. Flexible terms can be offered to strengthen partnership.";
  }
}

async function storeNegotiation(
  _runtime: IAgentRuntime, 
  context: NegotiationContext, 
  recommendation: any
): Promise<void> {
  // Store negotiation in runtime memory for future reference
  const negotiationRecord = {
    timestamp: Date.now(),
    invoiceId: context.invoiceId,
    recommendation: recommendation.recommendation,
    terms: recommendation.counterOffer,
    reasoning: recommendation.reasoning
  };
  
  // This would store in your database
  console.log("Storing negotiation:", negotiationRecord);
}

// Evaluator for tracking negotiation success
const negotiationSuccessEvaluator: Evaluator = {
  name: "NEGOTIATION_SUCCESS",
  similes: ["negotiation outcome", "terms accepted", "deal closed"],
  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    return text.includes("accept") || text.includes("agree") || text.includes("proceed");
  },
  description: "Evaluates successful negotiations",
  handler: async (_runtime: IAgentRuntime, _message: Memory) => {
    // Track successful negotiations for learning
    // Evaluators don't need to return anything in ElizaOS
    return;
  },
  examples: []
};

export const negotiationPlugin: Plugin = {
  name: "negotiation",
  description: "Handles intelligent payment term negotiations and client risk analysis",
  actions: [negotiateTermsAction, analyzeClientRiskAction],
  evaluators: [negotiationSuccessEvaluator],
  providers: []
};
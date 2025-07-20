# Smart Invoice Agent - Smart Contracts

This directory contains the smart contracts for the Smart Invoice Agent platform, built for the Sei Network blockchain.

## 🏗️ Architecture Overview

### Core Contracts

1. **InvoiceEscrow.sol** - Main contract handling invoice lifecycle
2. **InvoiceFactory.sol** - Factory for creating and tracking invoices
3. **MockERC20.sol** - Test token contract (development only)

### Key Features

- ✅ **Escrow System**: Secure payment holding until conditions are met
- ✅ **AI Agent Integration**: Smart contract events for AI agent interactions
- ✅ **Multi-Currency Support**: Native SEI, USDC, USDT, and other ERC20 tokens
- ✅ **Dispute Resolution**: Built-in arbitration system
- ✅ **Early Payment Discounts**: Automatic discount application
- ✅ **Fee Collection**: Platform fee system (0.5% default)
- ✅ **Access Control**: Role-based permissions and security

## 🚀 Quick Start

### Prerequisites

```bash
# Install Node.js 16+
node --version  # Should be 16.0.0 or higher

# Install dependencies
npm install
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# IMPORTANT: Add your private key and RPC URLs
```

### Compilation

```bash
# Compile contracts
npm run compile

# Check contract sizes
npm run size
```

### Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas

# Run coverage analysis
npm run test:coverage
```

### Local Development

```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy to local network
npm run deploy:local
```

## 🌐 Deployment

### Sei Testnet Deployment

```bash
# Deploy to Sei testnet
npm run deploy:sei-testnet

# Verify contracts (if explorer supports it)
npm run verify:sei-testnet
```

### Sei Mainnet Deployment

```bash
# Deploy to Sei mainnet (production)
npm run deploy:sei-mainnet

# Verify contracts
npm run verify:sei-mainnet
```

## 📋 Contract API Reference

### InvoiceEscrow.sol

#### Core Functions

```solidity
// Create a new invoice
function createInvoice(
    address payable client,
    uint256 amount,
    address token,
    PaymentTerms calldata terms,
    string calldata ipfsHash
) external returns (uint256 invoiceId);

// Make payment for an invoice
function makePayment(uint256 invoiceId) external payable;

// Approve completed work (if required)
function approveInvoice(uint256 invoiceId) external;

// Raise a dispute
function raiseDispute(uint256 invoiceId, string calldata reason) external;

// Resolve dispute (arbitrator only)
function resolveDispute(uint256 invoiceId, bool favorProvider) external;
```

#### View Functions

```solidity
// Get invoice details
function getInvoice(uint256 invoiceId) external view returns (Invoice memory);

// Get user's invoices
function getProviderInvoices(address provider) external view returns (uint256[] memory);
function getClientInvoices(address client) external view returns (uint256[] memory);

// Get escrow balance
function getEscrowBalance(uint256 invoiceId) external view returns (uint256);
```

### Events

```solidity
event InvoiceCreated(uint256 indexed invoiceId, address indexed provider, address indexed client, uint256 amount, address token, string ipfsHash);
event PaymentMade(uint256 indexed invoiceId, address indexed payer, uint256 amount, uint256 actualAmount, bool earlyPayment);
event FundsReleased(uint256 indexed invoiceId, address indexed recipient, uint256 amount, uint256 platformFee);
event DisputeRaised(uint256 indexed invoiceId, address indexed initiator, string reason);
event DisputeResolved(uint256 indexed invoiceId, address indexed resolver, bool favorProvider);
```

## 🔒 Security Features

### Access Control
- **Owner-only functions**: Token management, fee collection, emergency controls
- **Role-based permissions**: Provider, client, and arbitrator roles
- **Multi-signature support**: For high-value transactions

### Security Measures
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency stop functionality
- **SafeERC20**: Safe token transfers
- **Input validation**: Comprehensive parameter checking

### Audit Considerations
- All external calls use checks-effects-interactions pattern
- State changes occur before external calls
- Comprehensive event logging for transparency
- Gas optimization without sacrificing security

## 🧪 Testing Strategy

### Test Coverage
- **Unit Tests**: Individual function testing
- **Integration Tests**: Multi-contract interactions
- **Edge Cases**: Error conditions and boundary values
- **Gas Tests**: Optimization verification
- **Security Tests**: Attack vector prevention

### Test Categories
1. **Contract Deployment**: Proper initialization
2. **Invoice Creation**: Various scenarios and validations
3. **Payment Processing**: Native and ERC20 payments
4. **Approval Workflow**: Client approval requirements
5. **Dispute Resolution**: Arbitration system
6. **Access Control**: Permission enforcement
7. **Edge Cases**: Expiration, cancellation, errors

### Running Specific Tests

```bash
# Run only deployment tests
npx hardhat test --grep "Contract Deployment"

# Run only payment tests
npx hardhat test --grep "Payment Processing"

# Run tests with detailed gas reporting
REPORT_GAS=true npx hardhat test
```

## 📊 Gas Optimization

### Optimization Strategies
- **Packed structs**: Efficient storage layout
- **Short-circuit logic**: Early returns and validations
- **Batch operations**: Multiple actions in single transaction
- **Event indexing**: Optimal event parameter indexing

### Gas Costs (Estimated)
- Invoice Creation: ~150,000 gas
- Payment (Native): ~80,000 gas
- Payment (ERC20): ~120,000 gas
- Approval: ~50,000 gas
- Dispute Resolution: ~100,000 gas

## 🔧 Configuration

### Supported Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Sei Testnet | 1328 | https://evm-rpc-testnet.sei-apis.com |
| Sei Mainnet | 1329 | https://evm-rpc.sei-apis.com |
| Localhost | 31337 | http://127.0.0.1:8545 |

### Contract Addresses

After deployment, contract addresses will be saved in:
```
deployments/
├── localhost.json
├── sei-testnet.json
└── sei-mainnet.json
```

## 🐛 Troubleshooting

### Common Issues

1. **Gas Estimation Errors**
   ```bash
   # Increase gas limit in hardhat.config.js
   gas: 3000000
   ```

2. **Network Connection Issues**
   ```bash
   # Check RPC URL in .env file
   # Verify network is accessible
   ```

3. **Private Key Issues**
   ```bash
   # Ensure private key is without 0x prefix
   # Check account has sufficient balance
   ```

4. **Contract Verification Failures**
   ```bash
   # Ensure exact compiler version match
   # Check constructor parameters
   ```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=true npm test

# Check network connectivity
npx hardhat console --network sei-testnet
```

## 📈 Monitoring & Analytics

### Contract Events
All contract interactions emit events that can be monitored:
- Invoice lifecycle events
- Payment events
- Dispute events
- Administrative events

### Integration Points
- **Frontend**: Contract ABIs in `/artifacts`
- **Backend**: Event listeners for real-time updates
- **Analytics**: Transaction data for business insights

## 🚨 Emergency Procedures

### Pause Contract
```javascript
// In case of emergency, pause all operations
const contract = await ethers.getContractAt("InvoiceEscrow", contractAddress);
await contract.pause();
```

### Emergency Withdrawal
```javascript
// Owner can withdraw stuck funds in emergencies
await contract.emergencyWithdraw(tokenAddress, amount);
```

## 📚 Additional Resources

- [Sei Network Documentation](https://docs.sei.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**⚠️ Important Security Notice**: These contracts handle financial transactions. Always audit thoroughly before mainnet deployment and consider using a multi-signature wallet for administrative functions.

# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

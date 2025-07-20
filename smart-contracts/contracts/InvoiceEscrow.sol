// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InvoiceEscrow
 * @dev Smart contract for managing invoice payments with escrow functionality
 * @notice This contract handles the complete invoice lifecycle including creation, payment, and release
 */
contract InvoiceEscrow is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant PLATFORM_FEE_BPS = 50; // 0.5% platform fee
    uint256 public constant MAX_PAYMENT_WINDOW = 90 days;
    uint256 public constant MIN_PAYMENT_WINDOW = 1 days;
    uint256 public constant MAX_EARLY_DISCOUNT_BPS = 1000; // 10% max early payment discount
    address public usdcAddressTestnet = 0x70730E92502A851011C5033F1432876049774239;

    // State variables
    uint256 public nextInvoiceId = 1;
    address public feeCollector;
    mapping(address => bool) public supportedTokens;

    // Structs
    struct Invoice {
        uint256 id;
        address payable provider;
        address payable client;
        uint256 amount;
        address token; // ERC20 token address (address(0) for native SEI)
        PaymentTerms terms;
        InvoiceStatus status;
        uint256 createdAt;
        uint256 dueDate;
        uint256 paidAt;
        string ipfsHash; // Metadata stored on IPFS
    }

    struct PaymentTerms {
        uint256 paymentWindow; // Payment window in seconds
        uint256 earlyPaymentDiscountBps; // Early payment discount in basis points
        uint256 earlyPaymentDeadline; // Deadline for early payment discount
        bool requiresApproval; // Whether payment requires provider approval
        address arbitrator; // Address for dispute resolution
    }

    enum InvoiceStatus {
        Created,     // Invoice created, awaiting payment
        Paid,        // Payment made, funds in escrow
        Approved,    // Provider approved the work (if required)
        Completed,   // Funds released to provider
        Disputed,    // Dispute raised
        Cancelled,   // Invoice cancelled
        Refunded     // Payment refunded to client
    }

    // Storage
    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => uint256) public escrowBalances;
    mapping(uint256 => string) public disputeReasons;
    mapping(address => uint256[]) public providerInvoices;
    mapping(address => uint256[]) public clientInvoices;

    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed provider,
        address indexed client,
        uint256 amount,
        address token,
        string ipfsHash
    );

    event PaymentMade(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 amount,
        uint256 actualAmount, // Amount after discount
        bool earlyPayment
    );

    event InvoiceApproved(
        uint256 indexed invoiceId,
        address indexed approver
    );

    event FundsReleased(
        uint256 indexed invoiceId,
        address indexed recipient,
        uint256 amount,
        uint256 platformFee
    );

    event DisputeRaised(
        uint256 indexed invoiceId,
        address indexed initiator,
        string reason
    );

    event DisputeResolved(
        uint256 indexed invoiceId,
        address indexed resolver,
        bool favorProvider
    );

    event InvoiceCancelled(
        uint256 indexed invoiceId,
        address indexed canceller
    );

    // Modifiers
    modifier validInvoice(uint256 _invoiceId) {
        require(invoices[_invoiceId].id != 0, "Invoice does not exist");
        _;
    }

    modifier onlyProvider(uint256 _invoiceId) {
        require(invoices[_invoiceId].provider == msg.sender, "Only provider can call this");
        _;
    }

    modifier onlyClient(uint256 _invoiceId) {
        require(invoices[_invoiceId].client == msg.sender, "Only client can call this");
        _;
    }

    modifier onlyProviderOrClient(uint256 _invoiceId) {
        require(
            invoices[_invoiceId].provider == msg.sender || 
            invoices[_invoiceId].client == msg.sender,
            "Only provider or client can call this"
        );
        _;
    }

    constructor(address _feeCollector) Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
        
        // Add some default supported tokens (you'll need to update these with actual Sei network addresses)
        supportedTokens[address(0)] = true; // Native SEI
        supportedTokens[usdcAddressTestnet] = true; // Add actual USDC address
        // supportedTokens[USDT_ADDRESS] = true; // Add actual USDT address
    }

    /**
     * @dev Creates a new invoice
     * @param _client Address of the client who will pay
     * @param _amount Invoice amount
     * @param _token Token address for payment (address(0) for native SEI)
     * @param _terms Payment terms for the invoice
     * @param _ipfsHash IPFS hash containing invoice metadata
     */
    function createInvoice(
        address payable _client,
        uint256 _amount,
        address _token,
        PaymentTerms calldata _terms,
        string calldata _ipfsHash
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_client != address(0), "Invalid client address");
        require(_client != msg.sender, "Provider and client cannot be the same");
        require(_amount > 0, "Amount must be greater than 0");
        require(supportedTokens[_token], "Token not supported");
        require(_terms.paymentWindow >= MIN_PAYMENT_WINDOW && 
                _terms.paymentWindow <= MAX_PAYMENT_WINDOW, "Invalid payment window");
        require(_terms.earlyPaymentDiscountBps <= MAX_EARLY_DISCOUNT_BPS, "Discount too high");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");

        uint256 invoiceId = nextInvoiceId++;
        uint256 dueDate = block.timestamp + _terms.paymentWindow;
        uint256 earlyDeadline = _terms.earlyPaymentDiscountBps > 0 ? 
            block.timestamp + (_terms.paymentWindow / 2) : 0;

        PaymentTerms memory terms = PaymentTerms({
            paymentWindow: _terms.paymentWindow,
            earlyPaymentDiscountBps: _terms.earlyPaymentDiscountBps,
            earlyPaymentDeadline: earlyDeadline,
            requiresApproval: _terms.requiresApproval,
            arbitrator: _terms.arbitrator
        });

        Invoice memory invoice = Invoice({
            id: invoiceId,
            provider: payable(msg.sender),
            client: _client,
            amount: _amount,
            token: _token,
            terms: terms,
            status: InvoiceStatus.Created,
            createdAt: block.timestamp,
            dueDate: dueDate,
            paidAt: 0,
            ipfsHash: _ipfsHash
        });

        invoices[invoiceId] = invoice;
        providerInvoices[msg.sender].push(invoiceId);
        clientInvoices[_client].push(invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, _client, _amount, _token, _ipfsHash);

        return invoiceId;
    }

    /**
     * @dev Makes payment for an invoice
     * @param _invoiceId ID of the invoice to pay
     */
    function makePayment(uint256 _invoiceId) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        validInvoice(_invoiceId) 
        onlyClient(_invoiceId) 
    {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.status == InvoiceStatus.Created, "Invoice cannot be paid");
        require(block.timestamp <= invoice.dueDate, "Invoice has expired");

        uint256 paymentAmount = invoice.amount;
        bool isEarlyPayment = false;

        // Apply early payment discount if applicable
        if (invoice.terms.earlyPaymentDiscountBps > 0 && 
            block.timestamp <= invoice.terms.earlyPaymentDeadline) {
            uint256 discount = (invoice.amount * invoice.terms.earlyPaymentDiscountBps) / 10000;
            paymentAmount = invoice.amount - discount;
            isEarlyPayment = true;
        }

        if (invoice.token == address(0)) {
            // Native SEI payment
            require(msg.value == paymentAmount, "Incorrect payment amount");
        } else {
            // ERC20 token payment
            require(msg.value == 0, "Should not send ETH for token payment");
            IERC20(invoice.token).safeTransferFrom(msg.sender, address(this), paymentAmount);
        }

        escrowBalances[_invoiceId] = paymentAmount;
        invoice.status = invoice.terms.requiresApproval ? InvoiceStatus.Paid : InvoiceStatus.Approved;
        invoice.paidAt = block.timestamp;

        emit PaymentMade(_invoiceId, msg.sender, invoice.amount, paymentAmount, isEarlyPayment);

        // Auto-release if no approval required
        if (!invoice.terms.requiresApproval) {
            _releaseFunds(_invoiceId);
        }
    }

    /**
     * @dev Approves the work and allows fund release (if approval required)
     * @param _invoiceId ID of the invoice to approve. Client Address performs this
     */
    function approveInvoice(uint256 _invoiceId) 
        external 
        whenNotPaused 
        validInvoice(_invoiceId) 
        onlyClient(_invoiceId) 
    {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.status == InvoiceStatus.Paid, "Invoice not in paid status");
        require(invoice.terms.requiresApproval, "Invoice does not require approval");

        invoice.status = InvoiceStatus.Approved;
        emit InvoiceApproved(_invoiceId, msg.sender);

        _releaseFunds(_invoiceId);
    }

    /**
     * @dev Releases funds to the provider
     * @param _invoiceId ID of the invoice
     */
    function _releaseFunds(uint256 _invoiceId) internal {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.status == InvoiceStatus.Approved, "Invoice not approved");

        uint256 escrowAmount = escrowBalances[_invoiceId];
        require(escrowAmount > 0, "No funds in escrow");

        // Calculate platform fee
        uint256 platformFee = (escrowAmount * PLATFORM_FEE_BPS) / 10000;
        uint256 providerAmount = escrowAmount - platformFee;

        // Update state before transfers
        escrowBalances[_invoiceId] = 0;
        invoice.status = InvoiceStatus.Completed;

        // Transfer funds
        if (invoice.token == address(0)) {
            // Native SEI transfers
            invoice.provider.transfer(providerAmount);
            payable(feeCollector).transfer(platformFee);
        } else {
            // ERC20 token transfers
            IERC20(invoice.token).safeTransfer(invoice.provider, providerAmount);
            IERC20(invoice.token).safeTransfer(feeCollector, platformFee);
        }

        emit FundsReleased(_invoiceId, invoice.provider, providerAmount, platformFee);
    }

    /**
     * @dev Raises a dispute for an invoice
     * @param _invoiceId ID of the invoice to dispute
     * @param _reason Reason for the dispute
     */
    function raiseDispute(uint256 _invoiceId, string calldata _reason) 
        external 
        whenNotPaused 
        validInvoice(_invoiceId) 
        onlyProviderOrClient(_invoiceId) 
    {
        Invoice storage invoice = invoices[_invoiceId];
        require(
            invoice.status == InvoiceStatus.Paid || 
            invoice.status == InvoiceStatus.Approved,
            "Cannot dispute invoice in current status"
        );
        require(bytes(_reason).length > 0, "Dispute reason required");

        invoice.status = InvoiceStatus.Disputed;
        disputeReasons[_invoiceId] = _reason;

        emit DisputeRaised(_invoiceId, msg.sender, _reason);
    }

    /**
     * @dev Resolves a dispute (only arbitrator can call)
     * @param _invoiceId ID of the disputed invoice
     * @param _favorProvider True if ruling in favor of provider, false for client
     */
    function resolveDispute(uint256 _invoiceId, bool _favorProvider) 
        external 
        whenNotPaused 
        validInvoice(_invoiceId) 
    {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.status == InvoiceStatus.Disputed, "Invoice not disputed");
        require(
            msg.sender == invoice.terms.arbitrator || 
            msg.sender == owner(),
            "Only arbitrator can resolve dispute"
        );

        uint256 escrowAmount = escrowBalances[_invoiceId];
        require(escrowAmount > 0, "No funds in escrow");

        escrowBalances[_invoiceId] = 0;

        if (_favorProvider) {
            // Release funds to provider
            invoice.status = InvoiceStatus.Completed;
            uint256 platformFee = (escrowAmount * PLATFORM_FEE_BPS) / 10000;
            uint256 providerAmount = escrowAmount - platformFee;

            if (invoice.token == address(0)) {
                invoice.provider.transfer(providerAmount);
                payable(feeCollector).transfer(platformFee);
            } else {
                IERC20(invoice.token).safeTransfer(invoice.provider, providerAmount);
                IERC20(invoice.token).safeTransfer(feeCollector, platformFee);
            }

            emit FundsReleased(_invoiceId, invoice.provider, providerAmount, platformFee);
        } else {
            // Refund to client
            invoice.status = InvoiceStatus.Refunded;

            if (invoice.token == address(0)) {
                invoice.client.transfer(escrowAmount);
            } else {
                IERC20(invoice.token).safeTransfer(invoice.client, escrowAmount);
            }
        }

        emit DisputeResolved(_invoiceId, msg.sender, _favorProvider);
    }

    /**
     * @dev Cancels an invoice (only provider can cancel before payment)
     * @param _invoiceId ID of the invoice to cancel
     */
    function cancelInvoice(uint256 _invoiceId) 
        external 
        whenNotPaused 
        validInvoice(_invoiceId) 
        onlyProvider(_invoiceId) 
    {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.status == InvoiceStatus.Created, "Can only cancel unpaid invoices");

        invoice.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(_invoiceId, msg.sender);
    }

    // View functions
    function getInvoice(uint256 _invoiceId) 
        external 
        view 
        returns (Invoice memory) 
    {
        return invoices[_invoiceId];
    }

    function getProviderInvoices(address _provider) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return providerInvoices[_provider];
    }

    function getClientInvoices(address _client) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return clientInvoices[_client];
    }

    function getEscrowBalance(uint256 _invoiceId) 
        external 
        view 
        returns (uint256) 
    {
        return escrowBalances[_invoiceId];
    }

    function getDisputeReason(uint256 _invoiceId) 
        external 
        view 
        returns (string memory) 
    {
        return disputeReasons[_invoiceId];
    }

    // Admin functions
    function addSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }

    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency function to withdraw stuck funds (only owner)
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }
}
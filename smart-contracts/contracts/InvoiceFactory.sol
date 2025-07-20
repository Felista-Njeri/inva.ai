// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./InvoiceEscrow.sol";

/**
 * @title InvoiceFactory
 * @dev Factory contract for creating and managing invoice escrow contracts
 * @notice This contract helps track all invoices across the platform
 */
contract InvoiceFactory {
    // Events
    event InvoiceContractDeployed(
        address indexed contractAddress,
        address indexed provider,
        uint256 invoiceId
    );

    event InvoiceCreatedViaFactory(
        address indexed contractAddress,
        uint256 indexed invoiceId,
        address indexed provider,
        address client
    );

    // State variables
    address public mainEscrowContract;
    address public feeCollector;
    uint256 public totalInvoicesCreated;
    
    // Mappings to track contracts and invoices
    mapping(address => bool) public isValidInvoiceContract;
    mapping(address => uint256[]) public userInvoices; // provider -> invoice IDs
    mapping(uint256 => address) public invoiceToContract; // invoice ID -> contract address
    
    // Arrays for iteration
    address[] public allInvoiceContracts;
    
    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
        
        // Deploy the main escrow contract
        mainEscrowContract = address(new InvoiceEscrow(_feeCollector));
        isValidInvoiceContract[mainEscrowContract] = true;
        allInvoiceContracts.push(mainEscrowContract);
        
        emit InvoiceContractDeployed(mainEscrowContract, address(this), 0);
    }

    /**
     * @dev Creates an invoice using the main escrow contract
     * @param _client Address of the client who will pay
     * @param _amount Invoice amount
     * @param _token Token address for payment
     * @param _terms Payment terms for the invoice
     * @param _ipfsHash IPFS hash containing invoice metadata
     */
    function createInvoice(
        address payable _client,
        uint256 _amount,
        address _token,
        InvoiceEscrow.PaymentTerms calldata _terms,
        string calldata _ipfsHash
    ) external returns (uint256) {
        InvoiceEscrow escrow = InvoiceEscrow(mainEscrowContract);
        
        uint256 invoiceId = escrow.createInvoice(
            _client,
            _amount,
            _token,
            _terms,
            _ipfsHash
        );
        
        // Track the invoice
        userInvoices[msg.sender].push(invoiceId);
        invoiceToContract[invoiceId] = mainEscrowContract;
        totalInvoicesCreated++;
        
        emit InvoiceCreatedViaFactory(mainEscrowContract, invoiceId, msg.sender, _client);
        
        return invoiceId;
    }

    /**
     * @dev Deploys a new invoice escrow contract (for advanced users)
     * @return Address of the newly deployed contract
     */
    function deployNewInvoiceContract() external returns (address) {
        InvoiceEscrow newContract = new InvoiceEscrow(feeCollector);
        address contractAddress = address(newContract);
        
        isValidInvoiceContract[contractAddress] = true;
        allInvoiceContracts.push(contractAddress);
        
        emit InvoiceContractDeployed(contractAddress, msg.sender, 0);
        
        return contractAddress;
    }

    /**
     * @dev Gets all invoice IDs for a specific user
     * @param _user Address of the user
     * @return Array of invoice IDs
     */
    function getUserInvoices(address _user) external view returns (uint256[] memory) {
        return userInvoices[_user];
    }

    /**
     * @dev Gets the contract address for a specific invoice
     * @param _invoiceId ID of the invoice
     * @return Address of the contract containing the invoice
     */
    function getInvoiceContract(uint256 _invoiceId) external view returns (address) {
        return invoiceToContract[_invoiceId];
    }

    /**
     * @dev Gets all deployed invoice contracts
     * @return Array of contract addresses
     */
    function getAllInvoiceContracts() external view returns (address[] memory) {
        return allInvoiceContracts;
    }

    /**
     * @dev Gets the total number of invoice contracts deployed
     * @return Number of contracts
     */
    function getContractCount() external view returns (uint256) {
        return allInvoiceContracts.length;
    }

    /**
     * @dev Gets basic stats about the platform
     * @return totalContracts Total number of contracts deployed
     * @return totalInvoices Total number of invoices created
     * @return mainContract Address of the main escrow contract
     */
    function getPlatformStats() external view returns (
        uint256 totalContracts,
        uint256 totalInvoices,
        address mainContract
    ) {
        return (
            allInvoiceContracts.length,
            totalInvoicesCreated,
            mainEscrowContract
        );
    }

    /**
     * @dev Checks if a contract address is a valid invoice contract
     * @param _contract Address to check
     * @return True if valid, false otherwise
     */
    function isValidContract(address _contract) external view returns (bool) {
        return isValidInvoiceContract[_contract];
    }
}
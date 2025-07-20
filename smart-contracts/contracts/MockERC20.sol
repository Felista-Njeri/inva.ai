// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @dev Mock ERC20 token for testing purposes
 * @notice This contract is only for testing and should not be used in production
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) Ownable(msg.sender) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Mint tokens to any address (for testing)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Mint tokens to msg.sender (for easy testing)
     */
    function mintToSelf(uint256 amount) external {
        _mint(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from any address (for testing)
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
    
    /**
     * @dev Burn tokens from msg.sender
     */
    function burnFromSelf(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
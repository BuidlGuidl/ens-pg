// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
	constructor() ERC20("Test Token", "TST") {
		_mint(msg.sender, 100 * 10 ** decimals());
	}

	// USDC has 6 decimals
	function decimals() public pure override returns (uint8) {
		return 6;
	}

	function mint(address to, uint256 amount) public {
		_mint(to, amount);
	}
}

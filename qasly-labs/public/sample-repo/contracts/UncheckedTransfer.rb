// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract UncheckedTransfer {
    function drain(IERC20 token, address to, uint256 amount) external {
        token.transfer(to, amount); // VULN: unchecked return
    }
}



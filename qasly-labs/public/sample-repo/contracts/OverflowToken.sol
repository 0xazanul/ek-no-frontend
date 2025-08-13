// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6; // VULN: pre-0.8 no safemath by default

contract OverflowToken {
    mapping(address => uint256) public balanceOf;

    function mint(uint256 amount) external {
        balanceOf[msg.sender] += amount; // VULN: potential overflow
    }
}



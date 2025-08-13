// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract ReentrancyVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "no bal");
        (bool ok, ) = msg.sender.call{value: amount}(""); // VULN: reentrancy
        require(ok, "xfer fail");
        balances[msg.sender] = 0; // set after call
    }
}



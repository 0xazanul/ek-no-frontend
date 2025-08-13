// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract Ownable {
    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(tx.origin == owner, "not owner"); // VULN: using tx.origin
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner; // no zero check
    }
}



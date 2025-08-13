// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract UnsafeInitializer {
    bool public initialized;
    address public owner;

    function init(address _owner) external {
        require(!initialized, "inited");
        owner = _owner; // VULN: anyone can init
        initialized = true;
    }
}



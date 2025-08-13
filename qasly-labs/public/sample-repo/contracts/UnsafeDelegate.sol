// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract UnsafeDelegate {
    address public target;

    function setTarget(address t) external {
        target = t; // VULN: no validation
    }

    function execute(bytes memory data) external payable {
        (bool ok, ) = target.delegatecall(data); // VULN: arbitrary delegatecall
        require(ok, "fail");
    }
}



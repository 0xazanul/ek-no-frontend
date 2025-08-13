// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract LoopGasBomb {
    mapping(uint256 => uint256) public data;

    function writeMany(uint256 n) external {
        for (uint256 i = 0; i < n; i++) { // VULN: unbounded loop
            data[i] = i;
        }
    }
}



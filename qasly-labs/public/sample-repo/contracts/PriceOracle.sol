// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract PriceOracle {
    uint256 public price;

    function setPrice(uint256 p) external { // VULN: no access restriction
        price = p;
    }
}



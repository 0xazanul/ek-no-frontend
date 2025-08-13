// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract AccessControl {
    mapping(address => bool) public admins;

    function addAdmin(address a) external { // VULN: no access control
        admins[a] = true;
    }

    function removeAdmin(address a) external { // VULN: no access control
        admins[a] = false;
    }
}



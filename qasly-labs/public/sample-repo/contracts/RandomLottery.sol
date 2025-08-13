// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract RandomLottery {
    address[] public players;

    function enter() external payable {
        require(msg.value == 0.01 ether, "fee");
        players.push(msg.sender);
    }

    function pickWinner() external {
        require(players.length > 0, "no players");
        uint256 idx = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % players.length; // VULN: predictable randomness
        (bool ok, ) = players[idx].call{value: address(this).balance}("");
        require(ok, "pay fail");
        delete players; // gas heavy clear
    }
}



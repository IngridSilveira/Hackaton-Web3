// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/governance/TimelockController.sol";


contract Timelock is TimelockController {
    constructor(
        uint256 delay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    )
    TimelockController(delay, proposers, executors, admin)
    {}
}
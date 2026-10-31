// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// Sepolia HashRegistry — stamps certificate HMAC hashes on-chain.
contract HashRegistry {
    struct Record {
        bytes32 certHash;
        address issuer;
        uint256 timestamp;
    }

    mapping(string => Record) private records;
    event Stamped(string certId, bytes32 certHash, address issuer, uint256 timestamp);

    function stamp(bytes32 certHash, string calldata certId) external {
        records[certId] = Record(certHash, msg.sender, block.timestamp);
        emit Stamped(certId, certHash, msg.sender, block.timestamp);
    }

    function register(bytes32 certHash, string calldata certId) external {
        require(records[certId].timestamp == 0, "Already registered");
        records[certId] = Record(certHash, msg.sender, block.timestamp);
        emit Stamped(certId, certHash, msg.sender, block.timestamp);
    }

    function getRecord(string calldata certId)
        external
        view
        returns (bytes32 certHash, address issuer, uint256 timestamp)
    {
        Record memory r = records[certId];
        return (r.certHash, r.issuer, r.timestamp);
    }
}

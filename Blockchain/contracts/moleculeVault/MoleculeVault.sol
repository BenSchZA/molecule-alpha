pragma solidity 0.5.10;

import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { IMoleculeVault } from "./IMoleculeVault.sol";

contract MoleculeVault is IMoleculeVault, WhitelistAdminRole {
    address internal collateralToken_;
    uint256 internal taxRate_;

    constructor(address _collateralToken, uint256 _taxRate) public WhitelistAdminRole() {
        require(_taxRate > 0, "Taxation rate too low");
        require(_taxRate < 100, "Taxation rate too high");
        collateralToken_ = _collateralToken;
        taxRate_ = _taxRate;
    }

    function addAdmin(address _moleculeAdmin) external onlyWhitelistAdmin() {
        // Adding the Molecule admin address as an admin
        super.addWhitelistAdmin(_moleculeAdmin);
    }

    function transfer(address _to, uint256 _amount) public onlyWhitelistAdmin() {
        require(IERC20(collateralToken_).transfer(_to, _amount), "Transfer failed");
    }

    function approve(address _spender, uint256 _amount) public onlyWhitelistAdmin() {
        require(IERC20(collateralToken_).approve(_spender, _amount), "Approve failed");
    }

    function collateralToken() public view returns(address) {
        return collateralToken_;
    }

    function taxRate() public view returns(uint256) {
        return taxRate_;
    }
}
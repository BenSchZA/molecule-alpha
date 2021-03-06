pragma solidity 0.5.10;
import { Roles } from "../../_resources/openzeppelin-solidity/access/Roles.sol";

contract AdminManaged{
    using Roles for Roles.Role;

    Roles.Role internal admins_;

    constructor(address _firstAdmin) public {
        admins_.add(_firstAdmin);
    }

    modifier onlyAdmin() {
        require(admins_.has(msg.sender), "User not authorised");
        _;
    }

    /// @dev    Used to add an admin
    /// @param _newAdmin        :address The address of the new admin
    function addAdmin(address _newAdmin) external onlyAdmin {
        admins_.add(_newAdmin);
        assert(admins_.has(_newAdmin));
    }

    /// @dev    Used to remove admins
    /// @param _oldAdmin        :address The address of the previous admin
    function removeAdmin(address _oldAdmin) external onlyAdmin {
        admins_.remove(_oldAdmin);
        assert(!admins_.has(_oldAdmin));
    }

    /// @dev    Checking admin rights
    /// @param _account         :address in question
    /// @return bool
    function isAdmin(address _account) external view returns(bool) {
        return admins_.has(_account);
    }

}
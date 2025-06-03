// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

abstract contract ERC20 {
	function transfer(
		address recipient,
		uint256 amount
	) external virtual returns (bool);

	function balanceOf(address account) external view virtual returns (uint256);
}

contract LargeGrant is Pausable, AccessControl {
	bytes32 public constant STEWARD_ROLE = keccak256("STEWARD_ROLE");

	struct GrantData {
		address builder;
		Stage[] stages;
	}

	struct Stage {
		uint8 number;
		Milestone[] milestones;
	}

	struct Milestone {
		uint8 number;
		uint256 amount;
		address approvedBy;
		address completedBy;
		bool completed;
	}

	// used for view functions
	struct MilestoneData {
		uint8 stageNumber;
		uint8 number;
		uint256 amount;
		address approvedBy;
		address completedBy;
		bool completed;
	}

	mapping(uint256 => GrantData) public grants;
	address public tokenAddress;

	event AddGrant(
		uint256 indexed grantId,
		address indexed to,
		uint256[] amounts
	);
	event AddGrantStage(
		uint256 indexed grantId,
		uint8 stageNumber,
		uint256[] amounts
	);
	event ApproveMilestone(
		uint256 indexed grantId,
		uint8 stageNumber,
		uint8 milestoneNumber,
		address indexed approvedBy
	);
	event CompleteMilestone(
		address indexed completedBy,
		uint256 indexed grantId,
		uint8 stageNumber,
		uint8 milestoneNumber,
		uint256 amount,
		string description,
		string proof
	);
	event BuilderChanged(uint256 indexed grantId, address indexed newBuilder);

	// Custom errors
	error GrantAlreadyExists();
	error GrantDoesNotExist();
	error ZeroAddress();
	error MilestoneZeroAmount();
	error NoMilestones();
	error MilestoneAlreadyCompleted();
	error MilestoneAlreadyApproved();
	error MilestoneNeedsToBeApproved();
	error InsufficientContractFunds();
	error WrongStageNumber();
	error WrongMilestoneNumber();
	error NeedsApprovalFromOtherSteward();
	error AlreadyAdmin();

	modifier validMilestone(
		uint256 _grantId,
		uint8 _stageNumber,
		uint8 _milestoneNumber
	) {
		GrantData storage grant = grants[_grantId];

		if (grant.builder == address(0)) {
			revert GrantDoesNotExist();
		}

		if (_stageNumber == 0 || _stageNumber > grant.stages.length) {
			revert WrongStageNumber();
		}

		if (
			_milestoneNumber > grant.stages[_stageNumber - 1].milestones.length
		) {
			revert WrongMilestoneNumber();
		}

		if (
			grant
				.stages[_stageNumber - 1]
				.milestones[_milestoneNumber - 1]
				.completed
		) {
			revert MilestoneAlreadyCompleted();
		}
		_;
	}

	constructor(address _tokenAddress, address[] memory _initialStewards) {
		tokenAddress = _tokenAddress;
		for (uint i = 0; i < _initialStewards.length; i++) {
			_grantRole(STEWARD_ROLE, _initialStewards[i]);
		}
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	function grantData(
		uint256 _grantId
	)
		external
		view
		returns (address builder, MilestoneData[] memory milestones)
	{
		GrantData storage grant = grants[_grantId];
		builder = grant.builder;

		uint256 milestonesCount = 0;

		for (uint i = 0; i < grant.stages.length; i++) {
			milestonesCount += grant.stages[i].milestones.length;
		}

		milestones = new MilestoneData[](milestonesCount);

		uint256 index = 0;
		for (uint i = 0; i < grant.stages.length; i++) {
			for (uint j = 0; j < grant.stages[i].milestones.length; j++) {
				milestones[index] = MilestoneData({
					stageNumber: uint8(i + 1),
					number: grant.stages[i].milestones[j].number,
					amount: grant.stages[i].milestones[j].amount,
					completed: grant.stages[i].milestones[j].completed,
					approvedBy: grant.stages[i].milestones[j].approvedBy,
					completedBy: grant.stages[i].milestones[j].completedBy
				});
				index++;
			}
		}
	}

	function addGrant(
		address _builder,
		uint256 _grantId,
		uint256[] memory _milestoneAmounts
	) public onlyRole(STEWARD_ROLE) {
		GrantData storage grant = grants[_grantId];

		if (grant.builder != address(0)) {
			revert GrantAlreadyExists();
		}

		if (_builder == address(0)) {
			revert ZeroAddress();
		}

		if (_milestoneAmounts.length == 0) {
			revert NoMilestones();
		}

		grant.builder = _builder;

		Stage storage stage = grant.stages.push();
		stage.number = 1;

		for (uint i = 0; i < _milestoneAmounts.length; i++) {
			uint256 amount = _milestoneAmounts[i];
			if (amount == 0) {
				revert MilestoneZeroAmount();
			}
			stage.milestones.push(
				Milestone({
					number: uint8(i + 1),
					amount: amount,
					completed: false,
					approvedBy: address(0),
					completedBy: address(0)
				})
			);
		}

		emit AddGrant(_grantId, _builder, _milestoneAmounts);
	}

	function addGrantStage(
		uint256 _grantId,
		uint256[] memory _milestoneAmounts
	) public onlyRole(STEWARD_ROLE) {
		GrantData storage grant = grants[_grantId];

		if (grant.builder == address(0)) {
			revert GrantDoesNotExist();
		}

		if (_milestoneAmounts.length == 0) {
			revert NoMilestones();
		}

		Stage storage stage = grant.stages.push();

		stage.number = uint8(grant.stages.length);

		for (uint i = 0; i < _milestoneAmounts.length; i++) {
			uint256 amount = _milestoneAmounts[i];
			if (amount == 0) {
				revert MilestoneZeroAmount();
			}
			stage.milestones.push(
				Milestone({
					number: uint8(i + 1),
					amount: amount,
					completed: false,
					approvedBy: address(0),
					completedBy: address(0)
				})
			);
		}

		emit AddGrantStage(
			_grantId,
			uint8(grant.stages.length),
			_milestoneAmounts
		);
	}

	function approveMilestone(
		uint256 _grantId,
		uint8 _stageNumber,
		uint8 _milestoneNumber
	)
		public
		whenNotPaused
		onlyRole(STEWARD_ROLE)
		validMilestone(_grantId, _stageNumber, _milestoneNumber)
	{
		GrantData storage grant = grants[_grantId];

		if (
			grant
				.stages[_stageNumber - 1]
				.milestones[_milestoneNumber - 1]
				.approvedBy != address(0)
		) {
			revert MilestoneAlreadyApproved();
		}

		grant
			.stages[_stageNumber - 1]
			.milestones[_milestoneNumber - 1]
			.approvedBy = msg.sender;

		emit ApproveMilestone(
			_grantId,
			_stageNumber,
			_milestoneNumber,
			msg.sender
		);
	}

	function completeMilestone(
		uint256 _grantId,
		uint8 _stageNumber,
		uint8 _milestoneNumber,
		string memory _description,
		string memory _proof
	)
		public
		whenNotPaused
		onlyRole(STEWARD_ROLE)
		validMilestone(_grantId, _stageNumber, _milestoneNumber)
	{
		GrantData storage grant = grants[_grantId];

		if (
			grant
				.stages[_stageNumber - 1]
				.milestones[_milestoneNumber - 1]
				.approvedBy == address(0)
		) {
			revert MilestoneNeedsToBeApproved();
		}

		if (
			grant
				.stages[_stageNumber - 1]
				.milestones[_milestoneNumber - 1]
				.approvedBy == msg.sender
		) {
			revert NeedsApprovalFromOtherSteward();
		}

		uint256 amount = grant
			.stages[_stageNumber - 1]
			.milestones[_milestoneNumber - 1]
			.amount;

		if (ERC20(tokenAddress).balanceOf(address(this)) < amount)
			revert InsufficientContractFunds();

		ERC20(tokenAddress).transfer(grant.builder, amount);

		grant
			.stages[_stageNumber - 1]
			.milestones[_milestoneNumber - 1]
			.completed = true;

		grant
			.stages[_stageNumber - 1]
			.milestones[_milestoneNumber - 1]
			.completedBy = msg.sender;

		emit CompleteMilestone(
			msg.sender,
			_grantId,
			_stageNumber,
			_milestoneNumber,
			amount,
			_description,
			_proof
		);
	}

	function changeBuilderAddress(
		uint256 _grantId,
		address _newBuilder
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		if (_newBuilder == address(0)) {
			revert ZeroAddress();
		}

		GrantData storage grant = grants[_grantId];

		if (grant.builder == address(0)) {
			revert GrantDoesNotExist();
		}

		grant.builder = _newBuilder;

		emit BuilderChanged(_grantId, _newBuilder);
	}

	function addSteward(
		address newSteward
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		grantRole(STEWARD_ROLE, newSteward);
	}

	function removeSteward(
		address steward
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		revokeRole(STEWARD_ROLE, steward);
	}

	function transferAdmin(
		address newAdmin
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		if (hasRole(DEFAULT_ADMIN_ROLE, newAdmin)) revert AlreadyAdmin();

		grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
		renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
	}

	function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
		_pause();
	}

	function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
		_unpause();
	}

	function withdrawFunds(address _token) public onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 remainingBalance = ERC20(_token).balanceOf(address(this));

		if (remainingBalance > 0) {
			ERC20(_token).transfer(msg.sender, remainingBalance);
		}
	}
}

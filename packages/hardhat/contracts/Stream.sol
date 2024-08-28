// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// TODO: Add comments
contract Stream is Ownable {
	struct GrantStream {
		uint256 cap;
		uint256 last;
		uint256 amountLeft;
		uint8 grantNumber;
		uint8 stageNumber;
		address builder;
	}

	mapping(uint256 => GrantStream) public grantStreams;
	uint256 public nextGrantId = 1;

	mapping(address => uint256[]) public builderGrants;

	// uint256 public constant FULL_STREAM_UNLOCK_PERIOD = 180; // 3 minutes
	uint256 public constant FULL_STREAM_UNLOCK_PERIOD = 2592000; // 30 days
	// TODO: remove the logic of DUST_THRESHOLD if not needed
	uint256 public constant DUST_THRESHOLD = 1000000000000000; // 0.001 ETH

	event Withdraw(
		address indexed to,
		uint256 amount,
		string reason,
		uint256 grantId,
		uint8 grantNumber,
		uint8 stageNumber
	);
	event AddGrant(uint256 indexed grantId, address indexed to, uint256 amount);
	event MoveGrantToNextStage(
		uint256 indexed grantId,
		address indexed to,
		uint256 amount,
		uint8 grantNumber,
		uint8 stageNumber
	);
	event UpdateGrant(
		uint256 indexed grantId,
		address indexed to,
		uint256 cap,
		uint256 last,
		uint256 amountLeft,
		uint8 grantNumber,
		uint8 stageNumber
	);

	// Custom errors
	error NoActiveStream();
	error InsufficientContractFunds();
	error UnauthorizedWithdrawal();
	error InsufficientStreamFunds();
	error FailedToSendEther();
	error PreviousAmountNotFullyWithdrawn();

	constructor(address _owner) {
		_transferOwnership(_owner);
	}

	function unlockedGrantAmount(
		uint256 _grantId
	) public view returns (uint256) {
		GrantStream memory grantStream = grantStreams[_grantId];
		if (grantStream.cap == 0) revert NoActiveStream();

		if (grantStream.amountLeft == 0) {
			return 0;
		}

		uint256 elapsedTime = block.timestamp - grantStream.last;
		uint256 unlockedAmount = (grantStream.cap * elapsedTime) /
			FULL_STREAM_UNLOCK_PERIOD;

		return
			unlockedAmount > grantStream.amountLeft
				? grantStream.amountLeft
				: unlockedAmount;
	}

	function addGrantStream(
		address _builder,
		uint256 _cap,
		uint8 _grantNumber
	) public onlyOwner returns (uint256) {
		uint256 grantId = nextGrantId++;
		grantStreams[grantId] = GrantStream({
			cap: _cap,
			last: block.timestamp,
			amountLeft: _cap,
			grantNumber: _grantNumber,
			stageNumber: 1,
			builder: _builder
		});
		builderGrants[_builder].push(grantId);
		emit AddGrant(grantId, _builder, _cap);
		return grantId;
	}

	function moveGrantToNextStage(
		uint256 _grantId,
		uint256 _cap
	) public onlyOwner {
		GrantStream storage grantStream = grantStreams[_grantId];
		if (grantStream.cap == 0) revert NoActiveStream();

		if (grantStream.amountLeft > DUST_THRESHOLD)
			revert PreviousAmountNotFullyWithdrawn();

		if (grantStream.amountLeft > 0) {
			(bool sent, ) = payable(grantStream.builder).call{
				value: grantStream.amountLeft
			}("");
			if (!sent) revert FailedToSendEther();
		}

		grantStream.cap = _cap;
		grantStream.last = block.timestamp;
		grantStream.amountLeft = _cap;
		grantStream.stageNumber += 1;

		emit MoveGrantToNextStage(
			_grantId,
			grantStream.builder,
			_cap,
			grantStream.grantNumber,
			grantStream.stageNumber
		);
	}

	function updateGrant(
		uint256 _grantId,
		uint256 _cap,
		uint256 _last,
		uint256 _amountLeft,
		uint8 _stageNumber
	) public onlyOwner {
		GrantStream storage grantStream = grantStreams[_grantId];
		if (grantStream.cap == 0) revert NoActiveStream();
		grantStream.cap = _cap;
		grantStream.last = _last;
		grantStream.amountLeft = _amountLeft;
		grantStream.stageNumber = _stageNumber;

		emit UpdateGrant(
			_grantId,
			grantStream.builder,
			_cap,
			grantStream.last,
			grantStream.amountLeft,
			grantStream.grantNumber,
			grantStream.stageNumber
		);
	}

	function streamWithdraw(
		uint256 _grantId,
		uint256 _amount,
		string memory _reason
	) public {
		if (address(this).balance < _amount) revert InsufficientContractFunds();
		GrantStream storage grantStream = grantStreams[_grantId];
		if (grantStream.cap == 0) revert NoActiveStream();
		if (msg.sender != grantStream.builder) revert UnauthorizedWithdrawal();

		uint256 totalAmountCanWithdraw = unlockedGrantAmount(_grantId);
		if (totalAmountCanWithdraw < _amount) revert InsufficientStreamFunds();

		uint256 elapsedTime = block.timestamp - grantStream.last;
		uint256 timeToDeduct = (elapsedTime * _amount) / totalAmountCanWithdraw;

		grantStream.last = grantStream.last + timeToDeduct;
		grantStream.amountLeft -= _amount;

		(bool sent, ) = msg.sender.call{ value: _amount }("");
		if (!sent) revert FailedToSendEther();

		emit Withdraw(
			msg.sender,
			_amount,
			_reason,
			_grantId,
			grantStream.grantNumber,
			grantStream.stageNumber
		);
	}

	function getBuilderGrantCount(
		address _builder
	) public view returns (uint256) {
		return builderGrants[_builder].length;
	}

	receive() external payable {}

	fallback() external payable {}
}

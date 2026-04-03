#pragma once

#include "orderbook/Types.hpp"

struct TradeInfo
{
	OrderId orderId;
	Price price;
	Quantity quantity;
};

class Trade
{
public:
	Trade(const TradeInfo& bidTrade, const TradeInfo& askTrade)
		: bidTrade_{ bidTrade }
		, askTrade_{ askTrade }
	{ }

	const TradeInfo& GetBidTrade() const { return bidTrade_; }
	const TradeInfo& GetAskTrade() const { return askTrade_; }

private:
	TradeInfo bidTrade_;
	TradeInfo askTrade_;
};

#pragma once

#include "orderbook/Types.hpp"
#include "orderbook/Order.hpp"
#include "orderbook/OrderModify.hpp"
#include "orderbook/Trade.hpp"
#include "orderbook/OrderBookLevelInfos.hpp"

#include <map>
#include <unordered_map>
#include <functional>

class OrderBook
{
public:
	Trades AddOrder(OrderPointer order);
	void CancelOrder(OrderId orderId);
	Trades ModifyOrder(OrderModify orderModify);

	std::size_t Size() const;
	OrderBookLevelInfos GetOrderInfos() const;

private:
	struct OrderEntry
	{
		OrderPointer order_;
		OrderPointers::iterator location_;
	};

	// Bids sorted descending — best (highest) bid at begin()
	using Bids = std::map<Price, OrderPointers, std::greater<Price>>;
	// Asks sorted ascending — best (lowest) ask at begin()
	using Asks = std::map<Price, OrderPointers, std::less<Price>>;

	Bids bids_;
	Asks asks_;
	std::unordered_map<OrderId, OrderEntry> orders_;

	bool CanMatch(Side side, Price price) const;
	Trades MatchOrders();
};

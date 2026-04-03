#include "orderbook/OrderBook.hpp"

#include <numeric>
#include <stdexcept>

bool OrderBook::CanMatch(Side side, Price price) const
{
	if (side == Side::Buy)
	{
		if (asks_.empty())
			return false;
		const auto& [bestAskPrice, bestAskOrders] = *asks_.begin();
		return price >= bestAskPrice;
	}
	else
	{
		if (bids_.empty())
			return false;
		const auto& [bestBidPrice, bestBidOrders] = *bids_.begin();
		return price <= bestBidPrice;
	}
}

Trades OrderBook::MatchOrders()
{
	Trades trades;
	trades.reserve(orders_.size());

	while (true)
	{
		if (bids_.empty() || asks_.empty())
			break;

		auto& [bidPrice, bidOrders] = *bids_.begin();
		auto& [askPrice, askOrders] = *asks_.begin();

		if (bidPrice < askPrice)
			break;

		while (!bidOrders.empty() && !askOrders.empty())
		{
			auto& bidOrder = bidOrders.front();
			auto& askOrder = askOrders.front();

			Quantity fillQuantity = std::min(bidOrder->GetRemainingQuantity(), askOrder->GetRemainingQuantity());

			bidOrder->Fill(fillQuantity);
			askOrder->Fill(fillQuantity);

			trades.push_back(Trade{
				TradeInfo{ bidOrder->GetOrderId(), bidPrice, fillQuantity },
				TradeInfo{ askOrder->GetOrderId(), askPrice, fillQuantity }
			});

			if (bidOrder->IsFilled())
			{
				orders_.erase(bidOrder->GetOrderId());
				bidOrders.pop_front();
			}

			if (askOrder->IsFilled())
			{
				orders_.erase(askOrder->GetOrderId());
				askOrders.pop_front();
			}
		}

		if (bidOrders.empty())
			bids_.erase(bids_.begin());

		if (askOrders.empty())
			asks_.erase(asks_.begin());
	}

	return trades;
}

Trades OrderBook::AddOrder(OrderPointer order)
{
	if (orders_.contains(order->GetOrderId()))
		throw std::logic_error("Order with this ID already exists");

	if (order->GetOrderType() == OrderType::FillAndKill && !CanMatch(order->GetSide(), order->GetPrice()))
		return {};

	OrderPointers::iterator orderIterator;

	if (order->GetSide() == Side::Buy)
	{
		auto& levelOrders = bids_[order->GetPrice()];
		levelOrders.push_back(order);
		orderIterator = std::prev(levelOrders.end());
	}
	else
	{
		auto& levelOrders = asks_[order->GetPrice()];
		levelOrders.push_back(order);
		orderIterator = std::prev(levelOrders.end());
	}

	orders_.insert({ order->GetOrderId(), OrderEntry{ order, orderIterator } });

	Trades trades = MatchOrders();

	// FillAndKill: cancel any remaining quantity that wasn't filled
	if (order->GetOrderType() == OrderType::FillAndKill && !order->IsFilled())
		CancelOrder(order->GetOrderId());

	return trades;
}

void OrderBook::CancelOrder(OrderId orderId)
{
	auto it = orders_.find(orderId);
	if (it == orders_.end())
		throw std::logic_error("Order not found for cancellation");

	const auto& [id, entry] = *it;
	auto& order = entry.order_;

	if (order->GetSide() == Side::Buy)
	{
		auto priceIt = bids_.find(order->GetPrice());
		priceIt->second.erase(entry.location_);
		if (priceIt->second.empty())
			bids_.erase(priceIt);
	}
	else
	{
		auto priceIt = asks_.find(order->GetPrice());
		priceIt->second.erase(entry.location_);
		if (priceIt->second.empty())
			asks_.erase(priceIt);
	}

	orders_.erase(it);
}

Trades OrderBook::ModifyOrder(OrderModify orderModify)
{
	auto it = orders_.find(orderModify.GetOrderId());
	if (it == orders_.end())
		throw std::logic_error("Order not found for modification");

	OrderType existingType = it->second.order_->GetOrderType();

	CancelOrder(orderModify.GetOrderId());

	return AddOrder(orderModify.ToOrder(existingType));
}

std::size_t OrderBook::Size() const
{
	return orders_.size();
}

OrderBookLevelInfos OrderBook::GetOrderInfos() const
{
	LevelInfos bidInfos;
	bidInfos.reserve(bids_.size());

	for (const auto& [price, orders] : bids_)
	{
		Quantity totalQuantity = std::accumulate(
			orders.begin(), orders.end(), Quantity{ 0 },
			[](Quantity sum, const OrderPointer& order)
			{
				return sum + order->GetRemainingQuantity();
			}
		);
		bidInfos.push_back(LevelInfo{ price, totalQuantity });
	}

	LevelInfos askInfos;
	askInfos.reserve(asks_.size());

	for (const auto& [price, orders] : asks_)
	{
		Quantity totalQuantity = std::accumulate(
			orders.begin(), orders.end(), Quantity{ 0 },
			[](Quantity sum, const OrderPointer& order)
			{
				return sum + order->GetRemainingQuantity();
			}
		);
		askInfos.push_back(LevelInfo{ price, totalQuantity });
	}

	return OrderBookLevelInfos{ bidInfos, askInfos };
}

#include "orderbook/OrderBook.hpp"

#include <iostream>
#include <format>

void PrintBookState(const OrderBook& book)
{
	auto infos = book.GetOrderInfos();

	std::cout << "\n=== Order Book ===" << std::endl;
	std::cout << "--- Asks ---" << std::endl;

	auto asks = infos.GetAsks();
	for (auto it = asks.rbegin(); it != asks.rend(); ++it)
		std::cout << std::format("  Price: {:>6}  |  Qty: {}", it->price, it->quantity) << std::endl;

	std::cout << "--- Bids ---" << std::endl;

	for (const auto& level : infos.GetBids())
		std::cout << std::format("  Price: {:>6}  |  Qty: {}", level.price, level.quantity) << std::endl;

	std::cout << std::format("Total orders: {}\n", book.Size()) << std::endl;
}

void PrintTrades(const Trades& trades)
{
	for (const auto& trade : trades)
	{
		std::cout << std::format("  TRADE: Bid #{} <-> Ask #{} | Price: {} | Qty: {}",
			trade.GetBidTrade().orderId,
			trade.GetAskTrade().orderId,
			trade.GetBidTrade().price,
			trade.GetBidTrade().quantity) << std::endl;
	}
}

int main()
{
	OrderBook book;

	auto trades = book.AddOrder(std::make_shared<Order>(OrderType::GoodTillCancel, 1, Side::Buy, 100, 50));
	PrintTrades(trades);

	trades = book.AddOrder(std::make_shared<Order>(OrderType::GoodTillCancel, 2, Side::Buy, 99, 30));
	PrintTrades(trades);

	trades = book.AddOrder(std::make_shared<Order>(OrderType::GoodTillCancel, 3, Side::Sell, 102, 40));
	PrintTrades(trades);

	trades = book.AddOrder(std::make_shared<Order>(OrderType::GoodTillCancel, 4, Side::Sell, 101, 25));
	PrintTrades(trades);

	PrintBookState(book);

	// This sell at 100 will match the buy at 100
	std::cout << "--- Submitting Sell @ 100 qty 20 ---" << std::endl;
	trades = book.AddOrder(std::make_shared<Order>(OrderType::GoodTillCancel, 5, Side::Sell, 100, 20));
	PrintTrades(trades);

	PrintBookState(book);

	// FillAndKill: tries to buy at 101, matches the sell at 101, rest is cancelled
	std::cout << "--- Submitting FillAndKill Buy @ 101 qty 50 ---" << std::endl;
	trades = book.AddOrder(std::make_shared<Order>(OrderType::FillAndKill, 6, Side::Buy, 101, 50));
	PrintTrades(trades);

	PrintBookState(book);

	return 0;
}

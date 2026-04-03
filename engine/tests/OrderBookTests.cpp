#include <gtest/gtest.h>
#include "orderbook/OrderBook.hpp"

class OrderBookTest : public ::testing::Test
{
protected:
	OrderBook book_;

	OrderPointer MakeOrder(OrderId id, Side side, Price price, Quantity quantity,
		OrderType type = OrderType::GoodTillCancel)
	{
		return std::make_shared<Order>(type, id, side, price, quantity);
	}
};

// --- Basic Operations ---

TEST_F(OrderBookTest, EmptyBookHasZeroSize)
{
	EXPECT_EQ(book_.Size(), 0);
}

TEST_F(OrderBookTest, EmptyBookReturnsEmptyLevels)
{
	auto infos = book_.GetOrderInfos();
	EXPECT_TRUE(infos.GetBids().empty());
	EXPECT_TRUE(infos.GetAsks().empty());
}

TEST_F(OrderBookTest, AddSingleBuyOrderRestsOnBook)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 50));

	EXPECT_EQ(book_.Size(), 1);
	auto infos = book_.GetOrderInfos();
	ASSERT_EQ(infos.GetBids().size(), 1);
	EXPECT_EQ(infos.GetBids()[0].price, 100);
	EXPECT_EQ(infos.GetBids()[0].quantity, 50);
	EXPECT_TRUE(infos.GetAsks().empty());
}

TEST_F(OrderBookTest, AddSingleSellOrderRestsOnBook)
{
	book_.AddOrder(MakeOrder(1, Side::Sell, 100, 30));

	EXPECT_EQ(book_.Size(), 1);
	auto infos = book_.GetOrderInfos();
	ASSERT_EQ(infos.GetAsks().size(), 1);
	EXPECT_EQ(infos.GetAsks()[0].price, 100);
	EXPECT_EQ(infos.GetAsks()[0].quantity, 30);
}

TEST_F(OrderBookTest, DuplicateOrderIdThrows)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 50));
	EXPECT_THROW(book_.AddOrder(MakeOrder(1, Side::Sell, 105, 30)), std::logic_error);
}

// --- Matching ---

TEST_F(OrderBookTest, ExactMatchGeneratesTrade)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 50));
	auto trades = book_.AddOrder(MakeOrder(2, Side::Sell, 100, 50));

	ASSERT_EQ(trades.size(), 1);
	EXPECT_EQ(trades[0].GetBidTrade().orderId, 1);
	EXPECT_EQ(trades[0].GetAskTrade().orderId, 2);
	EXPECT_EQ(trades[0].GetBidTrade().quantity, 50);
	EXPECT_EQ(book_.Size(), 0);
}

TEST_F(OrderBookTest, BuyAtHigherPriceMatchesSell)
{
	book_.AddOrder(MakeOrder(1, Side::Sell, 100, 30));
	auto trades = book_.AddOrder(MakeOrder(2, Side::Buy, 105, 30));

	ASSERT_EQ(trades.size(), 1);
	EXPECT_EQ(trades[0].GetBidTrade().quantity, 30);
	EXPECT_EQ(book_.Size(), 0);
}

TEST_F(OrderBookTest, NoMatchWhenBidBelowAsk)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 98, 50));
	auto trades = book_.AddOrder(MakeOrder(2, Side::Sell, 100, 30));

	EXPECT_TRUE(trades.empty());
	EXPECT_EQ(book_.Size(), 2);
}

TEST_F(OrderBookTest, PartialFillLeavesRemainderOnBook)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 50));
	auto trades = book_.AddOrder(MakeOrder(2, Side::Sell, 100, 20));

	ASSERT_EQ(trades.size(), 1);
	EXPECT_EQ(trades[0].GetBidTrade().quantity, 20);
	EXPECT_EQ(book_.Size(), 1);

	auto infos = book_.GetOrderInfos();
	ASSERT_EQ(infos.GetBids().size(), 1);
	EXPECT_EQ(infos.GetBids()[0].quantity, 30);
}

TEST_F(OrderBookTest, SellPartialFillLeavesRemainderOnBook)
{
	book_.AddOrder(MakeOrder(1, Side::Sell, 100, 50));
	auto trades = book_.AddOrder(MakeOrder(2, Side::Buy, 100, 20));

	ASSERT_EQ(trades.size(), 1);
	EXPECT_EQ(trades[0].GetAskTrade().quantity, 20);
	EXPECT_EQ(book_.Size(), 1);

	auto infos = book_.GetOrderInfos();
	ASSERT_EQ(infos.GetAsks().size(), 1);
	EXPECT_EQ(infos.GetAsks()[0].quantity, 30);
}

// --- Price-Time Priority ---

TEST_F(OrderBookTest, TimePriorityAtSamePrice)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 30));
	book_.AddOrder(MakeOrder(2, Side::Buy, 100, 30));

	auto trades = book_.AddOrder(MakeOrder(3, Side::Sell, 100, 30));

	ASSERT_EQ(trades.size(), 1);
	// Order 1 was first, so it matches first
	EXPECT_EQ(trades[0].GetBidTrade().orderId, 1);
	EXPECT_EQ(book_.Size(), 1);
}

TEST_F(OrderBookTest, PricePriorityHigherBidMatchesFirst)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 99, 30));
	book_.AddOrder(MakeOrder(2, Side::Buy, 101, 30));

	auto trades = book_.AddOrder(MakeOrder(3, Side::Sell, 99, 30));

	ASSERT_EQ(trades.size(), 1);
	// Order 2 has higher bid, matches first
	EXPECT_EQ(trades[0].GetBidTrade().orderId, 2);
}

TEST_F(OrderBookTest, MultiLevelMatchingWalksThroughPriceLevels)
{
	book_.AddOrder(MakeOrder(1, Side::Sell, 100, 20));
	book_.AddOrder(MakeOrder(2, Side::Sell, 101, 30));

	auto trades = book_.AddOrder(MakeOrder(3, Side::Buy, 101, 40));

	// Should fill 20 at price 100, then 20 at price 101
	ASSERT_EQ(trades.size(), 2);
	EXPECT_EQ(trades[0].GetAskTrade().orderId, 1);
	EXPECT_EQ(trades[0].GetBidTrade().quantity, 20);
	EXPECT_EQ(trades[1].GetAskTrade().orderId, 2);
	EXPECT_EQ(trades[1].GetBidTrade().quantity, 20);

	// 10 remaining on ask at 101
	EXPECT_EQ(book_.Size(), 1);
	auto infos = book_.GetOrderInfos();
	ASSERT_EQ(infos.GetAsks().size(), 1);
	EXPECT_EQ(infos.GetAsks()[0].quantity, 10);
}

// --- FillAndKill ---

TEST_F(OrderBookTest, FillAndKillWithNoMatchDoesNotRestOnBook)
{
	auto trades = book_.AddOrder(MakeOrder(1, Side::Buy, 100, 50, OrderType::FillAndKill));

	EXPECT_TRUE(trades.empty());
	EXPECT_EQ(book_.Size(), 0);
}

TEST_F(OrderBookTest, FillAndKillPartialFillCancelsRemainder)
{
	book_.AddOrder(MakeOrder(1, Side::Sell, 100, 20));

	auto trades = book_.AddOrder(MakeOrder(2, Side::Buy, 100, 50, OrderType::FillAndKill));

	ASSERT_EQ(trades.size(), 1);
	EXPECT_EQ(trades[0].GetBidTrade().quantity, 20);
	// FillAndKill order should NOT remain on book
	EXPECT_EQ(book_.Size(), 0);
}

TEST_F(OrderBookTest, FillAndKillFullFillWorks)
{
	book_.AddOrder(MakeOrder(1, Side::Sell, 100, 50));

	auto trades = book_.AddOrder(MakeOrder(2, Side::Buy, 100, 50, OrderType::FillAndKill));

	ASSERT_EQ(trades.size(), 1);
	EXPECT_EQ(trades[0].GetBidTrade().quantity, 50);
	EXPECT_EQ(book_.Size(), 0);
}

// --- Cancel ---

TEST_F(OrderBookTest, CancelRemovesOrderFromBook)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 50));
	book_.CancelOrder(1);

	EXPECT_EQ(book_.Size(), 0);
	auto infos = book_.GetOrderInfos();
	EXPECT_TRUE(infos.GetBids().empty());
}

TEST_F(OrderBookTest, CancelNonExistentOrderThrows)
{
	EXPECT_THROW(book_.CancelOrder(999), std::logic_error);
}

TEST_F(OrderBookTest, CancelOneOfMultipleAtSamePrice)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 30));
	book_.AddOrder(MakeOrder(2, Side::Buy, 100, 20));

	book_.CancelOrder(1);

	EXPECT_EQ(book_.Size(), 1);
	auto infos = book_.GetOrderInfos();
	ASSERT_EQ(infos.GetBids().size(), 1);
	EXPECT_EQ(infos.GetBids()[0].quantity, 20);
}

// --- Modify ---

TEST_F(OrderBookTest, ModifyChangesOrderPriceAndQuantity)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 50));

	OrderModify modify{ 1, Side::Buy, 105, 30 };
	auto trades = book_.ModifyOrder(modify);

	EXPECT_TRUE(trades.empty());
	EXPECT_EQ(book_.Size(), 1);

	auto infos = book_.GetOrderInfos();
	ASSERT_EQ(infos.GetBids().size(), 1);
	EXPECT_EQ(infos.GetBids()[0].price, 105);
	EXPECT_EQ(infos.GetBids()[0].quantity, 30);
}

TEST_F(OrderBookTest, ModifyCanTriggerMatch)
{
	book_.AddOrder(MakeOrder(1, Side::Sell, 100, 30));
	book_.AddOrder(MakeOrder(2, Side::Buy, 95, 30));

	// Modify buy order to a price that crosses the spread
	OrderModify modify{ 2, Side::Buy, 100, 30 };
	auto trades = book_.ModifyOrder(modify);

	ASSERT_EQ(trades.size(), 1);
	EXPECT_EQ(trades[0].GetBidTrade().quantity, 30);
	EXPECT_EQ(book_.Size(), 0);
}

TEST_F(OrderBookTest, ModifyNonExistentOrderThrows)
{
	OrderModify modify{ 999, Side::Buy, 100, 30 };
	EXPECT_THROW(book_.ModifyOrder(modify), std::logic_error);
}

// --- Level Info ---

TEST_F(OrderBookTest, LevelInfoAggregatesQuantityAtSamePrice)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 100, 30));
	book_.AddOrder(MakeOrder(2, Side::Buy, 100, 20));

	auto infos = book_.GetOrderInfos();
	ASSERT_EQ(infos.GetBids().size(), 1);
	EXPECT_EQ(infos.GetBids()[0].quantity, 50);
}

TEST_F(OrderBookTest, BidsAreSortedDescendingAsksAscending)
{
	book_.AddOrder(MakeOrder(1, Side::Buy, 99, 10));
	book_.AddOrder(MakeOrder(2, Side::Buy, 101, 20));
	book_.AddOrder(MakeOrder(3, Side::Buy, 100, 15));

	book_.AddOrder(MakeOrder(4, Side::Sell, 105, 10));
	book_.AddOrder(MakeOrder(5, Side::Sell, 103, 20));
	book_.AddOrder(MakeOrder(6, Side::Sell, 104, 15));

	auto infos = book_.GetOrderInfos();

	// Bids: 101, 100, 99 (descending)
	ASSERT_EQ(infos.GetBids().size(), 3);
	EXPECT_EQ(infos.GetBids()[0].price, 101);
	EXPECT_EQ(infos.GetBids()[1].price, 100);
	EXPECT_EQ(infos.GetBids()[2].price, 99);

	// Asks: 103, 104, 105 (ascending)
	ASSERT_EQ(infos.GetAsks().size(), 3);
	EXPECT_EQ(infos.GetAsks()[0].price, 103);
	EXPECT_EQ(infos.GetAsks()[1].price, 104);
	EXPECT_EQ(infos.GetAsks()[2].price, 105);
}

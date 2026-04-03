#include <gtest/gtest.h>
#include "orderbook/Trade.hpp"

TEST(TradeTest, ConstructionStoresBothSides)
{
	TradeInfo bidInfo{ 1, 100, 50 };
	TradeInfo askInfo{ 2, 100, 50 };

	Trade trade{ bidInfo, askInfo };

	EXPECT_EQ(trade.GetBidTrade().orderId, 1);
	EXPECT_EQ(trade.GetBidTrade().price, 100);
	EXPECT_EQ(trade.GetBidTrade().quantity, 50);

	EXPECT_EQ(trade.GetAskTrade().orderId, 2);
	EXPECT_EQ(trade.GetAskTrade().price, 100);
	EXPECT_EQ(trade.GetAskTrade().quantity, 50);
}

TEST(TradeTest, DifferentPricesOnEachSide)
{
	TradeInfo bidInfo{ 10, 105, 30 };
	TradeInfo askInfo{ 20, 103, 30 };

	Trade trade{ bidInfo, askInfo };

	EXPECT_EQ(trade.GetBidTrade().price, 105);
	EXPECT_EQ(trade.GetAskTrade().price, 103);
	EXPECT_EQ(trade.GetBidTrade().quantity, trade.GetAskTrade().quantity);
}

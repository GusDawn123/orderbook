#include <gtest/gtest.h>
#include "orderbook/Order.hpp"

class OrderTest : public ::testing::Test
{
protected:
	OrderPointer CreateDefaultOrder()
	{
		return std::make_shared<Order>(
			OrderType::GoodTillCancel, 1, Side::Buy, 100, 50
		);
	}
};

TEST_F(OrderTest, ConstructionSetsAllFields)
{
	auto order = std::make_shared<Order>(
		OrderType::FillAndKill, 42, Side::Sell, 200, 75
	);

	EXPECT_EQ(order->GetOrderType(), OrderType::FillAndKill);
	EXPECT_EQ(order->GetOrderId(), 42);
	EXPECT_EQ(order->GetSide(), Side::Sell);
	EXPECT_EQ(order->GetPrice(), 200);
	EXPECT_EQ(order->GetInitialQuantity(), 75);
	EXPECT_EQ(order->GetRemainingQuantity(), 75);
	EXPECT_EQ(order->GetFilledQuantity(), 0);
	EXPECT_FALSE(order->IsFilled());
}

TEST_F(OrderTest, FillReducesRemainingQuantity)
{
	auto order = CreateDefaultOrder();
	order->Fill(20);

	EXPECT_EQ(order->GetRemainingQuantity(), 30);
	EXPECT_EQ(order->GetFilledQuantity(), 20);
	EXPECT_FALSE(order->IsFilled());
}

TEST_F(OrderTest, FillEntireQuantityMarksFilled)
{
	auto order = CreateDefaultOrder();
	order->Fill(50);

	EXPECT_EQ(order->GetRemainingQuantity(), 0);
	EXPECT_EQ(order->GetFilledQuantity(), 50);
	EXPECT_TRUE(order->IsFilled());
}

TEST_F(OrderTest, MultipleFillsAccumulate)
{
	auto order = CreateDefaultOrder();
	order->Fill(10);
	order->Fill(15);
	order->Fill(25);

	EXPECT_EQ(order->GetRemainingQuantity(), 0);
	EXPECT_EQ(order->GetFilledQuantity(), 50);
	EXPECT_TRUE(order->IsFilled());
}

TEST_F(OrderTest, OverfillThrowsLogicError)
{
	auto order = CreateDefaultOrder();

	EXPECT_THROW(order->Fill(51), std::logic_error);
}

TEST_F(OrderTest, FillAfterPartialOverfillThrows)
{
	auto order = CreateDefaultOrder();
	order->Fill(30);

	EXPECT_THROW(order->Fill(21), std::logic_error);
}

TEST_F(OrderTest, FillZeroQuantityIsValid)
{
	auto order = CreateDefaultOrder();
	order->Fill(0);

	EXPECT_EQ(order->GetRemainingQuantity(), 50);
	EXPECT_EQ(order->GetFilledQuantity(), 0);
}

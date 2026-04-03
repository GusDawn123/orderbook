#pragma once

#include "orderbook/Types.hpp"
#include "orderbook/Order.hpp"

class OrderModify
{
public:
	OrderModify(OrderId orderId, Side side, Price price, Quantity quantity)
		: orderId_{ orderId }
		, side_{ side }
		, price_{ price }
		, quantity_{ quantity }
	{ }

	OrderId GetOrderId() const { return orderId_; }
	Side GetSide() const { return side_; }
	Price GetPrice() const { return price_; }
	Quantity GetQuantity() const { return quantity_; }

	OrderPointer ToOrder(OrderType orderType) const
	{
		return std::make_shared<Order>(orderType, GetOrderId(), GetSide(), GetPrice(), GetQuantity());
	}

private:
	OrderId orderId_;
	Side side_;
	Price price_;
	Quantity quantity_;
};

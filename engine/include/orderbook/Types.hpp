#pragma once

#include <cstdint>
#include <list>
#include <memory>
#include <vector>

enum class OrderType
{
	GoodTillCancel,
	FillAndKill,
};

enum class Side
{
	Buy,
	Sell,
};

using Price = std::int32_t;
using Quantity = std::uint32_t;
using OrderId = std::uint64_t;

class Order;
class Trade;

using OrderPointer = std::shared_ptr<Order>;
using OrderPointers = std::list<OrderPointer>;
using Trades = std::vector<Trade>;

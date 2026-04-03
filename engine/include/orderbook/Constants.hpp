#pragma once

#include "orderbook/Types.hpp"

#include <limits>

struct Constants
{
	static constexpr Price InvalidPrice = std::numeric_limits<Price>::min();
	static constexpr OrderId InvalidOrderId = 0;
};

#pragma once

#include "orderbook/Types.hpp"

struct LevelInfo
{
	Price price;
	Quantity quantity;
};

using LevelInfos = std::vector<LevelInfo>;

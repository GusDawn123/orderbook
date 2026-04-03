#pragma once

#include "orderbook/OrderBook.hpp"

#include <string>
#include <sstream>
#include <iostream>

class JsonEngine
{
public:
	void Run();

private:
	OrderBook book_;
	OrderId nextOrderId_{ 1 };

	std::string HandleCommand(const std::string& line);
	std::string HandleAdd(std::istringstream& stream);
	std::string HandleCancel(std::istringstream& stream);
	std::string HandleModify(std::istringstream& stream);
	std::string HandleSnapshot();
	std::string FormatTrades(const Trades& trades);
	std::string FormatBookState();
};

#include "orderbook/JsonEngine.hpp"

#include <format>

void JsonEngine::Run()
{
	std::string line;
	while (std::getline(std::cin, line))
	{
		if (line.empty())
			continue;
		std::string response = HandleCommand(line);
		std::cout << response << std::endl;
		std::cout.flush();
	}
}

std::string JsonEngine::HandleCommand(const std::string& line)
{
	std::istringstream stream(line);
	std::string action;
	stream >> action;

	try
	{
		if (action == "ADD")
			return HandleAdd(stream);
		if (action == "CANCEL")
			return HandleCancel(stream);
		if (action == "MODIFY")
			return HandleModify(stream);
		if (action == "SNAPSHOT")
			return HandleSnapshot();
		return R"({"error":"unknown command"})";
	}
	catch (const std::exception& e)
	{
		return std::format(R"({{"error":"{}"}})", e.what());
	}
}

// ADD <side:BUY|SELL> <type:GTC|FAK> <price> <quantity>
std::string JsonEngine::HandleAdd(std::istringstream& stream)
{
	std::string sideStr, typeStr;
	Price price;
	Quantity quantity;
	stream >> sideStr >> typeStr >> price >> quantity;

	Side side = (sideStr == "BUY") ? Side::Buy : Side::Sell;
	OrderType type = (typeStr == "GTC") ? OrderType::GoodTillCancel : OrderType::FillAndKill;

	OrderId id = nextOrderId_++;
	auto order = std::make_shared<Order>(type, id, side, price, quantity);
	Trades trades = book_.AddOrder(order);

	return std::format(R"({{"orderId":{},"trades":{},"book":{}}})",
		id, FormatTrades(trades), FormatBookState());
}

// CANCEL <orderId>
std::string JsonEngine::HandleCancel(std::istringstream& stream)
{
	OrderId orderId;
	stream >> orderId;

	book_.CancelOrder(orderId);

	return std::format(R"({{"cancelled":{},"book":{}}})", orderId, FormatBookState());
}

// MODIFY <orderId> <side:BUY|SELL> <price> <quantity>
std::string JsonEngine::HandleModify(std::istringstream& stream)
{
	OrderId orderId;
	std::string sideStr;
	Price price;
	Quantity quantity;
	stream >> orderId >> sideStr >> price >> quantity;

	Side side = (sideStr == "BUY") ? Side::Buy : Side::Sell;
	OrderModify modify{ orderId, side, price, quantity };
	Trades trades = book_.ModifyOrder(modify);

	return std::format(R"({{"modified":{},"trades":{},"book":{}}})",
		orderId, FormatTrades(trades), FormatBookState());
}

std::string JsonEngine::HandleSnapshot()
{
	return std::format(R"({{"book":{}}})", FormatBookState());
}

std::string JsonEngine::FormatTrades(const Trades& trades)
{
	if (trades.empty())
		return "[]";

	std::string result = "[";
	for (std::size_t i = 0; i < trades.size(); ++i)
	{
		const auto& trade = trades[i];
		result += std::format(
			R"({{"bidOrderId":{},"askOrderId":{},"price":{},"quantity":{}}})",
			trade.GetBidTrade().orderId,
			trade.GetAskTrade().orderId,
			trade.GetBidTrade().price,
			trade.GetBidTrade().quantity
		);
		if (i + 1 < trades.size())
			result += ",";
	}
	result += "]";
	return result;
}

std::string JsonEngine::FormatBookState()
{
	auto infos = book_.GetOrderInfos();

	auto formatLevels = [](const LevelInfos& levels) -> std::string
	{
		if (levels.empty())
			return "[]";
		std::string result = "[";
		for (std::size_t i = 0; i < levels.size(); ++i)
		{
			result += std::format(R"({{"price":{},"quantity":{}}})", levels[i].price, levels[i].quantity);
			if (i + 1 < levels.size())
				result += ",";
		}
		result += "]";
		return result;
	};

	return std::format(R"({{"bids":{},"asks":{},"size":{}}})",
		formatLevels(infos.GetBids()),
		formatLevels(infos.GetAsks()),
		book_.Size());
}

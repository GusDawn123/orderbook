include(GoogleTest)

# --- Order Tests ---
add_executable(OrderTests OrderTests.cpp)
target_link_libraries(OrderTests PRIVATE orderbook_engine GTest::gtest_main)
gtest_discover_tests(OrderTests)

# --- OrderBook Tests ---
add_executable(OrderBookTests OrderBookTests.cpp)
target_link_libraries(OrderBookTests PRIVATE orderbook_engine GTest::gtest_main)
gtest_discover_tests(OrderBookTests)

# --- Trade Tests ---
add_executable(TradeTests TradeTests.cpp)
target_link_libraries(TradeTests PRIVATE orderbook_engine GTest::gtest_main)
gtest_discover_tests(TradeTests)

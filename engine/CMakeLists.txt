cmake_minimum_required(VERSION 3.20)

# --- Order Book Engine Library ---
add_library(orderbook_engine STATIC
    src/Order.cpp
    src/OrderBook.cpp
    src/JsonEngine.cpp
)

target_include_directories(orderbook_engine PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_compile_features(orderbook_engine PUBLIC cxx_std_20)

# --- Demo Executable ---
add_executable(orderbook_demo src/main.cpp)
target_link_libraries(orderbook_demo PRIVATE orderbook_engine)

# --- JSON Server (stdin/stdout bridge for Node.js backend) ---
add_executable(orderbook_server src/server.cpp)
target_link_libraries(orderbook_server PRIVATE orderbook_engine)

# --- Google Test ---
option(BUILD_TESTS "Build unit tests" ON)

if(BUILD_TESTS)
    include(FetchContent)
    FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG v1.14.0
    )

    # Prevent overriding the parent project's compiler/linker settings on Windows
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

    FetchContent_MakeAvailable(googletest)

    enable_testing()
    add_subdirectory(tests)
endif()

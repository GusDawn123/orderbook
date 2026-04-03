CREATE TABLE IF NOT EXISTS orders (
    order_id    BIGINT PRIMARY KEY,
    order_type  VARCHAR(20) NOT NULL,
    side        VARCHAR(4)  NOT NULL,
    price       INTEGER     NOT NULL,
    quantity    INTEGER     NOT NULL,
    remaining   INTEGER     NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_side_price ON orders(side, price);

CREATE TABLE IF NOT EXISTS trades (
    trade_id     BIGSERIAL PRIMARY KEY,
    bid_order_id BIGINT NOT NULL REFERENCES orders(order_id),
    ask_order_id BIGINT NOT NULL REFERENCES orders(order_id),
    price        INTEGER NOT NULL,
    quantity     INTEGER NOT NULL,
    executed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at DESC);

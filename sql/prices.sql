-- insertPrice
INSERT INTO prices (name, time, price) VALUES
  (:name, :time, :price)
  ON CONFLICT (name, time)
  DO UPDATE SET price = :price
  RETURNING *;

-- listPrices
SELECT * FROM prices;
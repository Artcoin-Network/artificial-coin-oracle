-- insertPrice
INSERT INTO prices (name, time, price) VALUES
  (:name, :time, :price)
  ON CONFLICT (name, time)
  DO UPDATE SET price = :price
  RETURNING *;

-- listPrices
SELECT * FROM prices;

-- listLastPrices
WITH last AS (
  SELECT name, max(time) FROM prices group by name
) 
SELECT prices.name, prices.price FROM prices, last
  where last.name = prices.name and last.max = prices.time;

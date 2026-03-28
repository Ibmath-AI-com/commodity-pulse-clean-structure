// FILE: src/infrastructure/db/queries/dashboard/get-market-chart-for-user.query.ts

export const GET_MARKET_CHART_FOR_USER_QUERY = `
WITH latest_run_per_day AS (
  SELECT
    pr.id,
    pr.uid,
    pr.commodity,
    pr.future_date,
    pr.created_at,
    pr.tender_predicted_price,
    ROW_NUMBER() OVER (
      PARTITION BY pr.uid, LOWER(pr.commodity), pr.future_date
      ORDER BY pr.created_at DESC, pr.id DESC
    ) AS rn
  FROM public.prediction_run pr
  WHERE pr.uid = $1
    AND ($2::text IS NULL OR LOWER(pr.commodity) = LOWER($2))
    AND pr.status = 'success'
    AND pr.tender_predicted_price IS NOT NULL
)
SELECT
  lr.future_date,
  lr.tender_predicted_price,
  cp.price AS actual_price
FROM latest_run_per_day lr
JOIN LATERAL (
  SELECT c.price
  FROM public.commodity_prices c
  WHERE LOWER(c.commodity_group) = LOWER(lr.commodity)
    AND c.price IS NOT NULL
    AND c.price_date <= lr.future_date
  ORDER BY c.price_date DESC, c.price_id DESC
  LIMIT 1
) cp ON TRUE
WHERE lr.rn = 1
ORDER BY lr.future_date ASC
LIMIT $3
`;
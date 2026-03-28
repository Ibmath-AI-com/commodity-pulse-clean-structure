// FILE: src/infrastructure/postgres/queries/dashboard/get-predictions-for-user.query.ts

export const GET_PREDICTIONS_FOR_USER_QUERY = `
SELECT
  pr.id,
  pr.uid,
  pr.commodity,
  pr.future_date,
  pr.status,
  pr.created_at,
  pr.runtime_ms,
  pr.n8n_http_status,
  pr.error,
  pr.tender_predicted_price,
  pr.trend,
  pr.news_count,

  pbp.basis_key,
  pbp.basis_label,
  pbp.base_price,

  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'headline', pne.headline,
        'impact_direction', pne.impact_direction,
        'importance_score', pne.importance_score,
        'event_type', pne.event_type,
        'event_date', CASE
          WHEN pne.event_date IS NOT NULL THEN TO_CHAR(pne.event_date AT TIME ZONE 'UTC', 'YYYY-MM-DD')
          ELSE NULL
        END,
        'evidence_summary', pne.evidence_summary
      )
      ORDER BY pne.event_index
    ) FILTER (WHERE pne.id IS NOT NULL),
    '[]'::json
  ) AS news_events

FROM public.prediction_run pr
LEFT JOIN public.prediction_basis_price pbp
  ON pbp.prediction_run_id = pr.id
LEFT JOIN public.prediction_news_event pne
  ON pne.prediction_run_id = pr.id
WHERE pr.uid = $1
  AND ($2::text IS NULL OR pr.commodity = $2)
GROUP BY
  pr.id,
  pr.uid,
  pr.commodity,
  pr.future_date,
  pr.status,
  pr.created_at,
  pr.runtime_ms,
  pr.n8n_http_status,
  pr.error,
  pr.tender_predicted_price,
  pr.trend,
  pr.news_count,
  pbp.basis_key,
  pbp.basis_label,
  pbp.base_price
ORDER BY pr.created_at DESC
LIMIT $3
`;
ALTER TABLE "queue_entries"
  ADD CONSTRAINT "queue_entries_lifecycle_timestamp_order"
  CHECK (
    ("consultation_started_at" IS NULL OR "called_at" IS NULL
      OR "consultation_started_at" >= "called_at")
    AND
    ("completed_at" IS NULL OR "consultation_started_at" IS NULL
      OR "completed_at" >= "consultation_started_at")
    AND
    ("recall_deadline_at" IS NULL OR "no_response_at" IS NULL
      OR "recall_deadline_at" >= "no_response_at")
  );

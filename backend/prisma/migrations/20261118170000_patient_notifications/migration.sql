-- Reminders and "almost your turn" are sent once per appointment or queue
-- entry; this index makes the "already sent?" check cheap.
CREATE INDEX "outbox_events_aggregate_id_event_type_idx"
  ON "outbox_events" ("aggregate_id", "event_type");

# add column
ALTER TABLE feedbackitemsamples
ADD COLUMN "isTemplate" boolean;

# update column value
UPDATE feedbackitemsamples
SET "isTemplate" = FALSE
WHERE "isTemplate" IS NULL;

SELECT * FROM feedbackitemsamples;
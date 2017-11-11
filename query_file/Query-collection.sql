#JOIN
SELECT
 answers."questionId",
 answers.id AS "answerId",
 answers."isDelete" AS "isDeleteAnswer",
 questions."isDelete" AS "isDeleteQuestion"
FROM
 questions
INNER JOIN answers ON answers."questionId" = questions.id

WHERE
 questions."isDelete" = TRUE




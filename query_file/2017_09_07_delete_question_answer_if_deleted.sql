# set answer delete = true if question is deleted
UPDATE answers SET "isDelete" = TRUE
WHERE "questionId" IN (SELECT id 
                       FROM questions 
                       WHERE "isDelete" = TRUE );


# set answercontent delete = true if answer is deleted
UPDATE answercontents SET "isDelete" = TRUE
WHERE "answer" IN (SELECT id 
                       FROM answers 
                       WHERE "isDelete" = TRUE );

# Delete answer content of answer deleted
DELETE 
FROM answercontents
WHERE "answer" IN (SELECT id 
                       FROM answers 
                       WHERE "isDelete" = TRUE );


# Delete question content of question deleted
DELETE 
FROM questioncontents
WHERE "questionId" IN (SELECT id 
                       FROM questions 
                       WHERE "isDelete" = TRUE );

# Delete answer if deleted
DELETE 
FROM answers
WHERE "isDelete" = TRUE ;


# Delete question if deleted
DELETE 
FROM questions
WHERE "isDelete" = TRUE ;
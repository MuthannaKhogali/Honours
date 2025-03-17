const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, DeleteCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

const client = new DynamoDBClient({ region: "eu-west-2" });
const dynamoDB = DynamoDBDocumentClient.from(client);
const QUESTIONS_TABLE = "Questions";

// function to generate 6-digit question ID
const generateQuestionID = async () => {
    return Math.floor(100000 + Math.random() * 900000); 
};

// function to generate a quiz ID
const generateQuizID = () => {
    return crypto.randomBytes(6).toString("hex");
};

// function to save questions in DynamoDB
const saveQuestions = async (questions, userID, youtubeLink, quizName) => {
    if (!questions || !userID || !youtubeLink || !quizName) {
        throw new Error("Missing required fields.");
    }

    const quizID = generateQuizID();

    try {
        for (const q of questions) {
            const questionID = await generateQuestionID();

            const params = {
                TableName: QUESTIONS_TABLE,
                Item: {
                    questionID: Number(questionID),
                    userID: Number(userID),
                    quizID,
                    quizName,
                    youtubeLink,
                    question: q.question,
                    type: q.type,
                    options: q.options || [],
                    answer: q.answer,
                    time: q.time,
                    dateCreated: new Date().toISOString()
                },
            };

            const command = new PutCommand(params);
            await dynamoDB.send(command);
        }

        console.log(`Quiz saved successfully! Quiz ID: ${quizID}`);
        return quizID; // Return quizID so frontend can use it
    } catch (error) {
        console.error("DynamoDB Error:", error);
        throw new Error("Failed to save quiz to DynamoDB.");
    }
};

// wrapper function for saving a quiz
const saveQuiz = async (userID, youtubeLink, questions, quizName) => {
    return await saveQuestions(questions, userID, youtubeLink, quizName);
};

// function to get saved quizzes
const getSavedQuizzes = async (userID) => {
    if (!userID) {
        throw new Error("User ID is required.");
    }

    try {
        const params = {
            TableName: QUESTIONS_TABLE
        };

        const command = new ScanCommand(params);
        const { Items } = await dynamoDB.send(command);

        // filter results by userID
        const userQuizzes = Items.filter(q => q.userID === Number(userID));

        if (userQuizzes.length === 0) {
            return []; // No quizzes found for the user
        }

        // group questions by quizID
        const groupedQuizzes = userQuizzes.reduce((acc, question) => {
            const quizID = question.quizID;
            if (!acc[quizID]) {
                acc[quizID] = {
                    quizID: quizID,
                    quizName: question.quizName,
                    youtubeLink: question.youtubeLink,
                    questions: []
                };
            }
            acc[quizID].questions.push({
                questionID: question.questionID,
                question: question.question,
                type: question.type,
                options: question.options,
                answer: question.answer,
                time: question.time
            });
            return acc;
        }, {});

        return Object.values(groupedQuizzes);
    } catch (error) {
        console.error("Error retrieving saved quizzes:", error);
        throw new Error("Failed to fetch saved quizzes.");
    }
};

const deleteQuiz = async (userID, quizID) => {
    if (!userID || !quizID) {
      throw new Error("Missing userID or quizID.");
    }
  
    try {
      console.log(`Searching for questions in quizID: ${quizID} for user: ${userID}`);
  
      //find quiz
      const scanParams = {
        TableName: QUESTIONS_TABLE,
        FilterExpression: "quizID = :quizID AND userID = :userID",
        ExpressionAttributeValues: {
          ":quizID": quizID,
          ":userID": Number(userID) 
        }
      };
  
      const scanCommand = new ScanCommand(scanParams);
      const { Items } = await dynamoDB.send(scanCommand);
  
      if (!Items || Items.length === 0) {
        console.error("No questions found for quizID:", quizID);
        return { success: false, message: "No matching quiz found" };
      }
  
      console.log(`Found ${Items.length} questions. Deleting...`);
  
      // delete each questions
      for (const question of Items) {
        const deleteParams = {
          TableName: QUESTIONS_TABLE,
          Key: {
            questionID: question.questionID, 
            userID: Number(userID)
          }
        };
  
        console.log("Deleting question:", deleteParams);
  
        const deleteCommand = new DeleteCommand(deleteParams);
        await dynamoDB.send(deleteCommand);
      }
  
      console.log(`Quiz ${quizID} deleted successfully.`);
      return { success: true, message: "Quiz deleted successfully" };
    } catch (error) {
      console.error("Error deleting quiz:", error);
      throw new Error("Failed to delete quiz.");
    }
  };

  const updateQuiz = async (userID, quizID, updatedQuestions) => {
    if (!userID || !quizID || !Array.isArray(updatedQuestions)) {
        throw new Error("Missing userID, quizID, or questions.");
    }

    try {
        // 1. Fetch existing quiz questions to delete
        const scanParams = {
            TableName: QUESTIONS_TABLE,
            FilterExpression: "quizID = :quizID AND userID = :userID",
            ExpressionAttributeValues: {
                ":quizID": quizID,
                ":userID": Number(userID)
            }
        };

        const scanCommand = new ScanCommand(scanParams);
        const { Items } = await dynamoDB.send(scanCommand);

        // 2. Delete all existing questions
        for (const question of Items) {
            const deleteParams = {
                TableName: QUESTIONS_TABLE,
                Key: {
                    questionID: question.questionID,
                    userID: Number(userID)
                }
            };
            await dynamoDB.send(new DeleteCommand(deleteParams));
        }

        // 3. Re-insert updated questions
        for (const q of updatedQuestions) {
            const newQuestionID = await generateQuestionID(); // Re-generate questionID for each
            const params = {
                TableName: QUESTIONS_TABLE,
                Item: {
                    questionID: Number(newQuestionID),
                    userID: Number(userID),
                    quizID,
                    quizName: q.quizName || Items[0].quizName,
                    youtubeLink: q.youtubeLink || Items[0].youtubeLink,
                    question: q.question,
                    type: q.type,
                    options: q.options || [],
                    answer: q.answer,
                    time: q.time || ""
                }
            };

            await dynamoDB.send(new PutCommand(params));
        }

        console.log(`Quiz ${quizID} updated successfully.`);
        return { success: true, message: "Quiz updated successfully." };
    } catch (error) {
        console.error("Error updating quiz:", error);
        throw new Error("Failed to update quiz.");
    }
};

module.exports = { saveQuiz, saveQuestions, getSavedQuizzes, deleteQuiz, updateQuiz };

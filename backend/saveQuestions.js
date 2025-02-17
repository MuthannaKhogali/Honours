const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");

const client = new DynamoDBClient({ region: "eu-west-2" });
const dynamoDB = DynamoDBDocumentClient.from(client);
const QUESTIONS_TABLE = "Questions";

// function to generate 6-digit question ID
const generateQuestionID = async () => {
    return Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
};

// function to generate a quiz ID
const generateQuizID = () => {
    return crypto.randomBytes(6).toString("hex"); // Generate unique hex string for quizID
};

const saveQuestions = async (questions, userID, youtubeLink, quizName) => {
    if (!questions || !userID || !youtubeLink || !quizName) {
        throw new Error("Missing required fields.");
    }

    const quizID = generateQuizID();

    try {
        for (const q of questions) {
            const questionID = await generateQuestionID(); // generate ID for each question

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
        return quizID; // return quizID so frontend can use it
    } catch (error) {
        console.error(" DynamoDB Error:", error);
        throw new Error("Failed to save quiz to DynamoDB.");
    }
};

// wrapper function for saving a quiz
const saveQuiz = async (userID, youtubeLink, questions, quizName) => {
    return await saveQuestions(questions, userID, youtubeLink, quizName);
};

module.exports = { saveQuiz, saveQuestions };


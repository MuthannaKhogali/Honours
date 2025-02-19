const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
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
        // Since userID is not the partition key, we must scan the entire table and filter by userID.
        const params = {
            TableName: QUESTIONS_TABLE
        };

        const command = new ScanCommand(params);
        const { Items } = await dynamoDB.send(command);

        // Filter results by userID
        const userQuizzes = Items.filter(q => q.userID === Number(userID));

        if (userQuizzes.length === 0) {
            return []; // No quizzes found for the user
        }

        // Group questions by quizID
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

module.exports = { saveQuiz, saveQuestions, getSavedQuizzes };

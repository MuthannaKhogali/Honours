const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "eu-west-2" });
const dynamoDB = DynamoDBDocumentClient.from(client);

const RECEIVED_QUESTIONS_TABLE = process.env.RECEIVED_QUESTIONS_TABLE;

const sendQuizToFriend = async (req, res) => {
    const { userID, friendID, quizID, youtubeLink, questions, quizName, senderUsername } = req.body;

    if (!userID || !friendID || !quizID || !questions || !youtubeLink || !quizName || !senderUsername) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        const currentDate = new Date().toISOString();

        for (const question of questions) {
            const item = {
                recipientID: Number(friendID),
                questionID: Number(question.questionID), 
                senderID: Number(userID),
                senderUsername,
                quizID,
                quizName,
                youtubeLink,
                question: question.question,
                options: question.options || [],
                answer: question.answer,
                time: question.time,
                type: question.type,
                dateCreated: currentDate
            };

            const command = new PutCommand({
                TableName: RECEIVED_QUESTIONS_TABLE,
                Item: item
            });

            await dynamoDB.send(command);
        }

        res.json({ message: "Quiz sent to friend successfully!" });
    } catch (error) {
        console.error("Error sending quiz to friend:", error);
        res.status(500).json({ error: "Failed to send quiz to friend." });
    }
};


const getReceivedQuizzes = async (req, res) => {
    const { userID } = req.query;

    if (!userID) {
        return res.status(400).json({ error: "User ID is required." });
    }

    try {
        const queryCommand = new QueryCommand({
            TableName: RECEIVED_QUESTIONS_TABLE,
            KeyConditionExpression: "recipientID = :recipientID",
            ExpressionAttributeValues: { ":recipientID": Number(userID) }
        });

        const { Items } = await dynamoDB.send(queryCommand);

        if (!Items || Items.length === 0) {
            return res.json({ receivedQuizzes: [] });
        }

        const quizzes = Items.reduce((acc, question) => {
            if (!acc[question.quizID]) {
                acc[question.quizID] = {
                    quizID: question.quizID,
                    youtubeLink: question.youtubeLink,
                    questions: [],
                    senderID: question.senderID,
                    senderUsername: question.senderUsername,
                    quizName: question.quizName,
                    dateCreated: question.dateCreated
                };
            }
            acc[question.quizID].questions.push({
                questionID: question.questionID,
                question: question.question,
                options: question.options,
                answer: question.answer,
                time: question.time,
                type: question.type
            });
            return acc;
        }, {});

        res.json({ receivedQuizzes: Object.values(quizzes) });
    } catch (error) {
        console.error("Error fetching received quizzes:", error);
        res.status(500).json({ error: "Failed to fetch received quizzes." });
    }
};


module.exports = {
    sendQuizToFriend,
    getReceivedQuizzes
};

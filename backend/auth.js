require('dotenv').config();
const bcrypt = require('bcryptjs'); // for hashing passwords
const jwt = require('jsonwebtoken');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// intialises dynamoDB client
const client = new DynamoDBClient({ region: 'eu-west-2' });
const dynamoDB = DynamoDBDocumentClient.from(client);

// finds table User
const USERS_TABLE = 'User';

// generates a user ID
const generateUserID = async () => {
    let userID;
    let exists = true;

    while (exists) {
        // generate a random 6-digit number
        userID = Math.floor(100000 + Math.random() * 900000);

        const command = new GetCommand({ TableName: USERS_TABLE, Key: { userID } });
        const result = await dynamoDB.send(command);

        // if the userID does not exist, exit the loop
        exists = result.Item !== undefined;
    }

    return userID;
};


// register seur
const registerUser = async (req, res) => {
    const { username, password } = req.body;
    
    // validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // hashes password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userID = await generateUserID(); // gets a user ID

    // define table paramaters
    const params = {
        TableName: USERS_TABLE,
        Item: {
            userID,
            username,
            password: hashedPassword
        }
    };

    try {
        // stores the data
        const command = new PutCommand(params); 
        await dynamoDB.send(command);
        // success message abd return new userID
        res.json({ message: 'User registered successfully.', userID });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: 'Error registering user.' });
    }
};

// login user
const loginUser = async (req, res) => {
    try {
        // gets credentials and validates input
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // find user using GSI
        const command = new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'username-index', 
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: { ':username': username }
        });

        // ff no user is found, return an error
        const result = await dynamoDB.send(command);
        if (result.Items.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = result.Items[0];

        // if invalid password, return an error
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // if log in successful, return userID
        res.json({ message: 'Login successful', userID: user.userID, username: user.username  });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: 'Error logging in.' });
    }
};


module.exports = { registerUser, loginUser };

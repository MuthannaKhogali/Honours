require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// initialise DynamoDB client
const client = new DynamoDBClient({ region: 'eu-west-2' });
const dynamoDB = DynamoDBDocumentClient.from(client);

// define table names
const FRIENDS_TABLE = 'Friends';
const USERS_TABLE = 'User'; 

// send friend request
const sendFriendRequest = async (req, res) => {
    let { userID, friendUsername } = req.body;
    console.log("Received friend request for username:", friendUsername);

    // convert userID to number
    userID = Number(userID);

    if (!userID || !friendUsername) {
        console.error("Missing userID or friendUsername:", { userID, friendUsername });
        return res.status(400).json({ error: "User ID and friend username are required." });
    }

    try {
        // lookup friend's userID by username
        const userQuery = await dynamoDB.send(new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'username-index',  // Ensure your DynamoDB has a GSI for username
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: { ':username': friendUsername }
        }));

        if (userQuery.Items.length === 0) {
            console.log("No user found with username:", friendUsername);
            return res.status(404).json({ error: "User not found." });
        }

        const friendID = Number(userQuery.Items[0].userID); // Convert friendID to number

        // prevent sending a request to yourself
        if (userID === friendID) {
            return res.status(400).json({ error: "You cannot send a friend request to yourself." });
        }

        console.log(`Adding friend: ${friendUsername} (ID: ${friendID}) for user ${userID}`);

        // check if friend request already exists
        const existingRequest = await dynamoDB.send(new QueryCommand({
            TableName: FRIENDS_TABLE,
            KeyConditionExpression: "userID = :userID AND friendID = :friendID",
            ExpressionAttributeValues: {
                ":userID": userID,
                ":friendID": friendID
            }
        }));

        if (existingRequest.Items.length > 0) {
            return res.status(400).json({ error: "Friend request already sent or exists." });
        }

        // create friend request for both users
        await dynamoDB.send(new PutCommand({
            TableName: FRIENDS_TABLE,
            Item: { userID, friendID, status: "pending", sentBy: userID }
        }));

        await dynamoDB.send(new PutCommand({
            TableName: FRIENDS_TABLE,
            Item: { userID: friendID, friendID: userID, status: "pending", sentBy: userID }
        }));

        res.json({ message: "Friend request sent successfully." });
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ error: "Failed to send friend request." });
    }
};


// accepting a friend request
const acceptFriendRequest = async (req, res) => {
    let { userID, friendID } = req.body;

    // convert IDs to numbers
    userID = Number(userID);
    friendID = Number(friendID);

    if (isNaN(userID) || isNaN(friendID)) {
        return res.status(400).json({ error: "Both userID and friendID must be numbers." });
    }

    try {
        // retrieve the friend request from the database
        const friendRequest = await dynamoDB.send(new QueryCommand({
            TableName: FRIENDS_TABLE,
            KeyConditionExpression: "userID = :userID AND friendID = :friendID",
            ExpressionAttributeValues: {
                ":userID": userID,
                ":friendID": friendID
            }
        }));

        if (friendRequest.Items.length === 0 || friendRequest.Items[0].status !== "pending") {
            return res.status(400).json({ error: "Friend request does not exist or is not pending." });
        }

        //  makes sure the recipient can accept the request
        if (friendRequest.Items[0].sentBy === userID) {
            return res.status(400).json({ error: "You cannot accept your own friend request." });
        }

        // update the friend request status to "accepted" for both users
        await dynamoDB.send(new PutCommand({
            TableName: FRIENDS_TABLE,
            Item: { userID, friendID, status: "accepted" }
        }));

        await dynamoDB.send(new PutCommand({
            TableName: FRIENDS_TABLE,
            Item: { userID: friendID, friendID: userID, status: "accepted" }
        }));

        res.json({ message: "Friend request accepted successfully." });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ error: "Failed to accept friend request." });
    }
};


// get users friends
const getFriends = async (req, res) => {
    let { userID } = req.query;

    userID = Number(userID); // convert userID to number

    if (isNaN(userID)) {
        console.error("Invalid userID:", userID);
        return res.status(400).json({ error: "User ID must be a number." });
    }

    try {
        // get list of friend IDs
        const result = await dynamoDB.send(new QueryCommand({
            TableName: FRIENDS_TABLE,
            KeyConditionExpression: "userID = :userID",
            ExpressionAttributeValues: { ":userID": userID }
        }));

        if (!result.Items.length) {
            return res.json({ friends: [], pendingRequests: [] });
        }

        let friends = [];
        let pendingRequests = [];

        // fetch usernames for each friend
        for (let friend of result.Items) {
            const userLookup = await dynamoDB.send(new GetCommand({
                TableName: USERS_TABLE,
                Key: { userID: friend.friendID }
            }));

            const friendUsername = userLookup.Item?.username || `User ${friend.friendID}`;

            if (friend.status === "accepted") {
                friends.push({ friendID: friend.friendID, username: friendUsername });
            } else {
                pendingRequests.push({ 
                    friendID: friend.friendID, 
                    username: friendUsername, 
                    sentBy: friend.sentBy 
                });
            }
        }

        res.json({ friends, pendingRequests });
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ error: "Failed to fetch friends." });
    }
};

//remove friend
const removeFriend = async (req, res) => {
    let { userID, friendID } = req.body;

    // donvert IDs to numbers
    userID = Number(userID);
    friendID = Number(friendID);

    if (isNaN(userID) || isNaN(friendID)) {
        return res.status(400).json({ error: "Both userID and friendID must be numbers." });
    }

    try {
        // remove the friend from both users' lists
        await dynamoDB.send(new DeleteCommand({
            TableName: FRIENDS_TABLE,
            Key: { userID, friendID }
        }));

        await dynamoDB.send(new DeleteCommand({
            TableName: FRIENDS_TABLE,
            Key: { userID: friendID, friendID: userID }
        }));

        res.json({ message: "Friend removed or request rejected." });
    } catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({ error: "Failed to remove friend." });
    }
};

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    getFriends,
    removeFriend
};

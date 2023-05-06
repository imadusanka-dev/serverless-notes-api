'use strict';
const DynamoDB = require('aws-sdk/clients/dynamodb');
const { v4: uuidv4 } = require('uuid');
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const documentClient = new DynamoDB.DocumentClient({ 
  region: 'us-east-1', 
  maxRetries: 3, 
  httpOptions: {
     timeout: 5000 
  } 
});

const send = (statusCode, data) => {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
}

module.exports.createNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const userId = event.requestContext.authorizer.sub;
  const data = JSON.parse(event.body);

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        id: uuidv4(),
        userId,
        title: data.title,
        content: data.content,
      },
      ConditionExpression: 'attribute_not_exists(id)',
    };

    await documentClient.put(params).promise();

    cb(null, send(200, data));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};

module.exports.updateNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const id = event.pathParameters.id;
  const data = JSON.parse(event.body);

  try{
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set #title = :title, #content = :content',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#content': 'content',
      },
      ExpressionAttributeValues: {
        ':title': data.title,
        ':content': data.content,
      },
      ConditionExpression: 'attribute_exists(id)',
    }

    await documentClient.update(params).promise();

    cb(null, send(200, data));
  } catch(err) {
    cb(null, send(500, err.message));
  }
}

module.exports.deleteNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const id = event.pathParameters.id;
  try{
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)',
    }

    await documentClient.delete(params).promise();

    cb(null, send(200, id));
  } catch(err) {
    cb(null, send(500, err.message));
  }
}

module.exports.getNotes = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const userId = event.requestContext.authorizer.sub;

  try{
    const params = {
      TableName: NOTES_TABLE_NAME,
      FilterExpression: "contains(userId, :userId)",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ProjectionExpression: "#id, #title, #content",
      ExpressionAttributeNames: {
        "#id": "id",
        "#title": "title",
        "#content": "content",
      },
    }

    const result = await documentClient.scan(params).promise();

    cb(null, send(200, result));
  } catch(err) {
    cb(null, send(500, err.message));
  }
} 

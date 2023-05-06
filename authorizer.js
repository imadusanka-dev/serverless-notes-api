const { CognitoJwtVerifier } = require('aws-jwt-verify');
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_USER_POOL_CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID;

const jwtVerifier = new CognitoJwtVerifier({
  tokenUse: 'id',
  userPoolId: COGNITO_USER_POOL_ID,
  clientId: COGNITO_USER_POOL_CLIENT_ID,
});

const generatePolicy = (principalId, effect, resource, payload) => {
    const authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: effect,
                    Resource: resource,
                    Action: 'execute-api:Invoke'
                }
            ]
        };
        authResponse.policyDocument = policyDocument;
        authResponse.context = payload;
    }
    return authResponse;
}

exports.handler = async (event, context, callback) => {
  const token = event.authorizationToken;

  try {
    const payload = await jwtVerifier.verify(token);
    const principalId = 'user';
    const effect = 'Allow';
    const resource = event.methodArn;
    const policyDocument = generatePolicy(principalId, effect, resource, payload);
    callback(null, policyDocument);
  } catch (err) {
    callback('Unauthorized');
  }
} 
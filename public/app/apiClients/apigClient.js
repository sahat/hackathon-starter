/*
 * Copyright 2010-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var apigClientFactory = {};
apigClientFactory.newClient = function (config) {
    var apigClient = { };
    if(config === undefined) {
        config = {
            accessKey: '',
            secretKey: '',
            sessionToken: '',
            region: '',
            apiKey: undefined,
            defaultContentType: 'application/json',
            defaultAcceptType: 'application/json'
        };
    }
    if(config.accessKey === undefined) {
        config.accessKey = '';
    }
    if(config.secretKey === undefined) {
        config.secretKey = '';
    }
    if(config.apiKey === undefined) {
        config.apiKey = '';
    }
    if(config.sessionToken === undefined) {
        config.sessionToken = '';
    }
    if(config.region === undefined) {
        config.region = 'us-east-1';
    }
    //If defaultContentType is not defined then default to application/json
    if(config.defaultContentType === undefined) {
        config.defaultContentType = 'application/json';
    }
    //If defaultAcceptType is not defined then default to application/json
    if(config.defaultAcceptType === undefined) {
        config.defaultAcceptType = 'application/json';
    }

    
    var endpoint = 'https://ho3j8bqvgf.execute-api.us-east-1.amazonaws.com/dev';
    var parser = document.createElement('a');
    parser.href = endpoint;

    //Use the protocol and host components to build the canonical endpoint
    endpoint = parser.protocol + '//' + parser.host;

    //Store any path components that were present in the endpoint to append to API calls
    var pathComponent = parser.pathname;
    if (pathComponent.charAt(0) !== '/') { // IE 9
        pathComponent = '/' + pathComponent;
    }

    var sigV4ClientConfig = {
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        sessionToken: config.sessionToken,
        serviceName: 'execute-api',
        region: config.region,
        endpoint: endpoint,
        defaultContentType: config.defaultContentType,
        defaultAcceptType: config.defaultAcceptType
    };

    var authType = 'NONE';
    if (sigV4ClientConfig.accessKey !== undefined && sigV4ClientConfig.accessKey !== '' && sigV4ClientConfig.secretKey !== undefined && sigV4ClientConfig.secretKey !== '') {
        authType = 'AWS_IAM';
    }

    var simpleHttpClientConfig = {
        endpoint: endpoint,
        defaultContentType: config.defaultContentType,
        defaultAcceptType: config.defaultAcceptType
    };

    var apiGatewayClient = apiGateway.core.apiGatewayClientFactory.newClient(simpleHttpClientConfig, sigV4ClientConfig);
    
    
    
    apigClient.applicationApplicationIdGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['applicationId'], ['body']);
        
        var applicationApplicationIdGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/application/{applicationId}').expand(apiGateway.core.utils.parseParametersToObject(params, ['applicationId'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(applicationApplicationIdGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.applicationApplicationIdPatch = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['applicationId', 'body'], ['body']);
        
        var applicationApplicationIdPatchRequest = {
            verb: 'patch'.toUpperCase(),
            path: pathComponent + uritemplate('/application/{applicationId}').expand(apiGateway.core.utils.parseParametersToObject(params, ['applicationId', ])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(applicationApplicationIdPatchRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.applicationApplicationIdOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var applicationApplicationIdOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/application/{applicationId}').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(applicationApplicationIdOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['numberOfFollowers', 'campaignIds', 'count', 'ageRange', 'startKey', 'tags'], ['body']);
        
        var campaignGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/campaign').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['numberOfFollowers', 'campaignIds', 'count', 'ageRange', 'startKey', 'tags']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['body'], ['body']);
        
        var campaignPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/campaign').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var campaignOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/campaign').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignCampaignIdApplicationGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['campaignId'], ['body']);
        
        var campaignCampaignIdApplicationGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/campaign/{campaignId}/application').expand(apiGateway.core.utils.parseParametersToObject(params, ['campaignId'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignCampaignIdApplicationGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignCampaignIdApplicationPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['campaignId', 'body'], ['body']);
        
        var campaignCampaignIdApplicationPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/campaign/{campaignId}/application').expand(apiGateway.core.utils.parseParametersToObject(params, ['campaignId', ])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignCampaignIdApplicationPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignCampaignIdApplicationPatch = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['campaignId', 'body'], ['body']);
        
        var campaignCampaignIdApplicationPatchRequest = {
            verb: 'patch'.toUpperCase(),
            path: pathComponent + uritemplate('/campaign/{campaignId}/application').expand(apiGateway.core.utils.parseParametersToObject(params, ['campaignId', ])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignCampaignIdApplicationPatchRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignCampaignIdApplicationOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var campaignCampaignIdApplicationOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/campaign/{campaignId}/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignCampaignIdApplicationOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.insightsFacebookGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['postId', 'accessToken', 'pageId'], ['body']);
        
        var insightsFacebookGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/insights/facebook').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['postId', 'accessToken', 'pageId']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(insightsFacebookGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.insightsFacebookOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var insightsFacebookOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/insights/facebook').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(insightsFacebookOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.insightsFacebookPagesGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['accessToken'], ['body']);
        
        var insightsFacebookPagesGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/insights/facebook/pages').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['accessToken']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(insightsFacebookPagesGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.insightsFacebookPagesOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var insightsFacebookPagesOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/insights/facebook/pages').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(insightsFacebookPagesOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.userUserIdApplicationGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['userId'], ['body']);
        
        var userUserIdApplicationGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/user/{userId}/application').expand(apiGateway.core.utils.parseParametersToObject(params, ['userId'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(userUserIdApplicationGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.userUserIdApplicationOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var userUserIdApplicationOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/user/{userId}/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(userUserIdApplicationOptionsRequest, authType, additionalParams, config.apiKey);
    };
    

    return apigClient;
};

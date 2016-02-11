/*
 * Copyright 2010-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

    
    var endpoint = 'https://peoocmcc7h.execute-api.us-east-1.amazonaws.com/dev';
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
    
    
    
    apigClient.applicationGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['applicationId'], ['body']);
        
        var applicationGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['applicationId']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(applicationGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.applicationPatch = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['body'], ['body']);
        
        var applicationPatchRequest = {
            verb: 'patch'.toUpperCase(),
            path: pathComponent + uritemplate('/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(applicationPatchRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.applicationOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['applicationId'], ['body']);
        
        var applicationOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['applicationId']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(applicationOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['numberOfFollowers', 'campaignIds', 'count', 'ageRange', 'startKey', 'tags', 'status'], ['body']);
        
        var campaignGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/campaign').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['numberOfFollowers', 'campaignIds', 'count', 'ageRange', 'startKey', 'tags', 'status']),
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
    
    
    apigClient.campaignsApplicationGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['campaignId'], ['body']);
        
        var campaignsApplicationGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/campaigns/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['campaignId']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignsApplicationGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignsApplicationPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['body'], ['body']);
        
        var campaignsApplicationPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/campaigns/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignsApplicationPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignsApplicationPatch = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['body'], ['body']);
        
        var campaignsApplicationPatchRequest = {
            verb: 'patch'.toUpperCase(),
            path: pathComponent + uritemplate('/campaigns/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignsApplicationPatchRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.campaignsApplicationOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['campaignId', 'body'], ['body']);
        
        var campaignsApplicationOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/campaigns/application').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['campaignId', ]),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(campaignsApplicationOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.facebookGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['postId', 'accessToken', 'pageId'], ['body']);
        
        var facebookGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/facebook').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['postId', 'accessToken', 'pageId']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(facebookGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.facebookOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var facebookOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/facebook').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(facebookOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.pagesGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['accessToken'], ['body']);
        
        var pagesGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/pages').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['accessToken']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(pagesGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.pagesOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var pagesOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/pages').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(pagesOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.schedulepostPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['body'], ['body']);
        
        var schedulepostPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/schedulepost').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(schedulepostPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.schedulepostOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var schedulepostOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/schedulepost').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(schedulepostOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.twitterGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['userId'], ['body']);
        
        var twitterGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/twitter').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['userId']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(twitterGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.twitterOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var twitterOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/twitter').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(twitterOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.userPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['body'], ['body']);
        
        var userPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/user').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(userPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.userOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var userOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/user').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(userOptionsRequest, authType, additionalParams, config.apiKey);
    };
    

    return apigClient;
};

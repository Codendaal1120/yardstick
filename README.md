# Yardstick
A project to create mock REST APIs.

This project aims to provide a platform to create mocks of third party API's. It allows you to set up endpoints and responses based on input values.

## Some background
This project started because I needed to be able to call commercial third party API's in my test environment, like a SAAS accounting platform for example. The API in question did not provide a sandbox environment and I could not let the QA environment connect to the production account. With this server, I can define the same endpoints as the commercial account, set up basic logic to produce custom payloads when my QA environment calls it.


## Setup
Setup is fairly simple, the API runs on NodeJs, and uses a MongoDB.

For local debug, edit the  **env** file and add your DB connection string.

```javascript
dbConnection=mongodb://127.0.0.1:27017/
dbName=YardStick
serverPort=9801
```
Alternatively set the variables above as environment variables.


## Usage
To start using, add your first API, by POST to http://127.0.0.1/9801/api/apis

```javascript
{
	"name"  :  "MyFirstApi",
	"uniqueName"  :  "my-first-api"
}
```
> The api url will then be http://localhost:9801/mock/my-first-api

Next add some endpoints. 
Each endpoint contains multiple responses, each response will be evaluated in order and if the condition matches, the response will be returned, if not, the next response condition will be evaluated. If no response can be resolved, a HTTP 500 will be returned.

![gallery](https://raw.githubusercontent.com/Codendaal1120/yardstick/main/Documentation/img2.png)

Endpoints contains all the possible variable meta and all the possible responses with its conditions.

```javascript
{
	"description"  :  "Check if input is greater than 50",
	"variables"  :  [
		{  
			"name"  :  "randomNumber",  
			"type"  :  "body"  
		}
	],
	"responses"  :  [	
		{
			"order"  :  1
			"description"  :  "Check if value greater than 50",
			"code"  :  200,
			"message"  :  ""  ,
			"payload"  :  {  
				"responseMessage":  "The input value was greater than 50",  
				"pass"  :  true,  
				"InputNumber"  :  "%%randomNumber%%"  
			},
			"condition"  :  {
				"type"  :  "bodyTest",
				"operator"  :  "gt",
				"variable"  :  "randomNumber",
				"value"  :  "50"
			},
		},
		{
			"order"  :  2
			"description"  :  "Respond if no other conditions were met",
			"code"  :  200,
			"message"  :  ""  ,
			"payload"  :  {  
				"ResponseMessage":  "The input value was less than 51",  
				"InputNumber"  :  "%%randomNumber%%",  
				"pass"  :  false  
			},
			"condition"  :  {
				"type"  :  "boolTest",
				"value"  :  "true"
			},
		}
	]
}
```
In the example above,  in the first response, the server expects a body variable (POST body) with a field called **"randomNumber"** like 

```javascript
{
	"randomNumber"  :  40
}
```

It then performs a **gt** (greater than) check on the variable vs the condition value (50), if the variable is greater than the value, the response 200, along with the payload (which includes the variable value, denoted by **%%< variable >%%**) will be sent back. If this condition fails, the next condition will be checked.

The next condition does a **boolCheck**, which just evaluates a boolean. The value is static so this will always return. Again it returns the payload with the input variable .

## Logic
Currently only a number of logical checks are supported.

 - **variableTest** 	- Test a variable
 - **boolTest** 			- Static always TRUE or FALSE

Each logic check supports a number of logic operators

 - **gt** 	- Greater than
 - **eq** 	- Equals

> **Note :** More logical test and operators will be added in future.

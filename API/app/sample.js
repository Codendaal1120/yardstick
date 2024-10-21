var endpoints = [
    {
        "id" : "no_variables",
        "pattern" : "\/mock\/test(?!.)",
        "variable_pattern" : "\/mock\/test(?!.)",
        "variables" : [],
        "response" : [
            {
                "code" : 200,
                "message" : "response from x1" ,
                "condition" : null,
                "order" : 1
            }
        ]
    },
    {
        "id" : "with_variables",
        "pattern" : "\/mock\/test\/(.+)(?!.)",
        "variable_pattern" : "\/mock\/test\/(?<v1>.+)(?!.)",
        "variables" : [
            { "name" : "v1", "type" : "path" },
            { "name" : "v2", "type" : "header" },
            { "name" : "v3", "type" : "query" }
        ],
        "response" : [
            {
                "code" : 200,
                "message" : "response from x2" ,
                "condition" : null,
                "order" : 1
            }
        ]
    },
    {
        "id" : "x3",
        "pattern" : "\/mock\/test\/(.+)(?!.)",
        "variable_pattern" : "\/mock\/test\/(?<v1>.+)(?!.)?(?<v2>.+)",
        "variables" : [
            { "name" : "v1", "type" : "path" },
            { "name" : "v2", "type" : "header" },
            { "name" : "v3", "type" : "query" }
        ],
        "response" : [
            {
                "code" : 200,
                "message" : "response from x2" ,
                "condition" : null,
                "order" : 1
            }
        ]
    }
];
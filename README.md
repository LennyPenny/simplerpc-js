# SimpleRPC

This is an implementation of a [JsonRPC](http://www.jsonrpc.org/) client in javascript (es7) for use with [jspm](http://jspm.io).

##Example


###ES7
```js
import simplerpc from "simplerpc" //import the lib

var api = simplerpc("ws://127.0.0.1:1234"); //connect to a JsonRPC server and get an object to act as the API

api.UpdateCurrentUsers = (num) => { //expose a method the server can call
	document.querySelector("#currentusers").innerText = num;
}

var data = await api.SomeMethod("arg1", 2, 3); //call any method the server exposes and await its result
console.log(data);
```

###ES5
```js
var simplerpc = require("simplerpc") //import the lib

var api = simplerpc("ws://127.0.0.1:1234"); //connect to a JsonRPC server and get an object to act as the API

api.UpdateCurrentUsers = function(num) { //expose a method the server can call
	document.querySelector("#currentusers").innerText = num;
}

api.SomeMethod("arg1", 2, 3).then(function(data) { //call any method the server exposes and act once it returns
	//do stuff
}); 
console.log(data);
```

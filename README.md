# SimpleRPC

This is an implementation of a [JsonRPC](http://www.jsonrpc.org/) client in javascript (es7) for use with [jspm](http://jspm.io). 

##Example 

```js
import simplerpc from "lib/simplerpc" //import the lib

var api = simplerpc("ws://127.0.0.1:1234"); //connect to a JsonRPC server and get an object to act as the API

api.UpdateCurrentUsers = (num) => { //expose a method the server can call
	document.querySelector("#currentusers").innerText = num; 
}

var data = await api.SomeMethod("arg1", 2, 3); //call any method the server exposes and await its result
console.log(data);
```

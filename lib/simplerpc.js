import "fetch";

var id = 0;
function makejsonrpcrequest(ws, method, args) {
	var req = {
		jsonrpc: "2.0",
		method: method,
		params: args,
		id: id
	}

	if (ws.readyState != 1) return; //are we connected??

	ws.send(JSON.stringify(req));
	return id++;
}

async function handlejsonrpcrequest(api, method, params, id) {
	if (params.length == 1)
		params = params[0]

	if (typeof api[method] !== "function") return;

	if (id == undefined)
		api[method](params)
	else {
		var res = await api[method](params);
		if (!res) res = {}
		api.ws.send(JSON.stringify({
			jsonrpc: "2.0",
			result: res,
			id: id
		}));
	}
}

var runningmethods = []

function handlejsonresponse(msg) {
	if (msg.error) {
		console.log("SimpleRPC error on method call " + msg.id + ": " + msg.message);
		runningmethods[msg.id].reject(msg.code, msg.message, msg.data);
	} else {
		runningmethods[msg.id].resolve(msg.result);
	}
	runningmethods[msg.id] = undefined;
}

var funcproxy = new Proxy(function() {}, {
	apply: (_, __, args) => {
		var api = args[0];
		var name = args[1]
		args.splice(0, 2);
		return new Promise(async function(resolve, reject) {
			runningmethods[makejsonrpcrequest(api.ws, name, args)] = {
				resolve: resolve,
				reject: reject,
				time: Date.now()
			}
		});
	}
});

var handler = {
    get: (api, name) => {
        return api[name] || function(...args) {
			return funcproxy(api, name, ...args)
		};
    }
};

export default (url) => {
	var api = {
		ws: new WebSocket(url)
	};

	api.ws.onopen = function(event) {
		console.log("connected");
		if (api.onopen) api.onopen(event);
	};

	api.ws.onmessage = (event) => {
		try {
			var msg = JSON.parse(event.data);
		}
		catch(e) {
			console.log("received invalid rpc json: " + e);
			return;
		}

		if (msg.method) {
			handlejsonrpcrequest(api, msg.method, msg.params, msg.id);
		}

		if (!runningmethods[msg.id]) return;

		if (msg.error || msg.result) handlejsonresponse(msg);

	};

	return new Proxy(api, handler);
}

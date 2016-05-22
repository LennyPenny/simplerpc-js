"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var handlejsonrpcrequest = function () {
	var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(api, method, params, id) {
		var res;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						if (params.length == 1) params = params[0];

						if (!(typeof api[method] !== "function")) {
							_context.next = 3;
							break;
						}

						return _context.abrupt("return");

					case 3:
						if (!(id == undefined)) {
							_context.next = 7;
							break;
						}

						api[method](params);
						_context.next = 12;
						break;

					case 7:
						_context.next = 9;
						return api[method](params);

					case 9:
						res = _context.sent;

						if (!res) res = {};
						api.ws.send(JSON.stringify({
							jsonrpc: "2.0",
							result: res,
							id: id
						}));

					case 12:
					case "end":
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function handlejsonrpcrequest(_x, _x2, _x3, _x4) {
		return ref.apply(this, arguments);
	};
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var id = 0;
function makejsonrpcrequest(ws, method, args) {
	var req = {
		jsonrpc: "2.0",
		method: method,
		params: args,
		id: id
	};

	if (ws.readyState != 1) return; //are we connected??

	ws.send(JSON.stringify(req));
	return id++;
}

var runningmethods = [];

function handlejsonresponse(msg) {
	if (msg.error) {
		console.log("SimpleRPC error on method call " + msg.id + ": " + msg.message);
		runningmethods[msg.id].reject(msg.code, msg.message, msg.data);
	} else {
		runningmethods[msg.id].resolve(msg.result);
	}
	runningmethods[msg.id] = undefined;
}

var funcproxy = new Proxy(function () {}, {
	apply: function apply(_, __, args) {
		var api = args[0];
		var name = args[1];
		args.splice(0, 2);
		return new Promise(function () {
			var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(resolve, reject) {
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								runningmethods[makejsonrpcrequest(api.ws, name, args)] = {
									resolve: resolve,
									reject: reject,
									time: Date.now()
								};

							case 1:
							case "end":
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			return function (_x5, _x6) {
				return ref.apply(this, arguments);
			};
		}());
	}
});

var handler = {
	get: function get(api, name) {
		return api[name] || function () {
			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			return funcproxy.apply(undefined, [api, name].concat(args));
		};
	}
};

exports.default = function (url) {
	var api = {
		ws: new WebSocket(url)
	};

	api.ws.onopen = function (event) {
		console.log("connected");
		if (api.onopen) api.onopen(event);
	};

	api.ws.onmessage = function (event) {
		try {
			var msg = JSON.parse(event.data);
		} catch (e) {
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
};
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("remote-controller-server-core", [], factory);
	else if(typeof exports === 'object')
		exports["remote-controller-server-core"] = factory();
	else
		root["remote-controller-server-core"] = factory();
})(global, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./main.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../node_modules/@babel/runtime/helpers/classPrivateFieldGet.js":
/*!**********************************************************************!*\
  !*** ../node_modules/@babel/runtime/helpers/classPrivateFieldGet.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _classPrivateFieldGet(receiver, privateMap) {\n  if (!privateMap.has(receiver)) {\n    throw new TypeError(\"attempted to get private field on non-instance\");\n  }\n\n  var descriptor = privateMap.get(receiver);\n\n  if (descriptor.get) {\n    return descriptor.get.call(receiver);\n  }\n\n  return descriptor.value;\n}\n\nmodule.exports = _classPrivateFieldGet;//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvY2xhc3NQcml2YXRlRmllbGRHZXQuanMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9yZW1vdGUtY29udHJvbGxlci1zZXJ2ZXItY29yZS8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jbGFzc1ByaXZhdGVGaWVsZEdldC5qcz9lNmJjIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIF9jbGFzc1ByaXZhdGVGaWVsZEdldChyZWNlaXZlciwgcHJpdmF0ZU1hcCkge1xuICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gZ2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xuICB9XG5cbiAgdmFyIGRlc2NyaXB0b3IgPSBwcml2YXRlTWFwLmdldChyZWNlaXZlcik7XG5cbiAgaWYgKGRlc2NyaXB0b3IuZ2V0KSB7XG4gICAgcmV0dXJuIGRlc2NyaXB0b3IuZ2V0LmNhbGwocmVjZWl2ZXIpO1xuICB9XG5cbiAgcmV0dXJuIGRlc2NyaXB0b3IudmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX2NsYXNzUHJpdmF0ZUZpZWxkR2V0OyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///../node_modules/@babel/runtime/helpers/classPrivateFieldGet.js\n");

/***/ }),

/***/ "../node_modules/@babel/runtime/helpers/classPrivateFieldSet.js":
/*!**********************************************************************!*\
  !*** ../node_modules/@babel/runtime/helpers/classPrivateFieldSet.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("function _classPrivateFieldSet(receiver, privateMap, value) {\n  if (!privateMap.has(receiver)) {\n    throw new TypeError(\"attempted to set private field on non-instance\");\n  }\n\n  var descriptor = privateMap.get(receiver);\n\n  if (descriptor.set) {\n    descriptor.set.call(receiver, value);\n  } else {\n    if (!descriptor.writable) {\n      throw new TypeError(\"attempted to set read only private field\");\n    }\n\n    descriptor.value = value;\n  }\n\n  return value;\n}\n\nmodule.exports = _classPrivateFieldSet;//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvY2xhc3NQcml2YXRlRmllbGRTZXQuanMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9yZW1vdGUtY29udHJvbGxlci1zZXJ2ZXItY29yZS8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jbGFzc1ByaXZhdGVGaWVsZFNldC5qcz9mYmU2Il0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIF9jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgcHJpdmF0ZU1hcCwgdmFsdWUpIHtcbiAgaWYgKCFwcml2YXRlTWFwLmhhcyhyZWNlaXZlcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXR0ZW1wdGVkIHRvIHNldCBwcml2YXRlIGZpZWxkIG9uIG5vbi1pbnN0YW5jZVwiKTtcbiAgfVxuXG4gIHZhciBkZXNjcmlwdG9yID0gcHJpdmF0ZU1hcC5nZXQocmVjZWl2ZXIpO1xuXG4gIGlmIChkZXNjcmlwdG9yLnNldCkge1xuICAgIGRlc2NyaXB0b3Iuc2V0LmNhbGwocmVjZWl2ZXIsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIWRlc2NyaXB0b3Iud3JpdGFibGUpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gc2V0IHJlYWQgb25seSBwcml2YXRlIGZpZWxkXCIpO1xuICAgIH1cblxuICAgIGRlc2NyaXB0b3IudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfY2xhc3NQcml2YXRlRmllbGRTZXQ7Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///../node_modules/@babel/runtime/helpers/classPrivateFieldSet.js\n");

/***/ }),

/***/ "../package.json":
/*!***********************!*\
  !*** ../package.json ***!
  \***********************/
/*! exports provided: name, version, description, main, scripts, repository, keywords, author, license, bugs, homepage, devDependencies, dependencies, optionalDependencies, default */
/***/ (function(module) {

eval("module.exports = {\"name\":\"@remote-controller-server/core\",\"version\":\"0.1.0\",\"description\":\"Remote Controller Server's Core module\",\"main\":\"build/remote-controller-server-core.min.js\",\"scripts\":{\"test\":\"eslint src/**/*.test.js && jest src\",\"docs\":\"jsdoc -c jsdoc.config.js -P package.json -R README.md\",\"build\":\"NODE_ENV=production webpack\",\"start\":\"node build/remote-controller-server-core.min.js\",\"build:dev\":\"NODE_ENV=development webpack\",\"start:dev\":\"node $NODE_DEBUG_OPTION build/remote-controller-server-core.js\"},\"repository\":{\"type\":\"git\",\"url\":\"git+https://github.com/arvinall/remote-controller-server-core.git\"},\"keywords\":[\"remote-controller\",\"server\",\"core\"],\"author\":\"Arvinall <arvinall021@gmail.com>\",\"license\":\"SEE LICENSE IN LICENSE.md\",\"bugs\":{\"url\":\"https://github.com/arvinall/remote-controller-server-core/issues\"},\"homepage\":\"https://github.com/arvinall/remote-controller-server-core#readme\",\"devDependencies\":{\"@babel/core\":\"^7.2.2\",\"@babel/plugin-proposal-class-properties\":\"^7.3.0\",\"@babel/plugin-proposal-private-methods\":\"^7.3.0\",\"@babel/plugin-syntax-dynamic-import\":\"^7.2.0\",\"@babel/plugin-transform-runtime\":\"^7.2.0\",\"@babel/preset-env\":\"^7.3.1\",\"babel-eslint\":\"^10.0.1\",\"babel-loader\":\"^8.0.5\",\"eslint\":\"^5.12.1\",\"eslint-config-standard\":\"^12.0.0\",\"eslint-loader\":\"^2.1.1\",\"eslint-plugin-babel\":\"^5.3.0\",\"eslint-plugin-import\":\"^2.16.0\",\"eslint-plugin-node\":\"^8.0.1\",\"eslint-plugin-promise\":\"^4.0.1\",\"eslint-plugin-standard\":\"^4.0.0\",\"jest\":\"^24.0.0\",\"jsdoc\":\"^3.5.5\",\"jsdoc-babel\":\"^0.5.0\",\"webpack\":\"^4.29.0\",\"webpack-cli\":\"^3.2.1\"},\"dependencies\":{\"@babel/polyfill\":\"^7.2.5\",\"@babel/runtime\":\"^7.3.1\",\"engine.io\":\"^3.3.2\"},\"optionalDependencies\":{\"bufferutil\":\"^4.0.1\",\"supports-color\":\"^6.1.0\",\"utf-8-validate\":\"^5.0.2\"}};//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi4vcGFja2FnZS5qc29uLmpzIiwic291cmNlcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///../package.json\n");

/***/ }),

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/*! exports provided: default, Storage */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return ServerCore; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Storage\", function() { return Storage; });\n/* harmony import */ var _package__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../package */ \"../package.json\");\nvar _package__WEBPACK_IMPORTED_MODULE_0___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../package */ \"../package.json\", 1);\n/* harmony import */ var _storages_storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./storages/storage */ \"./storages/storage.js\");\n\n\n/**\n * Main Server Core class\n */\n\nclass ServerCore {\n  /**\n   * Make the core ready\n   *\n   * @param {object} configs\n   * @param {string} [configs.mode='production'] (production|development) If set to development, development.tool attached to development.server and start a new activity\n   */\n  constructor(configs = {}) {\n    this.version = _package__WEBPACK_IMPORTED_MODULE_0__.version;\n    this.mode = configs.mode || 'production';\n  }\n\n}\nlet Storage = _storages_storage__WEBPACK_IMPORTED_MODULE_1__[\"default\"];//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9tYWluLmpzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcmVtb3RlLWNvbnRyb2xsZXItc2VydmVyLWNvcmUvLi9tYWluLmpzP2MyMGMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhY2thZ2VKc29uIGZyb20gJy4uL3BhY2thZ2UnO1xuaW1wb3J0IFN0b3JhZ2VzU3RvcmFnZSBmcm9tICcuL3N0b3JhZ2VzL3N0b3JhZ2UnO1xuLyoqXG4gKiBNYWluIFNlcnZlciBDb3JlIGNsYXNzXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VydmVyQ29yZSB7XG4gIC8qKlxuICAgKiBNYWtlIHRoZSBjb3JlIHJlYWR5XG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlncy5tb2RlPSdwcm9kdWN0aW9uJ10gKHByb2R1Y3Rpb258ZGV2ZWxvcG1lbnQpIElmIHNldCB0byBkZXZlbG9wbWVudCwgZGV2ZWxvcG1lbnQudG9vbCBhdHRhY2hlZCB0byBkZXZlbG9wbWVudC5zZXJ2ZXIgYW5kIHN0YXJ0IGEgbmV3IGFjdGl2aXR5XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWdzID0ge30pIHtcbiAgICB0aGlzLnZlcnNpb24gPSBwYWNrYWdlSnNvbi52ZXJzaW9uO1xuICAgIHRoaXMubW9kZSA9IGNvbmZpZ3MubW9kZSB8fCAncHJvZHVjdGlvbic7XG4gIH1cblxufVxuZXhwb3J0IGxldCBTdG9yYWdlID0gU3RvcmFnZXNTdG9yYWdlOyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./main.js\n");

/***/ }),

/***/ "./storages/storage.js":
/*!*****************************!*\
  !*** ./storages/storage.js ***!
  \*****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return Storage; });\n/* harmony import */ var _babel_runtime_helpers_classPrivateFieldGet__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/classPrivateFieldGet */ \"../node_modules/@babel/runtime/helpers/classPrivateFieldGet.js\");\n/* harmony import */ var _babel_runtime_helpers_classPrivateFieldGet__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_classPrivateFieldGet__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _babel_runtime_helpers_classPrivateFieldSet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/classPrivateFieldSet */ \"../node_modules/@babel/runtime/helpers/classPrivateFieldSet.js\");\n/* harmony import */ var _babel_runtime_helpers_classPrivateFieldSet__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_classPrivateFieldSet__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! events */ \"events\");\n/* harmony import */ var events__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_4__);\n\n\n\n/**\n * @module storages/storage\n */\n\n\n\nconst ENCODING = 'utf8';\n/**\n * Storage is a json file Manager\n */\n\nclass Storage extends events__WEBPACK_IMPORTED_MODULE_4___default.a {\n  // Storage body holder\n\n  /**\n   * Initialize/Read json file\n   *\n   * @param {object} configs\n   * @param {string} configs.name json file name\n   * @param {object} configs.body json file initial content\n   * @param {object} [configs.path=process.cwd()] json file initial content\n   *\n   * @throws Will throw an error if the requested storage's json file doesn't accessible\n   */\n  constructor(configs) {\n    let initial = false;\n    let storageAccessible;\n    let storageAddress;\n    super();\n\n    _body.set(this, {\n      writable: true,\n      value: undefined\n    });\n\n    if (configs.path === undefined) configs.path = process.cwd();\n    if (typeof configs.name !== 'string') throw new Error('configs.name is required and must be string');else if (configs.body !== undefined && typeof configs.body !== 'object') throw new Error('configs.body must be object');else if (typeof configs.path !== 'string') throw new Error('configs.path must be string');\n\n    if (configs.body !== undefined) {\n      // Mark as must initial if configs.body property is defined\n      initial = true;\n    }\n    /**\n     * Address of the storage json file\n     *\n     * @type {string}\n     */\n\n\n    storageAddress = path__WEBPACK_IMPORTED_MODULE_3___default.a.join(configs.path, configs.name + '.json'); // Check storage accessibility\n\n    try {\n      fs__WEBPACK_IMPORTED_MODULE_2___default.a.accessSync(storageAddress, fs__WEBPACK_IMPORTED_MODULE_2___default.a.constants.F_OK | fs__WEBPACK_IMPORTED_MODULE_2___default.a.constants.W_OK);\n      storageAccessible = true;\n    } catch (error) {\n      storageAccessible = false;\n    }\n\n    if (initial) {\n      if (storageAccessible) throw new Error(`${configs.name} is already exist`);\n      fs__WEBPACK_IMPORTED_MODULE_2___default.a.writeFileSync(storageAddress, JSON.stringify(configs.body), {\n        encoding: ENCODING,\n        flag: 'w'\n      });\n    } else if (!storageAccessible) throw new Error(`${configs.name} is not accessible`); // Read storage and convert it to object\n\n\n    _babel_runtime_helpers_classPrivateFieldSet__WEBPACK_IMPORTED_MODULE_1___default()(this, _body, JSON.parse(fs__WEBPACK_IMPORTED_MODULE_2___default.a.readFileSync(storageAddress, {\n      encoding: ENCODING,\n      flag: 'r'\n    })));\n  }\n  /**\n   * Storage body holder\n   *\n   * @return {string}\n   */\n\n\n  get body() {\n    return _babel_runtime_helpers_classPrivateFieldGet__WEBPACK_IMPORTED_MODULE_0___default()(this, _body);\n  }\n\n}\n\nvar _body = new WeakMap();//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zdG9yYWdlcy9zdG9yYWdlLmpzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcmVtb3RlLWNvbnRyb2xsZXItc2VydmVyLWNvcmUvLi9zdG9yYWdlcy9zdG9yYWdlLmpzP2IyZjUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF9jbGFzc1ByaXZhdGVGaWVsZEdldCBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jbGFzc1ByaXZhdGVGaWVsZEdldFwiO1xuaW1wb3J0IF9jbGFzc1ByaXZhdGVGaWVsZFNldCBmcm9tIFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jbGFzc1ByaXZhdGVGaWVsZFNldFwiO1xuXG4vKipcbiAqIEBtb2R1bGUgc3RvcmFnZXMvc3RvcmFnZVxuICovXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5jb25zdCBFTkNPRElORyA9ICd1dGY4Jztcbi8qKlxuICogU3RvcmFnZSBpcyBhIGpzb24gZmlsZSBNYW5hZ2VyXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RvcmFnZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIC8vIFN0b3JhZ2UgYm9keSBob2xkZXJcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZS9SZWFkIGpzb24gZmlsZVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlncy5uYW1lIGpzb24gZmlsZSBuYW1lXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdzLmJvZHkganNvbiBmaWxlIGluaXRpYWwgY29udGVudFxuICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZ3MucGF0aD1wcm9jZXNzLmN3ZCgpXSBqc29uIGZpbGUgaW5pdGlhbCBjb250ZW50XG4gICAqXG4gICAqIEB0aHJvd3MgV2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGUgcmVxdWVzdGVkIHN0b3JhZ2UncyBqc29uIGZpbGUgZG9lc24ndCBhY2Nlc3NpYmxlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWdzKSB7XG4gICAgbGV0IGluaXRpYWwgPSBmYWxzZTtcbiAgICBsZXQgc3RvcmFnZUFjY2Vzc2libGU7XG4gICAgbGV0IHN0b3JhZ2VBZGRyZXNzO1xuICAgIHN1cGVyKCk7XG5cbiAgICBfYm9keS5zZXQodGhpcywge1xuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogdW5kZWZpbmVkXG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlncy5wYXRoID09PSB1bmRlZmluZWQpIGNvbmZpZ3MucGF0aCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgaWYgKHR5cGVvZiBjb25maWdzLm5hbWUgIT09ICdzdHJpbmcnKSB0aHJvdyBuZXcgRXJyb3IoJ2NvbmZpZ3MubmFtZSBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBzdHJpbmcnKTtlbHNlIGlmIChjb25maWdzLmJvZHkgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgY29uZmlncy5ib2R5ICE9PSAnb2JqZWN0JykgdGhyb3cgbmV3IEVycm9yKCdjb25maWdzLmJvZHkgbXVzdCBiZSBvYmplY3QnKTtlbHNlIGlmICh0eXBlb2YgY29uZmlncy5wYXRoICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCdjb25maWdzLnBhdGggbXVzdCBiZSBzdHJpbmcnKTtcblxuICAgIGlmIChjb25maWdzLmJvZHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gTWFyayBhcyBtdXN0IGluaXRpYWwgaWYgY29uZmlncy5ib2R5IHByb3BlcnR5IGlzIGRlZmluZWRcbiAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRyZXNzIG9mIHRoZSBzdG9yYWdlIGpzb24gZmlsZVxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cblxuXG4gICAgc3RvcmFnZUFkZHJlc3MgPSBwYXRoLmpvaW4oY29uZmlncy5wYXRoLCBjb25maWdzLm5hbWUgKyAnLmpzb24nKTsgLy8gQ2hlY2sgc3RvcmFnZSBhY2Nlc3NpYmlsaXR5XG5cbiAgICB0cnkge1xuICAgICAgZnMuYWNjZXNzU3luYyhzdG9yYWdlQWRkcmVzcywgZnMuY29uc3RhbnRzLkZfT0sgfCBmcy5jb25zdGFudHMuV19PSyk7XG4gICAgICBzdG9yYWdlQWNjZXNzaWJsZSA9IHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHN0b3JhZ2VBY2Nlc3NpYmxlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGluaXRpYWwpIHtcbiAgICAgIGlmIChzdG9yYWdlQWNjZXNzaWJsZSkgdGhyb3cgbmV3IEVycm9yKGAke2NvbmZpZ3MubmFtZX0gaXMgYWxyZWFkeSBleGlzdGApO1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhzdG9yYWdlQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlncy5ib2R5KSwge1xuICAgICAgICBlbmNvZGluZzogRU5DT0RJTkcsXG4gICAgICAgIGZsYWc6ICd3J1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICghc3RvcmFnZUFjY2Vzc2libGUpIHRocm93IG5ldyBFcnJvcihgJHtjb25maWdzLm5hbWV9IGlzIG5vdCBhY2Nlc3NpYmxlYCk7IC8vIFJlYWQgc3RvcmFnZSBhbmQgY29udmVydCBpdCB0byBvYmplY3RcblxuXG4gICAgX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KHRoaXMsIF9ib2R5LCBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhzdG9yYWdlQWRkcmVzcywge1xuICAgICAgZW5jb2Rpbmc6IEVOQ09ESU5HLFxuICAgICAgZmxhZzogJ3InXG4gICAgfSkpKTtcbiAgfVxuICAvKipcbiAgICogU3RvcmFnZSBib2R5IGhvbGRlclxuICAgKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqL1xuXG5cbiAgZ2V0IGJvZHkoKSB7XG4gICAgcmV0dXJuIF9jbGFzc1ByaXZhdGVGaWVsZEdldCh0aGlzLCBfYm9keSk7XG4gIH1cblxufVxuXG52YXIgX2JvZHkgPSBuZXcgV2Vha01hcCgpOyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./storages/storage.js\n");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ })

/******/ });
});
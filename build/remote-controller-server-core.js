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

/***/ "../package.json":
/*!***********************!*\
  !*** ../package.json ***!
  \***********************/
/*! exports provided: name, version, description, main, scripts, repository, keywords, author, license, bugs, homepage, devDependencies, dependencies, optionalDependencies, default */
/***/ (function(module) {

eval("module.exports = {\"name\":\"@remote-controller-server/core\",\"version\":\"0.1.0\",\"description\":\"Remote Controller Server's Core module\",\"main\":\"build/remote-controller-server-core.min.js\",\"scripts\":{\"test\":\"eslint src/**/*.test.js && jest src\",\"docs\":\"jsdoc -c jsdoc.config.js -P package.json -R README.md src/main.js\",\"build\":\"NODE_ENV=production webpack\",\"start\":\"node build/remote-controller-server-core.min.js\",\"build:dev\":\"NODE_ENV=development webpack\",\"start:dev\":\"node $NODE_DEBUG_OPTION build/remote-controller-server-core.js\"},\"repository\":{\"type\":\"git\",\"url\":\"git+https://github.com/arvinall/remote-controller-server-core.git\"},\"keywords\":[\"remote-controller\",\"server\",\"core\"],\"author\":\"Arvinall <arvinall021@gmail.com>\",\"license\":\"SEE LICENSE IN LICENSE.md\",\"bugs\":{\"url\":\"https://github.com/arvinall/remote-controller-server-core/issues\"},\"homepage\":\"https://github.com/arvinall/remote-controller-server-core#readme\",\"devDependencies\":{\"@babel/core\":\"^7.2.2\",\"@babel/plugin-proposal-class-properties\":\"^7.3.0\",\"@babel/plugin-proposal-private-methods\":\"^7.3.0\",\"@babel/plugin-syntax-dynamic-import\":\"^7.2.0\",\"@babel/plugin-transform-runtime\":\"^7.2.0\",\"@babel/preset-env\":\"^7.3.1\",\"babel-eslint\":\"^10.0.1\",\"babel-loader\":\"^8.0.5\",\"eslint\":\"^5.12.1\",\"eslint-config-standard\":\"^12.0.0\",\"eslint-loader\":\"^2.1.1\",\"eslint-plugin-babel\":\"^5.3.0\",\"eslint-plugin-import\":\"^2.16.0\",\"eslint-plugin-node\":\"^8.0.1\",\"eslint-plugin-promise\":\"^4.0.1\",\"eslint-plugin-standard\":\"^4.0.0\",\"jest\":\"^24.0.0\",\"jsdoc\":\"^3.5.5\",\"jsdoc-babel\":\"^0.5.0\",\"webpack\":\"^4.29.0\",\"webpack-cli\":\"^3.2.1\"},\"dependencies\":{\"@babel/polyfill\":\"^7.2.5\",\"@babel/runtime\":\"^7.3.1\",\"engine.io\":\"^3.3.2\"},\"optionalDependencies\":{\"bufferutil\":\"^4.0.1\",\"supports-color\":\"^6.1.0\",\"utf-8-validate\":\"^5.0.2\"}};//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi4vcGFja2FnZS5qc29uLmpzIiwic291cmNlcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///../package.json\n");

/***/ }),

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return serverCore; });\nconst PACKAGE_JSON = __webpack_require__(/*! ../package */ \"../package.json\");\n/**\n * Main Server Core class\n */\n\n\nclass serverCore {\n  /**\n   * Make the core ready\n   *\n   * @param {object} configs\n   * @param {string} [configs.mode='production'] (production|development) If set to development, developmentTool parameter attached to developmentServer start a new activity\n   */\n  constructor(configs = {}) {\n    this.version = PACKAGE_JSON.version;\n    this.mode = configs.mode || 'production';\n  }\n\n}//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9tYWluLmpzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcmVtb3RlLWNvbnRyb2xsZXItc2VydmVyLWNvcmUvLi9tYWluLmpzP2MyMGMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgUEFDS0FHRV9KU09OID0gcmVxdWlyZSgnLi4vcGFja2FnZScpO1xuLyoqXG4gKiBNYWluIFNlcnZlciBDb3JlIGNsYXNzXG4gKi9cblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBzZXJ2ZXJDb3JlIHtcbiAgLyoqXG4gICAqIE1ha2UgdGhlIGNvcmUgcmVhZHlcbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ3NcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWdzLm1vZGU9J3Byb2R1Y3Rpb24nXSAocHJvZHVjdGlvbnxkZXZlbG9wbWVudCkgSWYgc2V0IHRvIGRldmVsb3BtZW50LCBkZXZlbG9wbWVudFRvb2wgcGFyYW1ldGVyIGF0dGFjaGVkIHRvIGRldmVsb3BtZW50U2VydmVyIHN0YXJ0IGEgbmV3IGFjdGl2aXR5XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWdzID0ge30pIHtcbiAgICB0aGlzLnZlcnNpb24gPSBQQUNLQUdFX0pTT04udmVyc2lvbjtcbiAgICB0aGlzLm1vZGUgPSBjb25maWdzLm1vZGUgfHwgJ3Byb2R1Y3Rpb24nO1xuICB9XG5cbn0iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./main.js\n");

/***/ })

/******/ });
});
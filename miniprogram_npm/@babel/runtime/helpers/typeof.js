function _typeof(obj) {
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    module.exports = _typeof = function(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  module.exports.__esModule = true;
  module.exports.default = module.exports;
  return _typeof(obj);
}

module.exports = _typeof;
module.exports.__esModule = true;
module.exports.default = module.exports;

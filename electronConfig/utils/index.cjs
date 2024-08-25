const correspondingPrototype = {
  null: null,
  object: Object,
  array: Array,
  function: Function,
  string: String,
  number: Number,
  symbol: Symbol,
  bigInt: BigInt
}

const isCorrespondingPrototype = (target, targetName) =>
  (targetName && target instanceof correspondingPrototype[targetName]) || false

module.exports.isFn = (target) => isCorrespondingPrototype(target, 'function')

module.exports.isObj = (target) => isCorrespondingPrototype(target, 'object')

module.exports.isCorrespondingPrototype = isCorrespondingPrototype

module.exports.areStringsEqual = require('./areStringsEqual.cjs')

module.exports.QiniuManager = require('./QiniuManager.cjs')

const Compiler = require('./lib/compiler');

/**
 * @param {string|string[]} pattern Glob pattern, absolute path or array of those combination.
 * @param {CompilerConfig} [config]
 * @return {Promise<CompilerResult>}
 */
module.exports = (pattern, config = {}) => {
  const compiler = new Compiler(config);
  return compiler.glob(pattern).then(() => compiler.compile());
};

module.exports.Compiler = require('./lib/compiler');
module.exports.CompilerResult = require('./lib/compiler-result');
module.exports.Image = require('./lib/image');
module.exports.Sprite = require('./lib/sprite');
module.exports.SpriteValue = require('./lib/sprite-value');
module.exports.StackSprite = require('./lib/stack-sprite');
module.exports.SpriteSymbol = require('./lib/sprite-symbol');
module.exports.SpriteSymbolsMap = require('./lib/sprite-symbols-map');

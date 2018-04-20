/* eslint-disable new-cap */
const { promisify } = require('util');

const merge = require('merge-options');
const glob = promisify(require('glob-all'));
const slugify = require('url-slug');
const { readFile } = require('fs-extra');

const CompilerResult = require('./compiler-result');
const Image = require('./image');
const Sprite = require('./sprite');
const StackSprite = require('./stack-sprite');
const SpriteSymbol = require('./sprite-symbol');
const SymbolsMap = require('./sprite-symbols-map');
const { getBasename } = require('./utils');

class Compiler {
  /**
   * @typedef {Object} CompilerConfig
   * @property {string} spriteType 'classic' | 'stack'
   * @property {SpriteConfig|StackSpriteConfig} spriteConfig
   * @property {Sprite|StackSprite} spriteClass
   * @property {SpriteSymbol} symbolClass
   * @property {function(path: string)} generateSymbolId
   */
  static get defaultConfig() {
    return {
      spriteConfig: {},
      spriteType: Sprite.TYPE,
      spriteClass: Sprite,
      symbolClass: SpriteSymbol,
      generateSymbolId: (path, query = '') => {
        const decodedQuery = decodeURIComponent(decodeURIComponent(query));
        return slugify(`${getBasename(path)}${decodedQuery}`);
      }
    };
  }

  /**
   * @param {CompilerConfig} cfg
   * @return {Compiler}
   */
  static create(cfg) {
    return new Compiler(cfg);
  }

  /**
   * @param {CompilerConfig} [config]
   */
  constructor(config = {}) {
    const cfg = merge(this.constructor.defaultConfig, config);
    switch (cfg.spriteType) {
      default:
      case Sprite.TYPE:
        cfg.spriteClass = Sprite;
        break;

      case StackSprite.TYPE:
        cfg.spriteClass = StackSprite;
        break;
    }

    /** @type CompilerConfig */
    this.config = cfg;
    this._symbols = new SymbolsMap();
  }

  /**
   * @return {Array<SpriteSymbol>}
   */
  get symbols() {
    return this._symbols.toArray();
  }

  /**
   *
   * @param {SpriteSymbol} symbol
   */
  addSymbol(symbol) {
    this._symbols.add(symbol);
  }

  /**
   * @param {string} path
   * @return {Promise<SpriteSymbol>}
   */
  addSymbolFromFile(path) {
    return readFile(path)
      .then(content => this.createSymbol({ path, content }))
      .then(symbol => this.addSymbol(symbol));
  }

  /**
   * @param {Object} opts
   * @param {string} opts.path
   * @param {string} opts.content
   * @param {string} [opts.id]
   * @return {SpriteSymbol}
   */
  createSymbol({ path, content, id = this.config.generateSymbolId(path) }) {
    const img = new Image(path, content);
    return new this.config.symbolClass(id, img);
  }

  /**
   * @return {Promise<CompilerResult>}
   */
  compile() {
    const { spriteClass, spriteConfig } = this.config;
    const sprite = new spriteClass(spriteConfig, this.symbols);
    return sprite.render().then(content => new CompilerResult(content, sprite));
  }

  /**
   * @param {string|Array<string>} pattern Glob pattern, absolute path or array of those combination.
   * @return {Promise<void>}
   */
  glob(pattern) {
    return glob(pattern, { nodir: true, absolute: true })
      .then(paths => Promise.all(
        paths.map(path => this.addSymbolFromFile(path)))
      );
  }
}

module.exports = Compiler;

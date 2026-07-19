/**
 * Runtime path-alias resolver for compiled output.
 * Maps @/* → dist/* so `require('@/structures/Client')` finds
 * the compiled file at dist/structures/Client.js.
 */
const { register } = require('tsconfig-paths');
const path = require('path');

register({
  baseUrl: path.join(__dirname, 'dist'),
  paths: { '@/*': ['*'] },
});

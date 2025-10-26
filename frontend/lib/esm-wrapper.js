const wrapModule = (body) => `const exports = module.exports;
const module = { exports, hot: { accept(){}, dispose(){} } };
${body}
export default module.exports?.default ?? module.exports;
export const __esModule = true;`;
export default wrapModule;

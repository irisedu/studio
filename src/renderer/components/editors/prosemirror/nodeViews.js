import { CodeBlockView } from './codemirror.js';

export default {
	code_block: (node, view, getPos) => new CodeBlockView(node, view, getPos)
};

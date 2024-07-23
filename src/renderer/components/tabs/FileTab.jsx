import CodeMirrorEditor from '$components/editors/CodeMirrorEditor.jsx';

import File from '~icons/tabler/file-filled';
import TXT from '~icons/tabler/file-type-txt';
import JSON from '~icons/tabler/json';
import TOML from '~icons/tabler/toml';
import HTML from '~icons/tabler/brand-html5';
import CSS from '~icons/tabler/brand-css3';
import JS from '~icons/tabler/file-type-js';
import PDF from '~icons/tabler/file-type-pdf';
import TeX from '~icons/tabler/tex';
import SVG from '~icons/tabler/file-type-svg';
import JPG from '~icons/tabler/file-type-jpg';
import PNG from '~icons/tabler/file-type-png';

export const FILE_PREFIX = 'file-';

export function pathIcon(path) {
	const className = 'text-iris-500 w-5 h-5';

	if (path.endsWith('.txt')) {
		return <TXT className={className} />;
	} else if (path.endsWith('.json')) {
		return <JSON className={className} />;
	} else if (path.endsWith('.toml')) {
		return <TOML className={className} />;
	} else if (path.endsWith('.html') || path.endsWith('.njk')) {
		return <HTML className={className} />;
	} else if (path.endsWith('.css')) {
		return <CSS className={className} />;
	} else if (path.endsWith('.js')) {
		return <JS className={className} />;
	} else if (path.endsWith('.tex')) {
		return <TeX className={className} />;
	} else if (path.endsWith('.pdf')) {
		return <PDF className={className} />;
	} else if (path.endsWith('.svg')) {
		return <SVG className={className} />;
	} else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
		return <JPG className={className} />;
	} else if (path.endsWith('.png')) {
		return <PNG className={className} />;
	}

	return <File className={className} />;
}

function makeFileEditor(tabData) {
	return <CodeMirrorEditor tabData={tabData} />;
}

export function makeTabData(openDirectory, path) {
	return {
		id: FILE_PREFIX + path,
		type: 'file',
		generation: 0,
		path,
		fileName: path.slice(openDirectory.length + 1)
	};
}

export function makeTab(data) {
	return {
		id: data.id,
		generation: data.generation,
		title: data.fileName,
		icon: pathIcon(data.path),
		view: makeFileEditor(data)
	};
}

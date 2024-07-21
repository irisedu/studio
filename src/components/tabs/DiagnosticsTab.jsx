import { useState, useEffect } from 'react';
import { Link } from 'react-aria-components';
import { getVersion, getTauriVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/api/shell';
import { arch, platform, version as getOsVersion } from '@tauri-apps/api/os';

import Bug from '~icons/tabler/bug';

function DiagnosticsTab() {
	const [
		[version, tauriVersion, architecture, platformName, osVersion],
		setData
	] = useState(Array(5).fill('...'));

	useEffect(() => {
		Promise.all([
			getVersion(),
			getTauriVersion(),
			arch(),
			platform(),
			getOsVersion()
		]).then(setData);
	}, []);

	return (
		<div className="m-2 font-sans">
			<h1>Experiencing issues?</h1>
			<p>
				Contact the Iris maintainers at{' '}
				<Link
					onPress={() => open('mailto:contact@seki.pw')}
					className="react-aria-Link external"
					target="_blank"
				>
					contact@seki.pw
				</Link>{' '}
				or report an issue on{' '}
				<Link
					onPress={() => open('https://github.com/irisedu/iris-studio')}
					className="react-aria-Link external"
					target="_blank"
				>
					GitHub
				</Link>{' '}
				with the details in this tab.
			</p>

			<dl>
				<dt>Version</dt>
				<dd>{version}</dd>

				<dt>Tauri Version</dt>
				<dd>{tauriVersion}</dd>

				<dt>Architecture</dt>
				<dd>{architecture}</dd>

				<dt>Platform</dt>
				<dd>
					{platformName} {osVersion}
				</dd>
			</dl>
		</div>
	);
}

export const data = { id: 'studio-diagnostics', type: 'normal' };
export const tab = {
	id: data.id,
	title: 'Diagnostics',
	icon: <Bug className="text-iris-500 w-5 h-5" />,
	view: <DiagnosticsTab />
};

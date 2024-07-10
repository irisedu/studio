import { useState, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import Iris from '$assets/iris-word.svg?react';
import irisLogo from '$assets/iris-mono.svg';

function WelcomeTab() {
	const [version, setVersion] = useState('...');

	useEffect(() => {
		getVersion().then(setVersion);
	}, []);

	return (
		<div className="flex flex-col items-center m-2">
			<Iris className="fill-black max-w-72" />
			<p className="text-lg font-sans">Iris Studio, version {version}</p>
		</div>
	);
}

export const id = 'studio-welcome';
export const title = 'Welcome';

export function getView() {
	return <WelcomeTab />;
}

export function getIcon() {
	return (
		<img
			src={irisLogo}
			alt="Iris logo"
			className="w-6 h-6 brightness-75 dark:brightness-150"
		/>
	);
}

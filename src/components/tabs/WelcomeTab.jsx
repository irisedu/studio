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

export const data = { id: 'studio-welcome', type: 'normal' };
export const tab = {
	id: data.id,
	title: 'Welcome',
	getView() {
		return <WelcomeTab />;
	},
	getIcon() {
		return (
			<img
				src={irisLogo}
				alt="Iris logo"
				className="w-6 h-6 brightness-75 dark:brightness-150"
			/>
		);
	}
};

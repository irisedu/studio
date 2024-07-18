import { useState, useEffect } from 'react';
import { Button, MenuTrigger, Popover, Menu } from 'react-aria-components';
import irisLogo from '$assets/iris-mono.svg';
import { appWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/api/os';
import useStorage from '$hooks/useStorage.js';

import X from '~icons/tabler/x';
import ArrowsDiagonal from '~icons/tabler/arrows-diagonal';
import Sun from '~icons/tabler/sun-filled';
import Moon from '~icons/tabler/moon-filled';

function DarkToggle() {
	const [dark, setDark] = useStorage(localStorage, 'dark', false, JSON.parse);

	useEffect(() => {
		if (dark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [dark]);

	return (
		<Button
			className="round-button"
			onPress={() => setDark(!dark)}
			aria-label="Toggle dark mode"
		>
			{dark ? (
				<Sun className="text-iris-400 w-6 h-6 m-auto" />
			) : (
				<Moon className="text-iris-400 w-6 h-6 m-auto" />
			)}
		</Button>
	);
}

function TopBar({ menuItems, children }) {
	const [showDeco, setShowDeco] = useState(false);

	useEffect(() => {
		platform().then((plat) => {
			setShowDeco(plat !== 'darwin');
		});
	}, []);

	return (
		<div
			data-tauri-drag-region
			className="flex bg-iris-100 flex-row gap-6 items-center h-14 w-full px-2 border-b-[1px] border-iris-200"
		>
			<MenuTrigger>
				<Button className="round-button" aria-label="Iris Studio menu">
					<img
						src={irisLogo}
						alt="Iris logo"
						className="w-full h-full brightness-75 dark:brightness-150"
					/>
				</Button>

				<Popover>
					<Menu>{menuItems}</Menu>
				</Popover>
			</MenuTrigger>

			{children}

			<DarkToggle />

			{showDeco && (
				<div className="flex flex-row gap-1">
					<Button
						className="round-button"
						onPress={() => appWindow.minimize()}
						aria-label="Minimize"
					>
						<div className="border-iris-400 w-4 h-4 m-auto border-b-2" />
					</Button>

					<Button
						className="round-button"
						onPress={() => appWindow.toggleMaximize()}
						aria-label="Maximize"
					>
						<ArrowsDiagonal className="text-iris-400 w-6 h-6 m-auto" />
					</Button>

					<Button
						className="round-button"
						onPress={() => appWindow.close()}
						aria-label="Close"
					>
						<X className="text-iris-400 w-6 h-6 m-auto" />
					</Button>
				</div>
			)}
		</div>
	);
}

export default TopBar;

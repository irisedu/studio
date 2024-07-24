import { Button, MenuTrigger, Popover, Menu } from 'react-aria-components';
import irisLogo from '$assets/iris-mono.svg';

import { useSelector, useDispatch } from 'react-redux';
import { setDarkTheme } from '$state/appSlice.js';

import X from '~icons/tabler/x';
import ArrowsDiagonal from '~icons/tabler/arrows-diagonal';
import Sun from '~icons/tabler/sun-filled';
import Moon from '~icons/tabler/moon-filled';

function DarkToggle() {
	const dispatch = useDispatch();
	const dark = useSelector((state) => state.app.darkTheme);

	return (
		<Button
			className="round-button"
			onPress={() => dispatch(setDarkTheme(!dark))}
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
	return (
		<div className="flex bg-iris-100 flex-row gap-6 items-center h-14 w-full px-2 border-b-[1px] border-iris-200 drag-region flex-no-shrink">
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

			{os.platform !== 'darwin' && (
				<div className="flex flex-row gap-1">
					<Button
						className="round-button"
						onPress={() => win.minimize()}
						aria-label="Minimize"
					>
						<div className="border-iris-400 w-4 h-4 m-auto border-b-2" />
					</Button>

					<Button
						className="round-button"
						onPress={() => win.toggleMaximize()}
						aria-label="Maximize"
					>
						<ArrowsDiagonal className="text-iris-400 w-6 h-6 m-auto" />
					</Button>

					<Button
						className="round-button"
						onPress={() => win.close()}
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

import { useState, useEffect } from 'react';
import {
	Tabs,
	TabsContext,
	TabList,
	TabPanel,
	Tab
} from 'react-aria-components';
import { undo, redo } from 'prosemirror-history';
import { CommandButton } from './components.jsx';
import {
	useVisibilityParent,
	VisibilityContext
} from './VisibilityContext.jsx';

import HomeMenu from './HomeMenu.jsx';
import InsertMenu from './InsertMenu.jsx';
import TableMenu from './TableMenu.jsx';

import Undo from '~icons/tabler/arrow-back-up';
import Redo from '~icons/tabler/arrow-forward-up';

const tabs = [
	{ id: 'home', name: 'Home' },
	{ id: 'insert', name: 'Insert' },
	{ id: 'table', name: 'Table' }
];

const digits = {
	Digit1: 0,
	Digit2: 1,
	Digit3: 2
};

function MenuBar() {
	const { childVisibility, setChildVisibility } = useVisibilityParent();
	const [currentTab, setCurrentTab] = useState();

	useEffect(() => {
		function onKeyDown(e) {
			if (!e.ctrlKey || e.repeat) return;

			const digit = digits[e.code];
			if (digit === undefined) return;

			let openTabs = childVisibility.reduce((acc, curr, i) => {
				return curr ? [...acc, tabs[i]] : acc;
			}, []);

			openTabs = [...openTabs, ...tabs.slice(childVisibility.length)];

			const tab = openTabs[digit];
			if (tab) setCurrentTab(tab.id);
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, [childVisibility]);

	return (
		<TabsContext.Provider
			value={{ selectedKey: currentTab, onSelectionChange: setCurrentTab }}
		>
			<Tabs className="ribbon-tabs flex flex-col">
				<div className="flex flex-row items-center gap-6 p-2 overflow-auto no-scrollbar border-b-2 border-iris-200">
					<div className="flex flex-row gap-2">
						<CommandButton
							Icon={Undo}
							command={undo}
							tooltip="Undo"
							keys={['Mod', 'Z']}
							alwaysVisible
						/>
						<CommandButton
							Icon={Redo}
							command={redo}
							tooltip="Redo"
							keys={['Mod', 'Y']}
							alwaysVisible
						/>
					</div>

					<VisibilityContext.Provider
						value={{ childVisibility, setChildVisibility }}
					>
						<TabPanel
							id="home"
							className="react-aria-TabPanel flex flex-row gap-6"
							shouldForceMount
						>
							<HomeMenu index={0} />
						</TabPanel>

						<TabPanel
							id="insert"
							className="react-aria-TabPanel flex flex-row gap-6"
							shouldForceMount
						>
							<InsertMenu index={1} setCurrentTab={setCurrentTab} />
						</TabPanel>

						<TabPanel
							id="table"
							className="react-aria-TabPanel flex flex-row gap-6"
							shouldForceMount
						>
							<TableMenu index={2} />
						</TabPanel>
					</VisibilityContext.Provider>
				</div>

				<TabList>
					{tabs.map(
						(tab, i) =>
							childVisibility[i] !== false && (
								<Tab id={tab.id} key={tab.id}>
									{tab.name}
								</Tab>
							)
					)}
				</TabList>
			</Tabs>
		</TabsContext.Provider>
	);
}

export default MenuBar;

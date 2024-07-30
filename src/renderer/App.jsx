import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TopBar from '$components/TopBar.jsx';
import Sidebar from '$components/Sidebar.jsx';
import { data as welcomeTabData } from '$components/tabs/WelcomeTab.jsx';
import { data as diagnosticsTabData } from '$components/tabs/DiagnosticsTab.jsx';
import CloseDialog from '$components/CloseDialog.jsx';
import {
	Button,
	Tabs,
	TabList,
	Tab,
	TabPanel,
	ToggleButton,
	MenuItem,
	Separator,
	Collection
} from 'react-aria-components';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

import { useSelector, useDispatch } from 'react-redux';
import { setSidebarOpen } from '$state/appSlice.js';
import {
	openTab,
	closeTab,
	advanceTab,
	changeTab,
	makeTab
} from '$state/tabsSlice.js';

import SidebarRight from '~icons/tabler/layout-sidebar-right';
import SidebarRightFilled from '~icons/tabler/layout-sidebar-right-filled';
import X from '~icons/tabler/x';
import Asterisk from '~icons/tabler/asterisk';

function MenuItems() {
	const dispatch = useDispatch();

	return (
		<>
			<MenuItem onAction={() => dispatch(openTab(welcomeTabData))}>
				Open welcome tab
			</MenuItem>
			<MenuItem onAction={() => dispatch(openTab(diagnosticsTabData))}>
				Show diagnostics
			</MenuItem>
			<Separator />
			<MenuItem onAction={() => win.close()}>Quit</MenuItem>
		</>
	);
}

function App() {
	const dispatch = useDispatch();
	const dark = useSelector((state) => state.app.darkTheme);
	const sidebarOpen = useSelector((state) => state.app.sidebarOpen);
	const tabData = useSelector((state) => state.tabs.tabs);
	const tabState = useSelector((state) => state.tabs.tabState);
	const currentTab = useSelector((state) => state.tabs.currentTab);

	const lastTabs = useRef();
	const tabs = useMemo(() => {
		const res = [];

		for (const data of tabData) {
			const existingTab =
				lastTabs.current &&
				lastTabs.current.find(
					(t) => t.id === data.id && t.generation === data.generation
				);

			if (existingTab) {
				res.push(existingTab);
			} else {
				res.push(makeTab(data));
			}
		}

		lastTabs.current = res;
		return res;
	}, [tabData]);

	useEffect(() => {
		if (dark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [dark]);

	const [closeOpen, setCloseOpen] = useState(false);
	const closeCb = useRef();
	const tryCloseTab = useCallback(
		(tabId) => {
			const doClose = () => dispatch(closeTab(tabId));

			if (tabState[tabId] && tabState[tabId].modified) {
				closeCb.current = doClose;
				setCloseOpen(true);
			} else {
				doClose();
			}
		},
		[dispatch, tabState]
	);

	useEffect(() => {
		function onKeyDown(e) {
			if (!e.ctrlKey || e.repeat) return;

			if (e.code === 'Tab') {
				dispatch(advanceTab(e.shiftKey ? -1 : 1));
			} else if (e.key === 'w') {
				tryCloseTab(currentTab);
			}
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, [dispatch, currentTab, tryCloseTab]);

	return (
		<main
			className={`bg-iris-50 w-screen h-screen`}
			onContextMenu={(e) => win.contextmenu({ x: e.pageX, y: e.pageY })}
		>
			<CloseDialog
				isOpen={closeOpen}
				setIsOpen={setCloseOpen}
				callbackRef={closeCb}
			/>

			<Tabs
				className="roundout-tabs flex flex-col"
				selectedKey={currentTab}
				onSelectionChange={(selection) => dispatch(changeTab(selection))}
			>
				<TopBar menuItems={<MenuItems />}>
					{/* Margin/padding allows overflow on y with scroll on x */}
					<TabList
						aria-label="Main tabs"
						className="react-aria-TabList pt-[0.5rem] h-[calc(100%-0.5rem)] box-content grow shrink overflow-x-scroll pb-32 -mb-32 px-2 no-scrollbar"
						items={tabs}
						dependencies={[tabState]}
					>
						{(tab) => (
							<Tab>
								<span className="flex flex-row gap-2">
									{tab.icon}
									{tab.title}
									<Button
										className={`roundout-tabs__close${tabState[tab.id] && tabState[tab.id].modified ? ' opacity-100' : ''}`}
										aria-label="Close tab"
										excludeFromTabOrder
										onPress={() => tryCloseTab(tab.id)}
									>
										{tabState[tab.id] && tabState[tab.id].modified ? (
											<Asterisk className="w-3 h-3" />
										) : (
											<X className="w-3 h-3" />
										)}
									</Button>
								</span>
							</Tab>
						)}
					</TabList>

					<ToggleButton
						className="round-button"
						aria-label="Toggle sidebar"
						isSelected={sidebarOpen}
						onChange={(open) => dispatch(setSidebarOpen(open))}
					>
						{sidebarOpen ? (
							<SidebarRightFilled className="text-iris-400 w-3/5 h-3/5 m-auto" />
						) : (
							<SidebarRight className="text-iris-400 w-3/5 h-3/5 m-auto" />
						)}
					</ToggleButton>
				</TopBar>

				<PanelGroup autoSaveId="main" direction="horizontal" className="grow">
					<Panel defaultSize={80} minSize={50}>
						<Collection items={tabs}>
							{(item) => (
								<TabPanel className="react-aria-TabPanel h-full">
									{item.view}
								</TabPanel>
							)}
						</Collection>
					</Panel>

					{sidebarOpen && (
						<>
							<PanelResizeHandle className="w-[2px] bg-iris-300 data-[resize-handle-state='drag']:bg-iris-400 focus-outline" />

							<Panel
								defaultSize={20}
								minSize={15}
								className="relative bg-iris-100"
							>
								<Sidebar />
							</Panel>
						</>
					)}
				</PanelGroup>
			</Tabs>
		</main>
	);
}

export default App;

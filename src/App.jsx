import { useState, useEffect, useMemo, useRef } from 'react';
import TopBar from '$components/TopBar.jsx';
import Sidebar from '$components/Sidebar.jsx';
import { data as welcomeTabData } from '$components/tabs/WelcomeTab.jsx';
import { data as diagnosticsTabData } from '$components/tabs/DiagnosticsTab.jsx';
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
import { appWindow } from '@tauri-apps/api/window';

import { useSelector, useDispatch } from 'react-redux';
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
			<MenuItem onAction={() => appWindow.close()}>Quit</MenuItem>
		</>
	);
}

function App() {
	const dispatch = useDispatch();
	const dark = useSelector((state) => state.app.darkTheme);
	const tabData = useSelector((state) => state.tabs.tabs);
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

	const [sidebarOpen, setSidebarOpen] = useState(true);

	useEffect(() => {
		if (dark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [dark]);

	useEffect(() => {
		function onKeyDown(e) {
			if (!e.ctrlKey || e.repeat) return;

			if (e.code === 'Tab') {
				dispatch(advanceTab(e.shiftKey ? -1 : 1));
			} else if (e.key === 'w') {
				dispatch(closeTab(currentTab));
			}
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, [dispatch, currentTab]);

	return (
		<main className={`bg-iris-50 w-screen h-screen`}>
			<Tabs
				className="roundout-tabs flex flex-col"
				selectedKey={currentTab}
				onSelectionChange={(selection) => dispatch(changeTab(selection))}
			>
				<TopBar menuItems={<MenuItems />}>
					<div className="flex flex-row gap-6 items-center grow overflow-x-scroll pb-32 -mb-32 px-2 no-scrollbar">
						<TabList
							data-tauri-drag-region
							aria-label="Main tabs"
							className="react-aria-TabList pt-2 grow"
							items={tabs}
						>
							{(tab) => (
								<Tab>
									<span className="flex flex-row gap-2">
										{tab.getIcon()}
										{tab.title}
										<Button
											className="roundout-tabs__close"
											aria-label="Close tab"
											excludeFromTabOrder
											onPress={() => dispatch(closeTab(tab.id))}
										>
											<X className="w-3 h-3" />
										</Button>
									</span>
								</Tab>
							)}
						</TabList>

						<ToggleButton
							className="round-button"
							aria-label="Toggle sidebar"
							isSelected={sidebarOpen}
							onChange={setSidebarOpen}
						>
							{sidebarOpen ? (
								<SidebarRightFilled className="text-iris-400 w-6 h-6 m-auto" />
							) : (
								<SidebarRight className="text-iris-400 w-6 h-6 m-auto" />
							)}
						</ToggleButton>
					</div>
				</TopBar>

				<PanelGroup autoSaveId="main" direction="horizontal" className="grow">
					<Panel defaultSize={80} minSize={50}>
						<Collection items={tabs}>
							{(item) => <TabPanel>{item.getView()}</TabPanel>}
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

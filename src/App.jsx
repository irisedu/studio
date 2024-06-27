import { useState, useEffect, useCallback } from 'react';
import TopBar from '$components/TopBar.jsx';
import * as welcomeTab from '$components/tabs/WelcomeTab.jsx';
import * as diagnosticsTab from '$components/tabs/DiagnosticsTab.jsx';
import {
	Button,
	Tabs,
	TabList,
	Tab,
	TabPanel,
	ToggleButton,
	MenuItem,
	Separator
} from 'react-aria-components';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { appWindow } from '@tauri-apps/api/window';

import SidebarRight from '~icons/tabler/layout-sidebar-right';
import SidebarRightFilled from '~icons/tabler/layout-sidebar-right-filled';
import X from '~icons/tabler/x';
import { TabsContext } from 'react-aria-components';

function MenuItems({ openTab }) {
	return (
		<>
			<MenuItem onAction={() => openTab(welcomeTab)}>Open welcome tab</MenuItem>
			<MenuItem onAction={() => openTab(diagnosticsTab)}>
				Show diagnostics
			</MenuItem>
			<Separator />
			<MenuItem onAction={() => appWindow.close()}>Quit</MenuItem>
		</>
	);
}

function App() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [tabs, setTabs] = useState([welcomeTab]);
	const [currentTab, setCurrentTab] = useState(null);
	const [newTab, setNewTab] = useState(null);

	const openTab = useCallback(
		(tabObj) => {
			if (!tabs.some((t) => t.id === tabObj.id)) {
				setTabs([...tabs, tabObj]);
			}

			setNewTab(tabObj.id);
		},
		[tabs]
	);

	const closeTab = useCallback(
		(tabId) => {
			setTabs(tabs.filter((t) => t.id !== tabId));
		},
		[tabs]
	);

	const advanceTab = useCallback(
		(ofs) => {
			if (!tabs.length) return;

			const idx = tabs.findIndex((t) => t.id === currentTab);
			const newIdx = (((idx + ofs) % tabs.length) + tabs.length) % tabs.length;
			setCurrentTab(tabs[newIdx].id);
		},
		[tabs, currentTab]
	);

	useEffect(() => {
		if (!newTab) return;

		setCurrentTab(newTab);
		setNewTab(null);
	}, [newTab]);

	useEffect(() => {
		function onKeyDown(e) {
			if (!e.ctrlKey || e.repeat) return;

			if (e.code === 'Tab') {
				advanceTab(e.shiftKey ? -1 : 1);
			} else if (e.key === 'w') {
				closeTab(currentTab);
			}
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, [currentTab, advanceTab, closeTab]);

	return (
		<main className="bg-zinc-50 w-screen h-screen">
			<TabsContext.Provider
				value={{ selectedKey: currentTab, onSelectionChange: setCurrentTab }}
			>
				<Tabs className="roundout-tabs flex flex-col">
					<TopBar menuItems={<MenuItems openTab={openTab} />}>
						<div className="flex flex-row gap-6 items-center grow overflow-x-scroll pb-32 -mb-32 px-2 no-scrollbar">
							<TabList
								data-tauri-drag-region
								aria-label="Main tabs"
								className="react-aria-TabList pt-2 grow"
							>
								{tabs.map((tab) => (
									<Tab id={tab.id} key={tab.id}>
										<span className="flex flex-row gap-2">
											{tab.getIcon()}
											{tab.title}
											<Button
												className="roundout-tabs__close"
												aria-label="Close tab"
												excludeFromTabOrder
												onPress={() => closeTab(tab.id)}
											>
												<X className="w-3 h-3" />
											</Button>
										</span>
									</Tab>
								))}
							</TabList>

							<ToggleButton
								className="round-button"
								aria-label="Toggle sidebar"
								isSelected={sidebarOpen}
								onChange={setSidebarOpen}
							>
								{sidebarOpen ? (
									<SidebarRightFilled className="text-zinc-400 w-6 h-6 m-auto" />
								) : (
									<SidebarRight className="text-zinc-400 w-6 h-6 m-auto" />
								)}
							</ToggleButton>
						</div>
					</TopBar>

					<PanelGroup autoSaveId="main" direction="horizontal" className="grow">
						<Panel defaultSize={80} minSize={50}>
							{tabs.map((tab) => (
								<TabPanel id={tab.id} key={tab.id}>
									{tab.getView()}
								</TabPanel>
							))}
						</Panel>

						{sidebarOpen && (
							<>
								<PanelResizeHandle className="w-[2px] bg-zinc-300 data-[resize-handle-state='drag']:bg-zinc-400 focus-outline" />

								<Panel
									defaultSize={20}
									minSize={15}
									className="relative bg-zinc-100"
								>
									<p>Hi</p>
								</Panel>
							</>
						)}
					</PanelGroup>
				</Tabs>
			</TabsContext.Provider>
		</main>
	);
}

export default App;

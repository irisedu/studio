import { useState } from 'react';
import TopBar from '$components/TopBar.jsx';
import {
	Tabs,
	TabList,
	Tab,
	TabPanel,
	ToggleButton
} from 'react-aria-components';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';

import SidebarRight from '~icons/tabler/layout-sidebar-right';
import SidebarRightFilled from '~icons/tabler/layout-sidebar-right-filled';

function App() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<main className="bg-zinc-50 w-screen h-screen">
			<Tabs className="roundout-tabs flex flex-col">
				<TopBar>
					<div className="flex flex-row gap-6 items-center grow">
						<TabList
							data-tauri-drag-region
							aria-label="Main tabs"
							className="react-aria-TabList pt-2 grow"
						>
							<Tab id="test1">
								<span>Test 1</span>
							</Tab>
							<Tab id="test2">
								<span>Test 2</span>
							</Tab>
							<Tab id="test3">
								<span>Test 3</span>
							</Tab>
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
						<TabPanel id="test1">
							<p>Tab 1</p>
						</TabPanel>

						<TabPanel id="test2">
							<p>Tab 2</p>
						</TabPanel>

						<TabPanel id="test3">
							<p>Tab 3</p>
						</TabPanel>
					</Panel>

					{sidebarOpen && (
						<>
							<PanelResizeHandle className="w-[2px] bg-zinc-300 data-[resize-handle-state='drag']:bg-zinc-400" />

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
		</main>
	);
}

export default App;

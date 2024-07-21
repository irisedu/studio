import { Button, Modal, Dialog, Heading } from 'react-aria-components';

function CloseDialog({ isOpen, setIsOpen, callbackRef }) {
	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Unsaved changes</Heading>

				<p>This tab has unsaved changes. Close anyway?</p>

				<div className="flex flex-row gap-2">
					<Button
						className="react-aria-Button border-iris-300"
						onPress={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button
						className="react-aria-Button border-red-500 bg-red-600 text-white dark:border-red-400 dark:bg-red-200 dark:text-black"
						autoFocus
						onPress={() => {
							callbackRef.current();
							setIsOpen(false);
						}}
					>
						Confirm
					</Button>
				</div>
			</Dialog>
		</Modal>
	);
}

export default CloseDialog;

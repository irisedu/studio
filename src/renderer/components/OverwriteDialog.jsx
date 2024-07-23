import { Button, Modal, Dialog, Heading } from 'react-aria-components';

function OverwriteDialog({ isOpen, setIsOpen, targetFiles, callbackRef }) {
	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">File name conflict</Heading>

				<p>
					{targetFiles.length > 1 ? (
						<>
							Multiple files in the selection already exist in the destination
							folder. Would you like to overwrite them?
						</>
					) : (
						<>
							The file <span className="font-mono">{targetFiles[0]}</span>{' '}
							already exists. Would you like to overwrite it?
						</>
					)}
				</p>

				<div className="flex flex-row gap-2">
					<Button
						className="react-aria-Button border-iris-300"
						onPress={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button
						className="react-aria-Button border-iris-300"
						autoFocus
						onPress={() => {
							callbackRef.current();
							setIsOpen(false);
						}}
					>
						Overwrite
					</Button>
				</div>
			</Dialog>
		</Modal>
	);
}

export default OverwriteDialog;

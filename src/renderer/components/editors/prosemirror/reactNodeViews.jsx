import { useState, useRef } from 'react';
import {
	Button,
	DialogTrigger,
	Modal,
	Dialog,
	Heading,
	TooltipTrigger,
	Tooltip,
	TagGroup,
	Label,
	TagList,
	Tag,
	TextField,
	TextArea
} from 'react-aria-components';
import { useEditorEventCallback } from '@nytimes/react-prosemirror';

import Edit from '~icons/tabler/edit-circle';

function FrontmatterView({ node, getPos }) {
	const [isOpen, setIsOpenInternal] = useState(false);
	const authorsRef = useRef();
	const tagsRef = useRef();

	const { authors, tags } = node.attrs.data || {};

	const setIsOpen = useEditorEventCallback((view, open) => {
		setIsOpenInternal(open);

		if (open) return;

		view.dispatch(
			view.state.tr.setNodeAttribute(getPos(), 'data', {
				authors: authorsRef.current.value.split('\n').filter((a) => a.length),
				tags: tagsRef.current.value.split('\n').filter((t) => t.length)
			})
		);
	});

	return (
		<div className="mb-3 select-none">
			<DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
				<TooltipTrigger delay={300}>
					<Button className="round-button float-right">
						<Edit className="text-iris-500 w-3/5 h-3/5 m-auto" />
					</Button>
					<Tooltip placement="bottom">Edit Attributes</Tooltip>
				</TooltipTrigger>

				<Modal isDismissable>
					<Dialog>
						<Heading slot="title">Edit document attributes</Heading>

						<TextField defaultValue={(authors || []).join('\n')}>
							<Label>
								Authors, separated by <kbd>Enter</kbd>
							</Label>
							<TextArea ref={authorsRef} />
						</TextField>

						<TextField defaultValue={(tags || []).join('\n')}>
							<Label>
								Tags, separated by <kbd>Enter</kbd>
							</Label>
							<TextArea ref={tagsRef} />
						</TextField>
					</Dialog>

					<Button
						className="react-aria-Button border-iris-300"
						onPress={() => setIsOpen(false)}
					>
						Close
					</Button>
				</Modal>
			</DialogTrigger>

			<div className="flex flex-col text-sm">
				{authors && authors.length > 0 ? (
					<span className="italic">By {authors.join(', ')}</span>
				) : (
					<span className="italic">No authors</span>
				)}

				{tags && tags.length > 0 && (
					<TagGroup
						selectionMode="none"
						className="react-aria-TagGroup flex flex-row"
					>
						<Label>Tags:</Label>
						<TagList>
							{tags.map((t, i) => (
								<Tag key={i}>{t}</Tag>
							))}
						</TagList>
					</TagGroup>
				)}
			</div>
		</div>
	);
}

export default {
	frontmatter_attributes: (node, view, getPos) => ({
		component: (props) => <FrontmatterView {...props} getPos={getPos} />,
		dom: document.createElement('div')
	})
};

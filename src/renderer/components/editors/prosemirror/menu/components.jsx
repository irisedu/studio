import { Fragment, useState } from 'react';
import {
	useEditorEventCallback,
	useEditorEffect
} from '@nytimes/react-prosemirror';
import {
	Button,
	ToggleButton,
	TooltipTrigger,
	Tooltip
} from 'react-aria-components';
import { toggleMark } from 'prosemirror-commands';
import { useVisibility } from './VisibilityContext.jsx';

export function markActive(state, markType) {
	// https://github.com/ProseMirror/prosemirror-example-setup/blob/43c1d95fb8669a86c3869338da00dd6bd974197d/src/menu.ts#L58-L62
	const { from, $from, to, empty } = state.selection;
	if (empty) return !!markType.isInSet(state.storedMarks || $from.marks());

	return state.doc.rangeHasMark(from, to, markType);
}

export function isNode(state, nodeType) {
	return state.selection.$from.parent.type === nodeType;
}

function displayKey(key) {
	if (key === 'Mod') {
		return os.platform === 'darwin' ? 'Cmd' : 'Ctrl';
	}

	if (key === 'Alt') {
		return os.platform === 'darwin' ? 'Option' : 'Alt';
	}

	return key;
}

export function MenuBarTooltip({ tooltip, keys, children }) {
	return (
		<TooltipTrigger delay={300}>
			{children}
			<Tooltip
				placement="bottom"
				className="react-aria-Tooltip flex flex-col items-center"
			>
				{tooltip}
				{keys && (
					<span className="text-xs">
						{keys.map((k, i) => (
							<Fragment key={i}>
								<kbd className="text-xs">{displayKey(k)}</kbd>
								{i !== keys.length - 1 && ' + '}
							</Fragment>
						))}
					</span>
				)}
			</Tooltip>
		</TooltipTrigger>
	);
}

export function CommandButton({
	index,
	Icon,
	command,
	tooltip,
	keys,
	alwaysVisible,
	isVisible,
	...props
}) {
	const [visible, setVisible] = useVisibility(index);
	const onPress = useEditorEventCallback((view) => {
		command(view.state, view.dispatch, view);

		view.focus();
	});

	useEditorEffect((view) => {
		if (setVisible)
			setVisible(
				alwaysVisible ||
					(isVisible ? isVisible(view) : command(view.state, null, view))
			);
	});

	return (
		<MenuBarTooltip tooltip={tooltip} keys={keys}>
			<Button
				className={`round-button${visible ? '' : ' hidden'}`}
				onPress={onPress}
				aria-label={tooltip}
				{...props}
			>
				<Icon className="text-iris-500 w-3/5 h-3/5 m-auto" />
			</Button>
		</MenuBarTooltip>
	);
}

export function ToggleMarkButton({
	index,
	Icon,
	markType,
	command,
	tooltip,
	keys,
	...props
}) {
	const [visible, setVisible] = useVisibility(index);
	const [active, setActive] = useState(false);
	const onChange = useEditorEventCallback((view, value) => {
		(command || toggleMark(markType))(view.state, view.dispatch, view);
		setActive(!value);

		view.focus();
	});

	useEditorEffect((view) => {
		if (setVisible) {
			setVisible((command || toggleMark(markType))(view.state, null, view));
		}

		setActive(markActive(view.state, markType));
	});

	return (
		<MenuBarTooltip tooltip={tooltip} keys={keys}>
			<ToggleButton
				className={`round-button${visible ? '' : ' hidden'}`}
				isSelected={active}
				onChange={onChange}
				aria-label={tooltip}
				{...props}
			>
				<Icon className="text-iris-500 w-3/5 h-3/5 m-auto" />
			</ToggleButton>
		</MenuBarTooltip>
	);
}

import nightwind from 'nightwind';

export default {
	content: ['./src/**/*.jsx'],
	theme: {
		fontFamily: {
			serif: ['Vollkorn'],
			sans: ['IBM\\ Plex\\ Sans'],
			mono: ['JetBrains\\ Mono']
		},
		extend: {}
	},
	darkMode: 'class',
	plugins: [nightwind]
};

import { Box, Newline, Text } from 'ink';
import Link from 'ink-link';
import Markdown from 'markdown-to-jsx';
import { Fragment, type ReactNode, memo } from 'react';

const NewLink = (props: { href: string; children: ReactNode }) => {
	const { href, children } = props;
	const enableFallback = href.includes('http');

	return (
		<Text color="blue">
			<Link url={href} fallback={enableFallback}>
				{children}
			</Link>
		</Text>
	);
};

const ListItem = (props: { children: ReactNode }) => {
	return <Text>&nbsp;• {props.children}</Text>;
};

const Sup = (props: { children: ReactNode }) => {
	return (
		<Text color="orange" italic>
			[{props.children}]
		</Text>
	);
};

const Div = (props: { children: ReactNode }) => {
	return (
		<>
			{props.children}
			<Text>
				<Newline />
			</Text>
		</>
	);
};

export const MarkdownRenderer = memo(
	({ content }: { content: string }) => {
		return (
			<Markdown
				options={{
					forceBlock: true,
					wrapper: ({ children }) => (
						<Box flexDirection="column">{children}</Box>
					),
					overrides: {
						strong: {
							component: Text,
							props: {
								bold: true,
								color: 'cyan',
							},
						},

						em: {
							component: Text,
							props: {
								italic: true,
								color: 'green',
							},
						},
						p: {
							component: Text,
							props: {},
						},
						a: {
							component: NewLink,
						},
						div: {
							component: Div,
						},
						ul: {
							component: Fragment,
						},
						ol: {
							component: Fragment,
						},
						li: {
							component: ListItem,
							props: {},
						},
						br: {
							component: () => (
								<Text>
									<Newline />
									<Newline />
								</Text>
							),
						},
						h1: {
							component: Text,
							props: {
								bold: true,
							},
						},
						h2: {
							component: Text,
							props: {
								bold: true,
							},
						},
						h3: {
							component: Text,
							props: {
								bold: true,
							},
						},
						h4: {
							component: Text,
							props: {
								bold: true,
							},
						},
						h5: {
							component: Text,
							props: {
								bold: true,
							},
						},
						span: {
							component: Text,
							props: {},
						},
						aside: {
							component: Text,
							props: {},
						},
						sup: {
							component: Sup,
						},
						sub: {
							component: Text,
							props: {
								italic: true,
								color: 'orange',
							},
						},
						footer: {
							component: Text,
							props: {
								flexDirection: 'column',
							},
						},
						pre: {
							component: Text,
						},
					},
				}}
			>
				{content}
			</Markdown>
		);
	},
	(prev, next) => {
		return prev.content === next.content;
	},
);

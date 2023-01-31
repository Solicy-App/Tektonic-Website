import dynamic from 'next/dynamic'


const App = dynamic(() => import('components/App'))

export default function Home() {
	return (
		<App />
	);
}

import ToolBarPieces from 'components/stlViewerSubcomponents';
import { TekAlignHeader } from 'components/tekAlignHeader';
import { TekAlignPageContent } from 'components/tekAlignPageContent';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import StlViewer from 'components/stlViewer';

const wings = [
	{
		preview: '/assets/tektonicWings/tectonic_long_preview.png',
		path: '/assets/tektonicWings/tectonic_long.stl',
		name: 'angle1',
		subName: 'angle1',
		rotations: { x: 1.4, y: 0.2 },
		scale: 0.7,
		movedPos: { x: 4 }
	},
	{
		path: '/assets/tektonicWings/tectonic_angle1.stl',
		preview: '/assets/tektonicWings/tectonic_angle2_preview.png',
		name: 'angle2',
		subName: 'angle2',
		rotations: { x: 1.6, y: 0.1 },
		scale: 0.7,
		movedPos: { x: 0, z: -2, y: -2 }
	},
	{
		preview: '/assets/tektonicWings/tectonic_angle1_preview.png',
		path: '/assets/tektonicWings/tectonic_angle2.stl',
		name: 'long tectonic',
		subName: 'angle3 long tectonic',
		rotations: { x: 1.6, y: 0.1 },
		scale: 0.7,
		movedPos: { x: 1, z: -1, y: -1 }
	},
	{
		path: '/assets/tektonicWings/tectonic_single.stl',
		preview: '/assets/tektonicWings/tectonic_single_preview.png',
		name: 'single tectonic',
		subName: 'angle4 single tectonic',
		rotations: { x: 1.6, y: 0.1 },
		scale: 0.7,
		movedPos: { x: -2, z: 0, y: -2 }
	},
	{
		path: '/assets/tektonicWings/tectonic_straight.stl',
		preview: '/assets/tektonicWings/tectonic_straight_preview.png',
		name: 'straight tec...',
		subName: 'angle5 straight tec...',
		rotations: { x: 1.6, y: 0.1 },
		scale: 0.7,
		movedPos: { x: 0.5, z: 0.5, y: -2 }
	}
];

export default function TekAlign() {
	const [activeIndex, setActiveIndex] = useState(0);
	const [open, setOpen] = useState(false);

	const win = typeof window !== 'undefined';
	useEffect(() => {
		if (win) {
			setOpen(true)
		}
	}, [win])

	return (
		<div style={{
			overflow: 'hidden'
		}}>
			{/* <TekAlignHeader /> */}
			{/* <TekAlignPageContent/>   */}
			{open &&
				<StlViewer sizeX={window?.innerWidth} sizeY={window?.innerHeight} activeWing={wings[activeIndex]} wingsMesh={wings} />
			}
			<ToolBarPieces
				wings={wings}
				activeWingIndex={activeIndex}
				setActiveWingIndex={setActiveIndex}
			/>
		</div>
	);
}

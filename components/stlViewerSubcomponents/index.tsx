import { useState } from 'react';
import styles from './style.module.scss'

const tektonicPreviews = [
    {index: 1, preview: '/assets/tektonicWings/tectonic_angle1_preview.png', name: "angle1"},
    {index: 2, preview: '/assets/tektonicWings/tectonic_angle2_preview.png', name: "angle2"},
    {index: 3, preview: '/assets/tektonicWings/tectonic_long_preview.png', name: "long tectonic"},
    {index: 4, preview: '/assets/tektonicWings/tectonic_single_preview.png', name: "single tectonic"},
    {index: 5, preview: '/assets/tektonicWings/tectonic_straight_preview.png', name: "straight tec..."},
]

const ToolBarPieces = () => {
    const [selected, setSelected] = useState<number>(1)

    return (
        <div className={styles.ToolbarComponent}>
            <span className={styles.toolbarTitle}>
                Tectonic types
            </span>
            {tektonicPreviews.map((el) => {
                return (
                    <div className={styles.tectonicTypes}>
                        <img src={el.preview} alt="tectonic image" />
                        <span className={styles.tectonicName}>{ el.name }</span>
                    </div>
                )
            })}
        </div>
    )
}


export default ToolBarPieces;
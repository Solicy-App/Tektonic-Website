import ToolBarPieces from "components/stlViewerSubcomponents";
import { TekAlignHeader } from "components/tekAlignHeader";
import { TekAlignPageContent } from "components/tekAlignPageContent";
import dynamic from "next/dynamic"



const StlViewer = dynamic(() => import('components/stlViewer'))


export default function TekAlign() {
	return (
        <div>
            {/* <TekAlignHeader /> */}
            {/* <TekAlignPageContent/>   */}
            <StlViewer />
            <ToolBarPieces />
        </div>
	);
}

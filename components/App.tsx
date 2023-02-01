import Header from './header'
import React from "react"
import dynamic from "next/dynamic"


const StlViewer = dynamic(() => import('./stlViewer'))

export class App extends React.Component {
    render() {
        return (
        <div>
            {/* <Sidebar /> */}
            <Header />
            <StlViewer />
        </div>
    )}
}


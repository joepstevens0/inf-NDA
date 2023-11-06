import React, { Component } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { GraphDataType } from "../utils/types";

interface Props {
    graphData: GraphDataType;
}


interface State{
    w: string;
    h: string;
}


export default class Graph extends Component<Props, State>{

    public state:State ={
        w: "100%",
        h: "500px",
    };

    componentDidMount = () => {
        this.setState({
            w: "100%",
            h: "600px",
        })
        this.setUpListeners()
    }


    setUpListeners = () => {

        this.cy.on('tap', 'node', (event: { target: any; }) => {
            var node = event.target;
            console.log(node.data());
            
        })

        this.cy.on("cxttap", "node", (event: {target: any}) => {
            var node = event.target;

        })

        this.cy.on("tap", "edge", (event: {target: any}) => {
            var edge = event.target;
            console.log(edge.data());
            
        })

        this.cy.on("cxttap", "edge", (event: {target: any}) =>{
            var edge = event.target;
            console.log(edge.data().weight);
            
        })
    }

    public divStyle={
        border: "2px solid black",
        "borderRadius":"15px",
        margin: "10px"
    }

    public layout = {
        name: "circle",
        fit: true,
        // circle: true,
        directed: false,
        padding: 30,
        // spacingFactor: 1.5,
        animate: true,
        animationDuration: 1000,
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: false
    };

    public styleSheet:cytoscape.Stylesheet[]  = [
        {
            selector: "node",
            style: {
            backgroundColor: "#4a56a6",
            width: 20,
            height: 20,
            label: "data(label)",
            "overlay-padding": "6px",
            "text-margin-y":-5,
            //backgroundColor: "data(type)",
            
            }
        },
        {
            selector: "node:selected",
            style: {
            "border-width": "6px",
            "border-color": "#AAD8FF",
            
            "background-color": "#1b60a0",
            width: 40,
            height: 40,
            //text props
            "text-outline-color": "#298525",
            "text-outline-width": 8
            }
        },
        {
            selector: "node[type='true']",
            style: {
            //shape: "rectangle",
                "background-color": "#ff0000",
                
            }
        },
        {
            selector: "node[type='false']",
            style:{
                "background-color": "#298525"
            }
        }

        ,{
            selector: "edge",
            style: {
            label: 'data(label)',
            //width: 3,
            // "line-color": "#6774cb",
            "line-color": "#4c4f5214",
            
            "curve-style": "bezier",
            "width": 1,
            }
        },
        {
            selector: "edge[label]",
            style:{
                // "text-valign":"top",
                // "text-halign":"center"
                "text-wrap":"wrap",
                "text-margin-y":-10
            }
        }
        ];

    cy: any;

        
    render() {
        return(
            <div style={this.divStyle}>
                <CytoscapeComponent
                    elements={CytoscapeComponent.normalizeElements(this.props.graphData) }
                    style={{width: this.state.w, height: this.state.h}}
                    autounselectify={false}
                    zoomingEnabled={false}
                    boxSelectionEnabled={true}
                    layout={this.layout}
                    stylesheet={this.styleSheet}
                    cy={(cy) => {this.cy = cy;

                        cy.on("tap", "node", evt =>{
                            
                        })
                    
                    
                    }}/>
            </div>
        )
    }

}

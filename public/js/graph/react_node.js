function renderReactGraph() {
    'use strict';
    return ReactDOM.render(
        <Graph width={1195} height={650}/>,
        document.getElementById('react-graph')
    );
}

/**
 * Converts a NamedNodeMap of SVG attributes into a dictionary
 * of attribute name-value pairs.
 * @param {NamedNodeMap} svgAttributes
 */
function getAttributes(svgAttributes) {
    'use strict';

    var attrs = {};
    for (var i = 0; i < svgAttributes.length; i++) {
        var item = svgAttributes[i];
        // Will be hard-coding in className and textAnchor and markerEnd
        var ignoredAttributes = ['class', 'text-anchor', 'marker-end'];
        if (ignoredAttributes.indexOf(item.name) === -1) {
            attrs[item.name] = item.value;
        }
    }
    return attrs;
}

/**
 * Converts a style string to dictionary.
 * @param {String} styleString
 */
function getStyles(styleString) {
    'use strict';

    //Have to check if it is null since null can't be split.
    if (styleString === null || styleString === undefined) {
        return {};
    }

    var styles = {};
    styleString.split(';').forEach(function (key, value) {
        var parts = key.split(':');
        if (parts.length === 2) {
            styles[parts[0]] = parts[1];
        }
    });
    return styles;
}

function getNodes(mode) {
    'use strict';

    return $('#graph ' + mode).map(function (key, element) {
        var children = Array.prototype.map.call(element.children,
            function (child) {
                var attrs = getAttributes(child.attributes);
                return {
                    'attributes': attrs,
                    'style': getStyles(attrs['style']),
                    //innerHTML is just for text within the <text>
                    //there aren't anymore children since it was assumed only one level of children
                    'innerHTML': child.innerHTML
                };
            });
        var attrs = getAttributes(element.attributes);
        return {
            'id': element.id,
            'attributes': attrs,
            'style': getStyles(attrs['style']),
            'children': children
        };
    }).get();
}


var Graph = React.createClass({
    getInitialState: function () {
        return {
		  	labelsJSON: [],
            regionsJSON: [],
            nodesJSON: [],
            hybridsJSON: [],
            boolsJSON: [],
            edgesJSON: [],
            highlightedNodes: []
        };
    },

    componentDidMount: function () {
        $.ajax({
            dataType: 'json',
            url: 'graph-json',
            success: function (data) {
                var labelsList = [];
                var regionsList = [];
                var nodesList = [];
                var hybridsList = [];
                var boolsList = [];
                var edgesList = [];
                
                //data[0] is ["texts", [JSON]]
                data[0][1].forEach(function (entry) {
                    if (entry['rId'].substring(0,5) === 'tspan'){
                        labelsList.push(entry);
                    }
                });
                //data[1] is ["shapes", [JSON]]
                data[1][1].forEach(function (entry) {
                    if (entry['type_'] === 'Node'){
                        nodesList.push(entry);
                    }
                    if (entry['type_'] === 'Hybrid'){
                        hybridsList.push(entry);
                    }
                    if (entry['type_'] === 'BoolNode'){
                        boolsList.push(entry);
                    }
                });
                //data[2] is ["paths", [JSON]]
                //data[2][1] are the JSON without "paths"
                data[2][1].forEach(function (entry) {
                    if (entry['isRegion']){
                        regionsList.push(entry);
                    } else {
                        edgesList.push(entry);
                    }
                });
                if (this.isMounted()) {
                    this.setState({labelsJSON: labelsList,
                                   regionsJSON: regionsList,
                                   nodesJSON: nodesList,
                                   hybridsJSON: hybridsList,
                                   boolsJSON: boolsList,
                                   edgesJSON: edgesList});
                }
            }.bind(this),
            error: function(xhr, status, err) {
                console.error('graph-json', status, err.toString());
            }
        });
        //Need to hardcode these in because React does not understand these attributes
        var svgNode = ReactDOM.findDOMNode(this.refs.svg);
        var markerNode = ReactDOM.findDOMNode(this.refs.marker);

        svgNode.setAttribute('xmlns','http://www.w3.org/2000/svg');
        svgNode.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
        svgNode.setAttribute('xmlns:svg','http://www.w3.org/2000/svg');
        svgNode.setAttribute('xmlns:dc','http://purl.org/dc/elements/1.1/');
        svgNode.setAttribute('xmlns:cc','http://creativecommons.org/ns#');
        svgNode.setAttribute('xmlns:rdf','http://www.w3.org/1999/02/22-rdf-syntax-ns#');

        markerNode.setAttribute('refX', 4);
        markerNode.setAttribute('refY', 5);
        markerNode.setAttribute('markerUnits', 'strokeWidth');
        markerNode.setAttribute('orient', 'auto');
        markerNode.setAttribute('markerWidth', 7);
        markerNode.setAttribute('markerHeight', 7);

        this.getGraph();
    },

    getGraph: function (graphId) {
        if (graphId === undefined) {
            var urlSpecifiedGraph = getURLParameter('dept');

            // HACK: Temporary workaround for giving the statistics department a link to our graph.
            // Should be replaced with a more general solution.
            if (urlSpecifiedGraph === 'sta') {
                graphId = '2';
            } else if (urlSpecifiedGraph !== null) {
                graphId = '1';
            } else {
                graphId = getCookie('active-graph');
                if (graphId === '') {
                    graphId = '1';
                }
            }
        }

        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: 'static/res/graphs/gen/' + graphId + '.svg',
        }).success(function(data) {
            var lines = data.split('\n');
            $('#graph').html(lines[lines.length - 1]);
            this.refs.nodes.parseSVG();
            this.refs.bools.parseSVG();
            this.refs.edges.parseSVG();
            //this.refs.regions.parseSVG();
            //this.refs.regionLabels.parseSVG();
        }.bind(this));
    },

    nodeClick: function (event) {
        var courseID = event.currentTarget.id;
        var currentNode = this.refs['nodes'].refs[courseID];
        currentNode.toggleSelection(this);
    },

    nodeMouseEnter: function (event) {
        var courseID = event.currentTarget.id;
        var currentNode = this.refs['nodes'].refs[courseID];
        currentNode.focusPrereqs(this);

        // Old hover modal code
        if ($('.modal').length === 0) {
            removeToolTips();
            displayTooltip(courseID);
        }
    },

    nodeMouseLeave: function (event) {
        var courseID = event.currentTarget.id;
        var currentNode = this.refs['nodes'].refs[courseID];
        currentNode.unfocusPrereqs(this);

        // Old hover modal code
        if ($('.modal').length === 0) {
            var timeout = setTimeout(function () {
                $('.tooltip-group').hide('slow', function () { $(this).remove();});
            }, 100);

            timeouts.push(timeout);
        }
    },

    render: function () {
        //not all of these properties are supported in React
        var svgAttrs = {'width': this.props.width, 'height': this.props.height};
        var markerAttrs = {'id': 'arrowHead'};
        var polylineAttrs = {'points': '0,1 10,5 0,9', 'fill': 'black'};
        return (
            <svg {... svgAttrs} ref='svg' version='1.1'
                 className={this.state.highlightedNodes.length > 0 ?
                            'highlight-nodes' : ''}>
                <defs>
                    <marker {... markerAttrs} ref='marker'
                            viewBox='0 0 10 10'>
                        <polyline {... polylineAttrs}/>
                    </marker>
                </defs>
                <RegionGroup ref='regions' regionsJSON={this.state.regionsJSON}/>
                <NodeGroup ref='nodes'
                            onClick={this.nodeClick}
                            onMouseEnter={this.nodeMouseEnter}
                            onMouseLeave={this.nodeMouseLeave}
                            svg={this}
                            nodesJSON={this.state.nodesJSON}
                            hybridsJSON={this.state.hybridsJSON}
                            edgesJSON={this.state.edgesJSON}
                            highlightedNodes={this.state.highlightedNodes}/>
                <BoolGroup ref='bools' boolsJSON={this.state.boolsJSON} edgesJSON={this.state.edgesJSON}/>
                <EdgeGroup ref='edges' edgesJSON={this.state.edgesJSON}/>
                <RegionLabelGroup ref='regionLabels' labelsJSON={this.state.labelsJSON}/>
            </svg>
        );
    }
});


var RegionLabelGroup = React.createClass({
    render: function () {
        return (
            <g id='region-labels'>
                {this.props.labelsJSON.map(function (entry, value) {
                    var textAttrs = {};
                    textAttrs['x'] = entry.pos[0];
                    textAttrs['y'] = entry.pos[1];

                    var textStyle = {
                        fill : entry['fill']
                    }

                    return <text
                            {... textAttrs}
                            key={value}
                            style={textStyle}
                            textAnchor={entry['text-anchor']}>
                                {entry['text']}
                           </text>
                })}
            </g>
        );
    }
});

var RegionGroup = React.createClass({
    getInitialState: function () {
        return {
            regionsList: []
        };
    },

    componentDidMount: function () {
        this.parseSVG();
    },

    parseSVG: function () {
        this.setState({regionsList: getNodes('.region')});
    },

    render: function () {
        return (
            <g id='regions'>
                {this.props.regionsJSON.map(function (entry, value) {
                    var pathAttrs = {};
                    pathAttrs['d'] = 'M';
                    
                    entry.points.forEach(function(x){
                        pathAttrs['d'] += x[0] + ',' + x[1] + ' '});

                    var pathStyle = {
                        fill : entry.fill
                    }
                    return <path {... pathAttrs} key={value} className='region' style={pathStyle}>
            </path>
                })}
            </g>
        );
    }
});


// This now uses the new syntax for a stateless React component
// (component with only a render method).		
// It also uses ES2015 "fat arrow" syntax for function definition.		
var Region = ({attributes, styles}) => {		
    return (		
        <path {... attributes}		
              className='region'		
              style={styles} />		
    );		
};		


var NodeGroup = React.createClass({
    getInitialState: function () {
        return {
            nodesList: [],
            hybridsList: []
        };
    },

    componentDidMount: function () {
        this.parseSVG();
    },

    parseSVG: function () {
        this.setState({nodesList: getNodes('.node'), hybridsList: getNodes('.hybrid')});
    },

    render: function () {
        var svg = this.props.svg;
        var highlightedNodes = this.props.highlightedNodes;
        return (
            <g id='nodes' stroke='black'>
                {this.state.nodesList.map(function (entry, value) {
                    var highlighted = highlightedNodes.indexOf(entry['id']) >= 0;
                    var parents = [];
                    var childs = [];
                    var outEdges = [];
                    var inEdges = [];
                    /*// Can be removed when we no longer use the Haskell-generated graphs.
                    delete entry['attributes']['data-active'];

                    $('.path').map(function (key, element) {
                        if (entry['id'] === element.getAttribute('data-target-node')) {
                            parents.push(element.getAttribute('data-source-node'));
                            inEdges.push(element.id);
                        }
                        if (entry['id'] === element.getAttribute('data-source-node')) {
                            childs.push(element.getAttribute('data-target-node'));
                            outEdges.push(element.id);
                        }
                    });*/
                    this.props.edgesJSON.map(function (element, key) {
                        if (entry.id === element.target) {
                            parents.push(element.source);
                            inEdges.push(element.id_);
                        }
                        if (entry['id'] === element.target) {
                            childs.push(element.source);
                            outEdges.push(element.id_);
                        }
                    });
                    return <Node
                            attributes={entry['attributes']}
                            children={entry['children']}
                            className={'node'}
                            key={entry['id']}
                            styles={entry['style']}
                            hybrid={false}
                            ref={entry['id']}
                            parents={parents}
                            childs={childs}
                            inEdges={inEdges}
                            outEdges={outEdges}
                            {... this.props}
                            svg={svg}
                            logicalType={'AND'}
                            highlighted={highlighted} />
                }, this)}

                {this.state.hybridsList.map(function (entry, value) {
                    var parents = [];
                    var childs = [];
                    var outEdges = [];
                    var inEdges = [];
                    this.props.edgesJSON.map(function (element, key) {
                        if (entry.id === element.target) {
                            parents.push(element.source);
                            inEdges.push(element.id_);
                        }
                        if (entry['id'] === element.target) {
                            childs.push(element.source);
                            outEdges.push(element.id_);
                        }
                    });
                    return <Node
                            attributes={entry['attributes']}
                            children={entry['children']}
                            className={'hybrid'}
                            key={entry['id']}
                            styles={entry['style']}
                            hybrid={true}
                            ref={entry['id']}
                            parents={parents}
                            childs={childs}
                            inEdges={inEdges}
                            outEdges={outEdges}
                            svg={svg}/>
                }, this)}
            </g>
        );
    }
});


var Node = React.createClass({
    getInitialState: function () {
        var state = getCookie(this.props.attributes['id']);
        if (state === '') {
            state = this.props.parents.length === 0 ? 'takeable' : 'inactive';
        }
        return {
            status: state,
            selected: false
        };
    },

    isSelected: function () {
        return this.state.selected;
    },

    arePrereqsSatisfied: function (svg) {
        function isAllTrue(element) {
            return (
                svg.refs['nodes'].refs[element] ?
                svg.refs['nodes'].refs[element].isSelected() :
                svg.refs['bools'].refs[element].isSelected());
        }

        if (this.props.logicalType === 'AND') {
            return this.props.parents.every(isAllTrue);
        } else if (this.props.logicalType === 'OR') {
            return this.props.parents.some(isAllTrue);
        }
    },

    updateNode: function (svg) {
        var newState;
        if (this.arePrereqsSatisfied(svg)) {
            if (this.isSelected() || this.props.hybrid) {
                newState = 'active';
            } else {
                newState = 'takeable';
            }
        } else {
            if (this.isSelected() && !this.props.hybrid) {
                newState = 'overridden';
            } else {
                newState = 'inactive';
            }
        }

        var nodeId = this.props.attributes['id'];
        this.setState({status: newState}, function () {
            setCookie(nodeId, newState);
            this.props.childs.forEach(function (node) {
                var currentNode = svg.refs['nodes'].refs[node] ||
                                  svg.refs['bools'].refs[node];
                currentNode.updateNode(svg);
            });
            var allEdges = this.props.outEdges.concat(this.props.inEdges);
            allEdges.forEach(function (edge) {
                var currentEdge = svg.refs['edges'].refs[edge];
                
                currentEdge.updateEdge(svg);
            });
        });
    },

    toggleSelection: function (svg) {
        this.setState({selected: !this.state.selected}, function () {
            this.updateNode(svg);
        })
    },

    focusPrereqs: function (svg) {
        // Check if there are any missing prerequisites.
        if (this.state.status !== 'active') {
            this.setState({status: 'missing'}, function () {
                this.props.inEdges.forEach(function (edge) {
                    var currentEdge = svg.refs['edges'].refs[edge];
                    var sourceNode = svg.refs['nodes'].refs[currentEdge.props.source] ||
                                     svg.refs['bools'].refs[currentEdge.props.source];
                    if (!sourceNode.isSelected()) {
                        currentEdge.setState({status: 'missing'});
                    }
                });
                this.props.parents.forEach(function (node) {
                    var currentNode = svg.refs['nodes'].refs[node] ||
                                      svg.refs['bools'].refs[node];
                    currentNode.focusPrereqs(svg);
                });
            });
        }
    },

    unfocusPrereqs: function (svg) {
        this.updateNode(svg);
        this.props.parents.forEach(function (node) {
            var currentNode = svg.refs['nodes'].refs[node] ||
                              svg.refs['bools'].refs[node];
            currentNode.unfocusPrereqs(svg);
        });
    },

    render: function () {
        var newClassName = this.props.className;
        if (!this.props.hybrid) {
            newClassName += ' ' + this.state.status;
        }
        if (this.props.highlighted) {
            var attrs = this.props.children[0]['attributes'];
            var width = parseFloat(attrs['width']) / 2;
            var height = parseFloat(attrs['height']) / 2;
            var cx = parseFloat(attrs['x']) + width;
            var cy = parseFloat(attrs['y']) + height;
            var rx = width + 9;
            var ry = height + 8.5;
            var ellipse = (
                <ellipse
                    className='spotlight'
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry} />
                );
        } else {
            var ellipse = null;
        }
        return (
            <g {... this.props.attributes}
               style={this.props.styles}
               {... this.props}
               className={newClassName} >
                {ellipse}
                <rect {... this.props.children[0]['attributes']}
                      style={this.props.children[0]['style']} />
                {this.props.children.slice(1).map(function (textTag, value) {
                    return (
                        <text {... textTag['attributes']}
                              key={value}
                              style={textTag['style']}
                              textAnchor='middle'>
                            {textTag['innerHTML']}
                        </text>);
                })}
            </g>
        );
    }
});


var BoolGroup = React.createClass({
    getInitialState: function () {
        return {
            boolsList: []
        };
    },

    componentDidMount: function () {
        this.parseSVG();
    },

    parseSVG: function () {
        this.setState({boolsList: getNodes('.bool')});
    },

    render: function () {
        return (
            <g id='bools'>
                {this.state.boolsList.map(function (entry, value) {
                    var parents = [];
                    var childs = [];
                    var outEdges = [];
                    var inEdges = [];

                    this.props.edgesJSON.map(function (element, key) {
                        if (entry.id === element.target) {
                            parents.push(element.source);
                            inEdges.push(element.id_);
                        }
                        if (entry['id'] === element.target) {
                            childs.push(element.source);
                            outEdges.push(element.id_);
                        }
                    });
                    return <Bool
                            attributes={entry['attributes']}
                            children={entry['children']}
                            className='bool'
                            key={entry['id']}
                            ref={entry['id']}
                            parents={parents}
                            childs={childs}
                            inEdges={inEdges}
                            outEdges={outEdges}
                            hybrid={true}
                            logicalType={entry['children'][1].innerHTML} />
                }, this)}
            </g>
        );
    }
});


var Bool = React.createClass({
    getInitialState: function () {
        var state = getCookie(this.props.attributes['id']);
        if (state === '') {
            state = this.props.parents.length === 0 ? 'takeable' : 'inactive';
        }
        return {status: state};
    },

    isSelected: function () {
        return this.state.status == 'active';
    },

    arePrereqsSatisfied: function (svg) {
        function isAllTrue(element) {
            return (
                svg.refs['nodes'].refs[element] ?
                svg.refs['nodes'].refs[element].isSelected() :
                svg.refs['bools'].refs[element].isSelected());
        }

        if (this.props.logicalType === 'and') {
            return this.props.parents.every(isAllTrue);
        } else if (this.props.logicalType === 'or') {
            return this.props.parents.some(isAllTrue);
        }
    },

    updateNode: function (svg) {
        var newState;
        if (this.arePrereqsSatisfied(svg)) {
            newState = 'active';
        } else {
            newState = 'inactive';
        }

        var boolId = this.props.attributes['id'];
        this.setState({status: newState}, function () {
            setCookie(boolId, newState);
            this.props.childs.forEach(function (node) {
                var currentNode = svg.refs['nodes'].refs[node] ||
                                  svg.refs['bools'].refs[node];
                currentNode.updateNode(svg);
            });
            var allEdges = this.props.outEdges.concat(this.props.inEdges);
            allEdges.forEach(function (edge) {
                var currentEdge = svg.refs['edges'].refs[edge];
                currentEdge.updateEdge(svg);
            });
        });
    },

    focusPrereqs: function (svg) {
        // Check if there are any missing prerequisites.
        if (this.state.status !== 'active') {
            this.setState({status: 'missing'}, function () {
                this.props.inEdges.forEach(function (edge) {
                    var currentEdge = svg.refs['edges'].refs[edge];
                    var sourceNode = svg.refs['nodes'].refs[currentEdge.props.source] ||
                                     svg.refs['bools'].refs[currentEdge.props.source];
                    if (!sourceNode.isSelected()) {
                        currentEdge.setState({status: 'missing'});
                    }
                });
                this.props.parents.forEach(function (node) {
                    var currentNode = svg.refs['nodes'].refs[node] ||
                                      svg.refs['bools'].refs[node];
                    currentNode.focusPrereqs(svg);
                });
            });
        }
    },

    unfocusPrereqs: function (svg) {
        this.updateNode(svg);
        this.props.parents.forEach(function (node, i) {
            var currentNode = svg.refs['nodes'].refs[node] ||
                              svg.refs['bools'].refs[node];
            currentNode.unfocusPrereqs(svg);
        });
    },

    render: function () {
        return (
            <g {... this.props.attributes}
               className={this.props.className + ' ' + this.state.status} >
                <ellipse {... this.props.children[0]['attributes']}
                         style={this.props.children[0]['style']} />
                {this.props.children.slice(1).map(function (textTag, value) {
                    return (
                        <text {... textTag['attributes']}
                              key={value}
                              textAnchor='middle'>
                            {this.props.logicalType}
                        </text>);
                }.bind(this))}
            </g>
        );
    }
});


var EdgeGroup = React.createClass({
    getInitialState: function () {
        return {
            edgesList: []
        };
    },

    componentDidMount: function () {
        this.parseSVG();
    },

    parseSVG: function () {
        this.setState({edgesList: getNodes('.path')});
    },

    render: function () {
        return (
            <g id='edges' stroke='black'>
                {this.props.edgesJSON.map(function (entry, value) {
                    return <Edge
                            className='path'
                            key={value}
                            ref={entry.id_}
                            source={entry.source}
                            target={entry.target}
                            JSON={entry}/>
                })}
                {/*this.state.edgesList.map(function (entry, value) {
                    // Can be removed when we no longer use the Haskell-generated graphs.
                    delete entry['attributes']['data-active'];
                    return <Edge
                            attributes={entry['attributes']}
                            className='path'
                            key={entry['id']}
                            styles={entry['style']}
                            ref={entry['id']}
                            source={entry['attributes']['data-source-node']}
                            target={entry['attributes']['data-target-node']}/>
                })*/}
            </g>
        );
    }
});


var Edge = React.createClass({
    getInitialState: function () {
        return {
            status: 'inactive'
        };
    },

    updateEdge: function (svg) {
        var sourceNode = svg.refs['nodes'].refs[this.props.source] ||
                         svg.refs['bools'].refs[this.props.source];
        var targetNode = svg.refs['nodes'].refs[this.props.target] ||
                         svg.refs['bools'].refs[this.props.target];

        if (!sourceNode.isSelected()) {
            this.setState({status: 'inactive'});
        } else if (!targetNode.isSelected()) {
            this.setState({status: 'takeable'});
        } else {
            this.setState({status: 'active'});
        }
    },

    render: function () {
        var pathAttrs = {};
        pathAttrs['d'] = 'M';
        this.props.JSON.points.forEach(function(x){
            pathAttrs['d'] += x[0] + ',' + x[1] + ' '});
        
        return (
            <path {... pathAttrs}
                  className={this.props.className + ' ' + this.state.status}
                  markerEnd='url(#arrowHead)'>
            </path>
        );
    }
});

export default {renderReactGraph: renderReactGraph};

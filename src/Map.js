import React from 'react';

const Map = React.createClass({
    componentDidMount() {
        console.log(this.refs);
        debugger


        // this.props.setMap(map);
    },

    render() {
        return (
            <div ref="map"></div>
        );
    }

});

export default Map;

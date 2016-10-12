import React, { Component } from 'react';
import * as d3 from "d3";
const mapboxgl = require("mapbox-gl/dist/mapbox-gl.js");
mapboxgl.accessToken = "pk.eyJ1IjoiY29tZWxib3VybmUiLCJhIjoiY2lxbHFzYmt2MDAzMWZ5bm53Y2d0NjRoMyJ9.xXFwyo0bSVHG1-W33fV0xQ";
const map = window.map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/comelbourne/ciu4xvidx00cs2iqdr0jt4tw3"
});

import './App.css';
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      features: [],
      activeTags: d3.set(),
      tags: d3.map(),
      filterType: "all",
    };
  }

  componentDidMount() {
    d3.json("/data/datasets.json", (err, data) => {
      const datasets = data.datasets;
      const queue = d3.queue();
      datasets.forEach(dataset => {
        queue.defer(d3.json, "/data/" + dataset);
      });

      queue.awaitAll((error, files) => {
        let features = this.state.features;
        files.forEach(featureCollection => {
          features = features.concat(featureCollection.features);
        });

        let tags = d3.map();
        features.forEach(feature => {
          if (feature.properties.tags) {
            feature.properties.tags.forEach(tag => {
              if (!tags.has(tag)) {
                tags = tags.set(tag, 0);
              }
              tags = tags.set(tag, tags.get(tag) + 1);
            });
          }
        });

        this.setState({
          features: features,
          tags: tags,
          activeTags: d3.set(tags.keys()),
        });

        // When a click event occurs near a place, open a popup at the location of
        // the feature, with description HTML from its properties.
        map.on('click', e => {
          var features = map.queryRenderedFeatures(e.point, { layers: this.getLayers() });

          if (!features.length) {
            return;
          }

          var feature = features[0];
          // Populate the popup and set its coordinates
          // based on the feature found.
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`Tags: ${JSON.parse(feature.properties.tags).join(", ")}`)
            .addTo(map);
        });

        // Use the same approach as above to indicate that the symbols are clickable
        // by changing the cursor style to 'pointer'.
        map.on('mousemove', (e) => {
          var features = map.queryRenderedFeatures(e.point, { layers: this.getLayers() });
          map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
        });
      });
    });
  }

  handleTagChange(tag) {
    let { tags, activeTags } = this.state;
    if (activeTags.size() === tags.size()) {
      activeTags.clear();
      activeTags.add(tag);
    } else if (activeTags.has(tag)) {
      activeTags.remove(tag);
    } else {
      activeTags.add(tag);
    }

    if (activeTags.size() === 0) {
      return this.resetTags();
    }

    this.setState({
      activeTags: activeTags,
    }, this.createFilter);
  }

  getLayers() {
    return [
      "Under Construction",
      "Approved",
      "Applied",
      "Roadworks",
    ];
  }

  createFilter() {
    const filter = [this.state.filterType];
    this.state.activeTags.each(tag => filter.push(["has", tag]));

    this.getLayers().forEach(layer => {
      console.log("setFilter on layer", layer, filter);
      map.setFilter(layer, filter);
    });
  }

  componentDidUpdate() {
  }

  resetTags() {
    const { tags } = this.state;
    this.setState({
      activeTags: d3.set(tags.keys()),
    });
    this.getLayers().forEach(layer => {
      map.setFilter(layer, null);
    });
  }

  handleFilterTypeChange() {
    this.setState({
      filterType: this.state.filterType === "all" ? "any" : "all"
    }, this.createFilter);
  }

  render() {
    const { tags, activeTags, filterType } = this.state;
    const tagExtent = d3.extent(tags.values());
    const saturationChangeScale = d3.scaleSqrt().domain(tagExtent).range([0.3, 1])
    const tagFontSizeScale = d3.scaleLinear().domain(tagExtent).range([12, 18]);
    const tagColourScale = d3.scaleLinear().domain(tagExtent).range(["#fff", "#fff"]);
    const tagEntries = tags.entries().sort((a, b) => b.value - a.value);
    const tagBackgrounds = (index, value) => {
      const scheme = d3.schemeCategory10;
      const n = 10;
      const color = d3.hsl(scheme[index % n]);
      color.s *= saturationChangeScale(value);
      return color.toString();
    };

    return (
      <div className="sidebar" >
        Tags:
        <button className="filter-type" onClick={this.handleFilterTypeChange.bind(this)}>{filterType}</button>
        {activeTags.size() !== tags.size() && <button className="reset-tags" onClick={this.resetTags.bind(this)}>Reset tags filter</button>}
        <ul className="tags" >
          {
            tagEntries.map(({key, value}, index) => (
              <li className="tag" key={key} style={{
                fontSize: tagFontSizeScale(value),
                color: tagColourScale(value),
                background: tagBackgrounds(index, value),
              }}>
                <label>
                  <input type="checkbox" checked={activeTags.has(key)} onChange={() => this.handleTagChange(key)} />
                  {key}
                </label>
              </li>)
            )
          }
        </ul >
      </div >
    );
  }
}

export default App;

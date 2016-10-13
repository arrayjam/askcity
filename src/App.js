import React, { Component } from 'react';
import * as d3 from "d3";
// eslint-disable-next-line
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
      filterType: "any",
      addingToMap: null,
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
          activeTags: d3.set()//d3.set(tags.keys()),
        }, this.createFilter);

        // When a click event occurs near a place, open a popup at the location of
        // the feature, with description HTML from its properties.
        map.on('click', e => {
          if (this.state.addingToMap) {
            window.popup = new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setDOMContent(this.refs["add-to-map-popup"])
              // .setHTML(`<form onSubmit="javascript:(function(event) { event.preventDefault(); console.log(event); })()">Have your say<br /><input type="text" placeholder="Hello..." /></form>`)
              .addTo(map);

            this.setState({ addingToMap: { position: e.lngLat } })

            return;
          }

          var features = map.queryRenderedFeatures(e.point, { layers: ["ArdenBoundary"] });

          if (!features.length) {
            return;
          }

          var feature = features[0];
          // Populate the popup and set its coordinates
          // based on the feature found.
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
            <div style="width: 350px">
              <h2>Arden Station</h2>
              <p>Arden station in North Melbourne will trigger significant urban renewal of this inner-city growth area, facilitating the expansion of the central city and future proofing Melbourne's economic prosperity.</p>

              <p>Metro Tunnel's Arden station provides the opportunity to connect growth areas in Melbourne's west to the growing knowledge workforces and residential communities in Docklands and the Arden-Macaulay precinct as well as established areas including Parkville and the CBD, and existing communities in North Melbourne and West Melbourne.</p>

              <p>Find out more by visiting <a href="http://www.ardenmacaulay.vic.gov.au">www.ardenmacaulay.vic.gov.au</a> or tell us what you think!</p>

              <p>Add comment</p>
              <input type="text" style="width: 100%" /><br />
              <button type="submit" style="float: right; margin-top: 5px;">Submit</button>
            </div>
            `)
            .addTo(map);
        });

        // Use the same approach as above to indicate that the symbols are clickable
        // by changing the cursor style to 'pointer'.
        map.on('mousemove', (e) => {
          var features = map.queryRenderedFeatures(e.point, { layers: ["ArdenBoundary"] });
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
    let filter;
    if (this.state.activeTags.size() === 0) {
      filter = ["==", "something", "something"];
    } else {
      filter = [this.state.filterType];
      this.state.activeTags.each(tag => filter.push(["has", tag]));
    }

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

  addToMap() {
    map.getCanvas().style.cursor = "cross";
    this.setState({
      addingToMap: true,
    })
  }

  render() {
    const { tags, activeTags, filterType, addingToMap } = this.state;
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
      <div>
        <div ref="add-to-map-popup" style={{ display: addingToMap && addingToMap.position ? "block" : "none" }}>
          <h2>Tell MyBurb</h2>
          <form onSubmit={(event) => {
            event.preventDefault();
            console.log(event);
            console.log(this.refs.comment);
            // "idea-01"
          } }>
            <div>
              <label>My idea is…</label><br />
              <textarea height={3} />
            </div>
            <div>
              <label>My name</label><br />
              <input type="text" />
            </div>
            <div>
              <label>My email</label><br />
              <input type="text" />
            </div>
            <div>
              <input type="checkbox" /> Yes, please keep me informed of the progress of my idea
            </div>
            <button onClick={(event) => {
              window.popup.remove();
              const side = 40;
              var el = document.createElement('div');
              el.className = 'marker';
              el.style.backgroundImage = 'url(/idea-01.svg)';
              el.style.width = side + 'px';
              el.style.height = side + 'px';
              new mapboxgl.Marker(el, {offset: [-side / 2, -side / 2]})
                .setLngLat(this.state.addingToMap.position)
                .addTo(map);
              this.setState({ addingToMap: null })
            } }>Submit</button>
          </form>
        </div>
        {!addingToMap && <button className="add-to-map" onClick={this.addToMap.bind(this)}>Tell MyBurb</button>}
        <button className="show-my-comments">Show my comments</button>
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
          </ul>
        </div>
      </div >
    );
  }
}

export default App;

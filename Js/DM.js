(function(window, document, undefined) {

    'use strict';

    var DM = {};

    /**
     * @example
     * var dm = new DM.Map('map', {
     *     accessToken: 'pk.eyJ1IjoiZHJvbmVtYXAiLCJhIjoiY2luMDlidXVoMDBtZ3c4bTJvdzIzZzlsNiJ9.qIT_9G9X54DOoItfXneMUA',
     *     tile: 'mapbox.streets',
     *     latlng: [40, -74.50],
     *     zoom: 9
     * });
     *
     * @requires https://api.mapbox.com/mapbox.js/v2.4.0/mapbox.js
     * @requires https://api.mapbox.com/mapbox.js/v2.4.0/mapbox.css
     * @requires leaflet.draw.js
     * @requires leaflet.draw.css
     * @requires leaflet-geodesy.js
     * @requires leaflet-image.js
     * @requires http://gabelerner.github.io/canvg/rgbcolor.js
     * @requires http://gabelerner.github.io/canvg/StackBlur.js
     * @requires http://gabelerner.github.io/canvg/canvg.js
     *
     * @namespace
     */
    DM.Map = function(props) {

        var map,
            editableLayers,
            activeDrawTool,
            drawControl,
            drawToolPolygon,
            drawToolPolyline,
            drawToolMarker,
            drawTools,
            editTool,
            deleteTool,
            geocoder;

        /**
         * Private init
         */
        function _init() {

            // Geocoding
            geocoder = L.mapbox.geocoder('mapbox.places');

            // Initialise the FeatureGroup to store editable layers
            editableLayers = new L.FeatureGroup();

            // Add the layer to map
            map.addLayer(editableLayers);

            // Options on draw control
            var options = {
                position: 'topright',
                draw: {
                    polyline: {
                        shapeOptions: {
                            color: '#000000',
                            weight: 10
                        }
                    },
                    polygon: {
                        allowIntersection: false,
                        drawError: {
                            color: '#ff0000',
                            message: '<strong>Erreur</strong>'
                        },
                        shapeOptions: {
                            color: '#000000'
                        },

                    }
                },
                edit: {
                    featureGroup: editableLayers,
                    remove: true
                }
            };

            // Initialise the draw control and pass it the FeatureGroup of editable layers
            // Not added to map to hide it
            drawControl = new L.Control.Draw(options);

            // Options for draw tools
            L.drawLocal = {
                draw: {
                    toolbar: {
                        actions: {
                            title: 'Cancel drawing',
                            text: 'Cancel'
                        },
                        finish: {
                            title: 'Finish drawing',
                            text: 'Finish'
                        },
                        undo: {
                            title: 'Delete last point drawn',
                            text: 'Delete last point'
                        },
                        buttons: {
                            polyline: 'Draw a polyline',
                            polygon: 'Draw a polygon',
                            rectangle: 'Draw a rectangle',
                            circle: 'Draw a circle',
                            marker: 'Draw a marker'
                        }
                    },
                    handlers: {
                        circle: {
                            tooltip: {
                                start: 'Click and drag to draw circle.'
                            },
                            radius: 'Radius'
                        },
                        marker: {
                            tooltip: {
                                start: 'Click map to place marker.'
                            }
                        },
                        polygon: {
                            tooltip: {
                                start: 'Click to start drawing shape.',
                                cont: 'Click to continue drawing shape.',
                                end: 'Click first point to close this shape.'
                            }
                        },
                        polyline: {
                            error: '<strong>Error:</strong> shape edges cannot cross!',
                            tooltip: {
                                start: 'Click to start drawing line.',
                                cont: 'Click to continue drawing line.',
                                end: 'Click last point to finish line.'
                            }
                        },
                        rectangle: {
                            tooltip: {
                                start: 'Click and drag to draw rectangle.'
                            }
                        },
                        simpleshape: {
                            tooltip: {
                                end: 'Release mouse to finish drawing.'
                            }
                        }
                    }
                },
                edit: {
                    toolbar: {
                        actions: {
                            save: {
                                title: 'Save changes.',
                                text: 'Save'
                            },
                            cancel: {
                                title: 'Cancel editing, discards all changes.',
                                text: 'Cancel'
                            }
                        },
                        buttons: {
                            edit: 'Edit layers.',
                            editDisabled: 'No layers to edit.',
                            remove: 'Delete layers.',
                            removeDisabled: 'No layers to delete.'
                        }
                    },
                    handlers: {
                        edit: {
                            tooltip: {
                                text: 'Drag handles, or marker to edit feature.',
                                subtext: 'Click cancel to undo changes.'
                            }
                        },
                        remove: {
                            tooltip: {
                                text: 'Click on a feature to remove'
                            }
                        }
                    }
                }
            };

            // Draw tools
            drawToolPolygon = new L.Draw.Polygon(map, drawControl.options.draw.polygon);
            drawToolPolyline = new L.Draw.Polyline(map, drawControl.options.draw.polyline);
            drawToolMarker = new L.Draw.Marker(map, drawControl.options.draw.marker);
            drawTools = [drawToolPolygon, drawToolPolyline, drawToolMarker];

            // Edit tool
            editTool = new L.EditToolbar.Edit(map, {
                featureGroup: drawControl.options.edit.featureGroup,
                selectedPathOptions: drawControl.options.edit.selectedPathOptions
            });

            // Delete tool
            deleteTool = new L.EditToolbar.Delete(map, {
                featureGroup: drawControl.options.edit.featureGroup
            });

            _initEvents();
        }

        /**
         * Events initialization
         */
        function _initEvents() {
            // On draw created
            map.on('draw:created', function(e) {

                // Disable drawTool
                _clearDrawTool();

                var type = e.layerType,
                    layer = e.layer;

                editableLayers.addLayer(layer);

                // Directly enable editTool
                editTool.enable();
            });

            // On layer change
            [
                'draw:editmove',
                'draw:editvertex',
                'draw:editresize',
            ].forEach(function(event) {
                map.on(event, function(e) {
                    // Save
                    editTool.save();
                });
            });
        }

        /**
         * Clear draw tools
         */
        function _clearDrawTool() {
            drawTools.forEach(function(tool) {
                tool.disable();
            });
        }

        /**
         * Constructor
         * @param  {string} id - The id of the dom map
         * @param  {array} options - The options
         */
        this.initialize = function(id, options) {
            // Mapbox token
            L.mapbox.accessToken = options.accessToken;

            // Mapbox map
            map = L.mapbox.map(id, options.tile, {
                attributionControl: false,
                center: options.latlng,
                dragging: (typeof(options.dragging) !== 'undefined' ? options.dragging : true),
                minZoom: options.minZoom,
                maxZoom: options.maxZoom
            }).setView(options.latlng, options.zoom);

            // Private init
            _init();
        };

        /**
         * Set active draw tool
         * @param {('polygon'|'polyline'|'marker')} drawType - The type name of the tool
         * @example
         * dm.setActiveDrawTool('polygon');
         */
        this.setActiveDrawTool = function(drawType) {
            _clearDrawTool();
            editTool.disable();
            switch (drawType) {
                case 'polygon':
                    drawToolPolygon.enable();
                    break;
                case 'polyline':
                    drawToolPolyline.enable();
                    break;
                case 'marker':
                    drawToolMarker.enable();
                    break;
                default:
                    console.log('error : unknown draw tool');
            }
        };

        /**
         * Disable draw tool mode
         * @example
         * dm.disableDrawTool();
         */
        this.disableDrawTool = function() {
            _clearDrawTool();
            editTool.disable();
        };

        /**
         * Get Mapbox map
         * @example
         * var _map = dm.getMap()
         */
        this.getMap = function() {
            return map;
        };

        /**
         * Get informations about features
         * @param  {function} callback - The success callback
         * @example
         * dm.getInformations(function(data) {
         *  console.log(data);
         * });
         */
        this.getInformations = function(callback) {
            var self = this;
            var informations = {};
            var area = 0;

            this.callback = callback;

            editableLayers.getLayers().forEach(function(e) {
                // Only polygon
                if (e instanceof L.Polygon) {
                    area += LGeo.area(e);
                }
            });

            // Area
            informations.area = (area / 1000000).toFixed(2);

            // LatLng
            informations.latlng = {
                lat: editableLayers.getBounds().getCenter().lat,
                lng: editableLayers.getBounds().getCenter().lng
            };

            // Reverse geocoding
            geocoder.reverseQuery(informations.latlng, function(error, result) {
                var addresses = [];
                result.features.forEach(function(f) {
                    addresses.push(f.place_name);
                });
                informations.addresses = addresses;
                if (self.callback)
                    self.callback(informations);
            });

        };

        /**
         * Take snapshot
         * @param  {function} success - The success callback
         * @example
         * dm.snapshot(function(image) {
         *  window.open(image.src, '_blank');
         * });
         */
        this.snapshot = function(success) {
            var self = this;
            this.success = success;

            // Disable tools
            this.disableDrawTool();

            // Fit to features bound
            map.fitBounds(editableLayers.getBounds());

            leafletImage(map, function(err, canvas) {
                var img = document.createElement('img');
                var dimensions = map.getSize();
                img.width = dimensions.x;
                img.height = dimensions.y;
                img.src = canvas.toDataURL();
                if (self.success)
                    self.success(img);
            });
        };

        /**
         * Remove all editable features
         * @example
         * dm.removeAllFeatures();
         */
        this.removeAllFeatures = function() {
            this.disableDrawTool();
            editableLayers.clearLayers();
        };

        /**
         * Enable delete tool
         * @param {function} success - The success callback
         * @example
         * dm.enableDeleteTool(function() {
         *  console.log('success');
         * });
         */
        this.enableDeleteTool = function(success) {
            var self = this;
            this.success = success;

            editTool.disable();
            deleteTool.enable();
            map.once('layerremove', function(e) {
                deleteTool.disable();
                if (self.success)
                    self.success();
            });
        };

        this.initialize && this.initialize.apply(this, arguments);
    };

    window.DM = DM;

})(window, document);

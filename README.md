# mapstadyn

Turn [static Google maps](https://developers.google.com/maps/documentation/maps-static/overview) into dynamic ones.

## Why

* enable clients not running javascript (or not having loaded it yet)
* defer resource-intense loading until it is useful/needed
* content creators only need to worry about one way of adding the map, rest gets progressively enhanced

## Why not (anymore)

* the advent of [leaflet](https://leafletjs.com/) and [openstreetmap](https://www.openstreetmap.org/) maps made using (commercial) Google maps less attractive
* loading the maps API with the jsapi loader is deprecated
* I do not have any use for it anymore


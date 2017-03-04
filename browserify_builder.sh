#!/bin/bash

browserify ./static/js/main-page.js -o ./static/js/main-page-joined.js -t [ babelify [ react es2015 stage-0 ] ]
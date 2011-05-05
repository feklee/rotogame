// Base functionality.
//
// Copyright 2009, 2011 Felix E. Klee <felix.klee@inka.de>
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

// Creates a piece with the upper left corner ("xP", "yP") and
// the width and height "widthP", "heightP" (in piece space).
function Piece(xP, yP, widthP, heightP) {
    var that = this;
    this.xP = xP;
    this.yP = yP;
    this.widthP = widthP;
    this.heightP = heightP;
    this.areaP = widthP * heightP;
    switch (this.areaP) {
        case 1:
            this.color = 'red';
            break;
        case 2:
            this.color = 'green';
            break;
        case 4:
            this.color = 'blue';
            break;
        default:
            this.color = 'gray';
            break;
    }

    // Returns true, iff this piece is the same as the piece "piece2".
    // Two pieces are the same if their position and dimensions are
    // the same.
    this.equals = function(piece2) {
        return (
            that.xP == piece2.xP &&
            that.yP == piece2.yP &&
            that.widthP == piece2.widthP &&
            that.heightP == piece2.heightP);
    }
}

// Creates a board.
function Board() {
    ;
}

// Sets the dimensions in screen and in piece space and stores them in
// "this.width", "this.height", "this.widthP", and "this.heightP".
Board.prototype.setDimensions = function() {
    this.widthP = this.heightP = 0;
    for (var i in this.pieces) {
        var piece = this.pieces[i];
        this.widthP = Math.max(this.widthP, piece.xP + piece.widthP);
        this.heightP = Math.max(this.heightP, piece.yP + piece.heightP);
    }
    this.width = (this.widthP + 1) * this.spacing + 
        this.widthP * this.unitLength;
    this.height = (this.heightP + 1) * this.spacing + 
        this.heightP * this.unitLength;
}

// Converts a position (horizontal or vertical, i.e. x or y) from the
// board coordinate system into the piece coordinate system.
Board.prototype.toPiecePos = function(pos) {
    return (pos - this.spacing) / 
        (this.spacing + this.unitLength);
}

// Inverse of "toPiecePos()".
Board.prototype.fromPiecePos = function(pos) {
    return (pos + 1) * this.spacing + 
        pos * this.unitLength;
}

// Converts a distance from the piece coordinate system into the board
// coordinate system.
Board.prototype.fromPieceDist = function(dist) {
    return dist * this.unitLength + 
        (dist - 1) * this.spacing;
}

// Draws a piece on the surface or group "c". Returns the shape.
Board.prototype.drawPiece = function(c, piece) {
    var x = this.fromPiecePos(piece.xP);
    var y = this.fromPiecePos(piece.yP);
    var width = this.fromPieceDist(piece.widthP);
    var height = this.fromPieceDist(piece.heightP);

    // If VML is used, then stroking the rectangle appears to
    // give sharper edges. Otherwise, the opposite seems to be
    // the case.
    if (dojox.gfx.renderer == 'vml') {
        var s = c.createRect({
            x: x, y: y, width: width - 1, height: height - 1
        }).
        setStroke({width: 1, color: piece.color});
    } else {
        var s = c.createRect({x: x, y: y, width: width, height: height});
    }

    return s.setFill(piece.color).moveToBack();
}

// Draws the current piece configuration.
Board.prototype.draw = function() {
    for (var i in this.pieces) {
        var piece = this.pieces[i];
        if (piece.shape)
            piece.shape.removeShape();
        piece.shape = this.drawPiece(this.surface, piece);
    }
}

// Initializes the board with the pieces "this.pieces" and shows it.
Board.prototype.create = function() {
    this.setDimensions();
    this.surface = dojox.gfx.createSurface(this.node, this.width, this.height);
    this.node.style.width = this.width + 'px';
    this.node.style.height = this.height + 'px';
    this.draw();
}

// Returns an array of pieces, created from "pieceDescriptions",
// which is an array where each element describes the position
// and dimensions of a piece.
Board.prototype.fromPieceDescriptions = function(pieceDescriptions) {
    var pieces = [];
    for (i in pieceDescriptions) {
        var pd = pieceDescriptions[i];
        pieces.push(new Piece(pd.xP, pd.yP, pd.widthP, pd.heightP));
    }
    return pieces;
}
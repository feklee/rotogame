// Game specific functionality.
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

// Creates a new game using the board with the ID "boardID".
function Game(boardID) {
    var that = this;
    this.topPlayers = new TopPlayers(boardID, 9);
    var interactiveBoard = new InteractiveBoard(boardID, that.topPlayers);
    var previewBoard = new PreviewBoard(boardID);

    // Second step of the show process. Positions and shows
    // all game components: the board in two instances, 
    // as preview, and as interactive playing field. Also 
    // shows the top players table.
    function show2(data, ioargs) {
        dojo.byId("preview2").style.paddingTop = 
            data.previewPaddingTop + 'px';
        dojo.byId("statusImg").style.marginBottom =
            data.statusImgMarginBottom + 'px';
        dojo.byId("preview").appendChild(previewBoard.node);
        dojo.byId("interactive").appendChild(interactiveBoard.node);
        dojo.byId("previewAndInteractive").style.visibility = 
            'visible';
        dojo.byId("topPlayersStatus").style.visibility = 
            'visible';
        interactiveBoard.show();
        previewBoard.show();
        that.topPlayers.show();
    }

    // Displays the board.
    this.show = function() {
        // First step of the show process, requests the board data
        // from the server:
        dojo.xhrGet({
            url: "/rpc/game",
            content: {
                "board_id": boardID
            },
            handleAs: "json",
            load: show2
        });
    }
}

function Rubberband(board, x1, y1) {
    var that = this;

    // Position and dimensions:
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    
    // position and dimensions in piece space, rounded to integer
    // values according to how the selection should work:
    this.xP = 0;
    this.yP = 0;
    this.widthP = 0;
    this.heightP = 0;

    // true, iff the rubberband has been pulled to the right:
    this.draggedRight = false;

    // the rectangle visualizing the rubberband is created hidden
    // (i.e. outside of the visible area):
    var rect = board.surface.createRect({
        x: board.width, y: board.height, width: 1, height: 1}).
        setStroke({width: 1, color: "black"}).
        setFill([255, 255, 255, 0.3]);
    
    // Resizes the rubberband, using the coordinates x2, y2 as one
    // corner.
    this.update = function(x2, y2) {
        that.width = Math.abs(x2 - x1) + 1;
        that.height = Math.abs(y2 - y1) + 1;
        that.x = Math.min(x1, x2);
        that.y = Math.min(y1, y2);

        that.xP = Math.floor(board.toPiecePos(that.x));
        that.yP = Math.floor(board.toPiecePos(that.y));
        that.widthP = Math.ceil(board.toPiecePos(that.x + that.width)) - 
            that.xP;
        that.heightP = Math.ceil(board.toPiecePos(that.y + that.height)) - 
            that.yP;
        
        that.draggedRight = x2 > x1;

        rect.setShape({
            x: that.x, y: that.y, 
            width: that.width, height: that.height});
    }
    
    // Removes the rectangle, if it exists. The rubberband
    // is unusable afterwards.
    this.remove = function() {
        rect.removeShape();
    }
}

// The pieces selected by the rubberband "rubberband" on the board
// "board".
function Selection(board, rubberband) {
    var that = this;
    
    setPieces();
    setBoundingBox();
    setIsRotatable();
    if (this.isRotatable) {
        setRotateBy180();
        setCenter();
    }

    // Only relevant if the selection is rotatable. In this case, true
    // indicates that the rotation should be performed clockwise
    // (rubberband has been dragged to the right), and false the
    // oposite.
    this.rotateCW = rubberband.draggedRight;

    that.isPieceSelected = function(piece) {
        return piece.selected;
    }

    // Finds the smallest possible rectangle enclosing the selection
    // and stores its position and dimensions in "this.xP", "this.yP",
    // "this.widthP", and "this.heightP", and in "this.x1P",
    // "this.y1P", "this.x2P", and "this.y2P".
    function setBoundingBox() {
        that.x1P = board.widthP - 1;
        that.y1P = board.heightP - 1;
        that.x2P = that.y2P = 0;
        for (var i in that.pieces) {
            piece = that.pieces[i];
            that.x1P = Math.min(that.x1P, piece.xP);
            that.x2P = Math.max(that.x2P, piece.xP + piece.widthP - 1);
            that.y1P = Math.min(that.y1P, piece.yP);
            that.y2P = Math.max(that.y2P, piece.yP + piece.heightP - 1);
        }
        that.xP = that.x1P;
        that.yP = that.y1P;
        that.widthP = that.x2P - that.x1P + 1;
        that.heightP = that.y2P - that.y1P + 1;
    }

    // Stores whether the piece "piece" is selected or not in the
    // "piece.selected" (true or false). A piece is selected if there
    // is an overlap between the piece and the area described by the
    // rubberband.
    function updateSelectionState(piece) {
        // Coordinates of the piece and the rubberband in piece space:
        var rubbrX1P = rubberband.xP, rubbrY1P = rubberband.yP;
        var rubbrX2P = rubberband.xP + rubberband.widthP - 1;
        var rubbrY2P = rubberband.yP + rubberband.heightP - 1;
        var pieceX1P = piece.xP, pieceY1P = piece.yP;
        var pieceX2P = piece.xP + piece.widthP - 1;
        var pieceY2P = piece.yP + piece.heightP - 1;
        piece.selected =
            ((rubbrX1P <= pieceX1P && rubbrX2P >= pieceX1P) ||
             (rubbrX1P > pieceX1P && rubbrX1P <= pieceX2P)) &&
            ((rubbrY1P <= pieceY1P && rubbrY2P >= pieceY1P) ||
             (rubbrY1P > pieceY1P && rubbrY1P <= pieceY2P));
    }
    
    // Finds the pieces within the selection and writes them to
    // "this.pieces". Also updates "piece.selected" for each piece on
    // the board.
    function setPieces() {
        that.pieces = Array();
        for (var i in board.pieces) {
            var piece = board.pieces[i];
            updateSelectionState(piece);
            if (piece.selected)
                that.pieces.push(piece);
        }
    }

    // Checks whether the selection forms a rectangle without holes
    // and returns the result (true or false).
    function isRectangle() {
        // The total number of size 1x1 fields (in piece space) that
        // are occupied by the selected pieces:
        var occupiedFields = 0;
        for (var i in that.pieces) {
            var piece = that.pieces[i];
            occupiedFields += piece.widthP * piece.heightP;
        }
        return (occupiedFields == that.widthP * that.heightP);
    }
    
    // Checks whether the selection is rotatable. This is the case,
    // iff two conditions are met: 1. The selection forms a rectangle
    // without holes. 2. The selection consists of more than one
    // piece.
    function setIsRotatable() {
        that.isRotatable = (isRectangle() && that.pieces.length > 1);
    }
    
    // If the selection is rotatable, updates "this.rotate180" (true:
    // rotation by 180°, false: rotation by 90°).
    function setRotateBy180() {
        that.rotateBy180 = that.widthP != that.heightP;
    }
    
    // Finds the rotation center (i.e. the center of gravity) and
    // stores it in "this.center.x" and "this.center.y".
    function setCenter() {
        that.center = new Array();
        that.center.x = board.fromPiecePos(that.xP) + 
            board.fromPieceDist(that.widthP) / 2;
        that.center.y = board.fromPiecePos(that.yP) + 
            board.fromPieceDist(that.heightP) / 2;
    }
}

// Mouse state.
function Mouse() {
    this.x = 0;
    this.y = 0;
    this.down = false; // true, iff the button is pressed
}

// Creates the interactive board with the board ID "boardID". 
// "topPlayers" is the top players table.
function InteractiveBoard(boardID, topPlayers) {
    Board.call(this);
    var that = this;
    var rubberband = null; // for selecting pieces
    var mouse = new Mouse();
    this.node = document.createElement('div');
    this.setDimensions();
    
    // recoring of the moves that the user made:
    rotations = [];

    // whether the final piece configuration has been reached:
    this.isFinal = false;

    // rotation animation state and settings:
    var rot = new Array();
    rot.inProgress = false; // true, iff animation is in progress
    rot.framesPer90 = 8; // number of frames per 90° rotation

    this.selection;

    // rectangle for highlighting the selection:
    var selectionRect;

    // images used to indicate rotation direction:
    var img180;

    // shapes used to indicate rotation angle and direction:
    var rotIndicators = [];
    var rotIndicator; // current indicator

    // Creates an indicator image of size "size", showing a rotation with angle
    // "angle" in the direction "direction" and returns the result.
    function createRotIndicator(angle, direction, size) {
        var img = "/images/" + angle + direction + '_' + size + '.png';
        var r = that.surface.createImage({
            src: img, width: 6 * size, height: 6 * size, 
            x: that.width, y: that.height});
        if (dojox.gfx.renderer == 'svg')
            // Setting the fill this way is necessary because 1. otherwise the
            // image is not displayed in FF3, and 2. the setFill function does
            // not seem to work with images.
            r.rawNode.removeAttribute("fill");
        return r;
    }
    
    // Loads all four rotation indicator images on the surface and hides them
    // by placing them out of sight. Also sets the current rotation indactor
    // to one of them.
    function createRotIndicators() {
        var size = (that.spacing >= 4) ? 4 : 3;
        var angles = ['90', '180'];
        var directions = ['cw', 'ccw'];
        for (var i in angles) {
            var angle = angles[i];
            rotIndicators[angle] = [];
            for (var j in directions) {
                var direction = directions[j];
                rotIndicators[angle][direction] = createRotIndicator(
                    angle, direction, size);
            }
        }
        rotIndicator = rotIndicators['90']['cw'];
    }

    // Hides the current rotation indicator.
    function hideRotIndicator() {
        // moves it out of sight:
        rotIndicator.setShape({
            x: that.width,
            y: that.height});
    }
    
    // Creates the rectangle for highlighting a rotatable set
    // of pieces. Initially the rectangle is hidden.
    function createSelectionRect() {
        selectionRect = that.surface.createRect({
            x: that.width, y: that.height, 
            width: 1, height: 1}).
            setFill("yellow");
    }
    
    // Hides the rectangle used for highlighting a rotatable
    // set of pieces.
    function hideSelectionRect() {
        selectionRect.setShape({x: that.width, y: that.height, 
            width: 1, height: 1});
    }

    // Highlights the selection of pieces, "selection", if
    // that is rotatable. In particular updates the selection 
    // highlight rectangle and the rotation indicator.
    function updateSelectionHighlight(selection) {
        if (selection.isRotatable) {
            var x = that.fromPiecePos(selection.xP) - that.spacing;
            var y = that.fromPiecePos(selection.yP) - that.spacing;
            var width = that.fromPieceDist(selection.widthP) + 
                2 * that.spacing;
            var height = that.fromPieceDist(selection.heightP) + 
                2 * that.spacing;
            selectionRect.setShape({
                x: x, y: y, width: width, height: height}).
                moveToBack();
            var tmpRotIndicator = rotIndicators
                [selection.rotateBy180 ? "180" : "90"]
                [selection.rotateCW ? "cw" : "ccw"];
            if (tmpRotIndicator != rotIndicator) {
                hideRotIndicator();
                rotIndicator = tmpRotIndicator;
            }
            rotIndicator.setShape({
                x: x + width - rotIndicator.shape.width - that.spacing, 
                y: y + height - rotIndicator.shape.height - that.spacing});
            rotIndicator.moveToFront();
        } else {
            removeSelectionHighlight();
        }
    }

    // Removes the hightlight for the selection.
    function removeSelectionHighlight() {
        hideSelectionRect();
        hideRotIndicator();
    }

    // Rotates the pieces in the selection "selection", around the
    // selection's center of gravity, using the smallest possible
    // angle. The rotation direction is counter clock wise.
    function rotate(selection) {
        if (selection.rotateBy180) {
            rotate180(selection);
        } else {
            if (selection.rotateCW)
                rotate90CW(selection);
            else
                rotate90CCW(selection);
        }
        rotations.push([
            selection.rotateCW, 
            [selection.xP, selection.yP, 
            selection.widthP, selection.heightP]]);
        dojo.byId("nRotations").innerHTML = rotations.length;
    }

    // Rotates the selection by 90° clockwise. See also "rotate()".
    function rotate90CW(selection) {
        for (var i in selection.pieces) {
            var piece = selection.pieces[i];
            var tmp;
            tmp = piece.yP
            piece.yP = (piece.xP - selection.xP) + selection.yP;
            piece.xP = selection.heightP - (tmp - selection.yP) + 
                selection.xP - piece.heightP
            tmp = piece.widthP
            piece.widthP = piece.heightP
            piece.heightP = tmp;
        }
    }
    
    // Rotates the selection by 90° counter clockwise. See also
    // "rotate()".
    function rotate90CCW(selection) {
        for (var i in selection.pieces) {
            var piece = selection.pieces[i];
            var tmp;
            tmp = piece.xP
            piece.xP = (piece.yP - selection.yP) + selection.xP;
            piece.yP = selection.widthP - (tmp - selection.xP) + 
                selection.yP - piece.widthP
            tmp = piece.widthP
            piece.widthP = piece.heightP
            piece.heightP = tmp;
        }
    }

    // Rotates the selection by 180°. See also "rotate()".
    function rotate180(selection) {
        for (var i in selection.pieces) {
            var piece = selection.pieces[i];
            piece.xP = selection.widthP - 
				(piece.xP + piece.widthP - selection.xP) + selection.xP;
            piece.yP = selection.heightP - 
				(piece.yP + piece.heightP - selection.yP) + selection.yP;
        }
    }

    // Called on each frame when the mouse button is down.
    function nextFrameWithMouseDown() {
        if (!that.isFinal) {
            var cs = dojo.coords(that.node, true);
            if (rubberband) {
                rubberband.update(mouse.x - cs.x, mouse.y - cs.y);
            } else {
                rubberband = new Rubberband(
                    that, mouse.x - cs.x, mouse.y - cs.y);
            }
            var selection = new Selection(that, rubberband);
            updateSelectionHighlight(selection);
        }
    }
    
    // Called on each frame when the mouse button is up.
    function nextFrameWithMouseUp() {
        if (rubberband) {
            that.selection = new Selection(that, rubberband);
            var rotatePieces = that.selection.isRotatable;
            rubberband.remove();
            rubberband = null;
            removeSelectionHighlight();
            if (rotatePieces)
                startRotation();
        }
    }
    
    // Starts a rotation.
    function startRotation() {
        rot.inProgress = true;
        rot.frame = 0;

        // Number of frames in the rotation animation:
        rot.nFrames = rot.framesPer90 * 
            (that.selection.rotateBy180 ? 2 : 1);
    }
    
    // Called when a rotation is finished.
    function endRotation() {
        rot.inProgress = false;
        rotate(that.selection);
        redrawSelectedEndRotation();
        setIsFinal();
        if (that.isFinal) {
            grayOut();
            var statusImgNode = dojo.byId('statusImg');
            statusImgNode.src = '/images/done.gif';
            statusImgNode.alt = '';
            highlightTopPlayers();
            topPlayers.tryToInsertNew(rotations);
        }
    }
    
    // Highlights the area displaying info about top players.
    function highlightTopPlayers() {
        dojo.byId('topPlayersStatus').style.color = 'black';
        dojo.byId('topPlayers').style.color = 'black';
    }
    
    // Advances the rotation, i.e. the animation.
    function advanceRotation() {
        if (rot.frame < rot.nFrames) {
            redrawSelectedRotated();
            rot.frame++;
        } else {
            endRotation();
        }
    }
                
    // Updates/redraws the board including the rubberband:
    function nextFrame() {
        if (rot.inProgress) {
            advanceRotation();
        } else {
            if (mouse.down)
                nextFrameWithMouseDown();
            else
                nextFrameWithMouseUp();
        }
    }
    
    // Checks whether the pieces are arranged in their final
    // configuration. Stores the result in "this.isFinal".
    function setIsFinal() {
        var nPiecesFound = 0;
        for (var i in that.finalPieces) {
            var finalPiece = that.finalPieces[i];
            for (var j in that.pieces) {
                var piece = that.pieces[j];
                if (finalPiece.equals(piece)) {
                    nPiecesFound++;
                    break;
                }
            }
        }
        that.isFinal = nPiecesFound == that.finalPieces.length;
    }
    
    // "Grays" out the board, indicating that it is not
    // interactive anymore.
    function grayOut() {
        that.surface.createRect({
            x: 0, y: 0, width: that.width, height: that.height
        }).setFill([255, 255, 255, 0.4]);
    }

    // Moves the selected pieces into a group stored
    // in "rot.group".
    function groupSelected() {
        rot.group = that.surface.createGroup().moveToFront();
        for (var i in that.pieces) {
            var piece = that.pieces[i];
            if (that.selection.isPieceSelected(piece)) {
                that.drawPiece(rot.group, piece);
                piece.shape.removeShape();
            }
        }
    }
    
    // Renders the selected pieces as rotated, according
    // to the current frame in the rotation animation.
    function redrawSelectedRotated() {
        if (rot.frame == 0) {
            groupSelected();
        } else {
            var angle = 90 * rot.frame / rot.framesPer90 *
                (that.selection.rotateCW ? 1 : -1);
            rot.group.
            setTransform(dojox.gfx.matrix.rotategAt(
                angle, 
                that.selection.center.x, 
                that.selection.center.y));
        }
    }
    
    // Finishes up the rotation animation by redrawing the
    // selected pieces using information from the new
    // board layout. This function is necessary since
    // rotating the pieces using graphical transforms does
    // not always give the desired result, due to numerical
    // inaccuracies.
    function redrawSelectedEndRotation() {
        rot.group.removeShape(); // removes selected shapes
        for (var i in that.pieces) {
            var piece = that.pieces[i];
            if (that.selection.isPieceSelected(piece))
                piece.shape = that.drawPiece(that.surface, piece);
        }
    }

    function onMouseDown(e) {
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        mouse.down = true;
    }
    
    function onMouseMove(e) {
        mouse.x = e.pageX;
        mouse.y = e.pageY;
        if (mouse.down)
            dojo.stopEvent(e); // avoids ugly selection by the browser
    }
    
    function onMouseUp(e) {
        mouse.down = false;
    }
    
    function onSelectStart(e) {
        that.node.style.cursor='default';
        dojo.stopEvent(e); // disables selection
    }

    // Second step of the show process. Sets the board data
    // and renders the board. Also connects events to the
    // board.
    function show2(data, ioargs) {
        that.unitLength = data.unitLength;
        that.spacing = data.spacing;
        that.pieces = that.fromPieceDescriptions(data.pieceDescriptions);
        that.finalPieces = 
            that.fromPieceDescriptions(data.finalPieceDescriptions);
        that.create();
        createRotIndicators();
        createSelectionRect();
        
        dojo.connect(that.node, "onmousedown", onMouseDown);
        dojo.connect(that.node, "onmousemove", onMouseMove);
        dojo.connect(document.body, "onmouseup", onMouseUp);
        dojo.connect(that.node, "onselectstart", onSelectStart);

        setInterval(nextFrame, 50);
    }

    // Displays the board.
    this.show = function() {
        // First step of the show process, requests the board data
        // from the server:
        dojo.xhrGet({
            url: "/rpc/interactive_board",
            content: {
                "board_id": boardID
            },
            handleAs: "json",
            load: show2
        });
    }
}

InteractiveBoard.prototype = new Board();
InteractiveBoard.prototype.constructor = InteractiveBoard;

// Creates a preview, showing how the final piece configuration of
// the board with the ID "boardID" looks.
function PreviewBoard(boardID) {
    Board.call(this);
    var that = this;
    this.surface = null;
    this.node = document.createElement('div');
    this.spacing = 1;
    
    // Second step of the show process. Sets the board data
    // and renders the board.
    function show2(data, ioargs) {
        that.unitLength = data.unitLength;
        that.pieces = that.fromPieceDescriptions(data.pieceDescriptions);
        that.create();
    }

    // Displays the board.
    this.show = function() {
        // First step of the show process, requests the board data
        // from the server:
        dojo.xhrGet({
            url: "/rpc/preview_board",
            content: {
                "board_id": boardID
            },
            handleAs: "json",
            load: show2
        });
    }
}

PreviewBoard.prototype = new Board();
PreviewBoard.prototype.constructor = PreviewBoard;

// Creates top player record for the user named "name" who needed
// "nRotations" to complete the board.
function TopPlayer(name, nRotations) {
    this.name = name;
    this.nRotations = nRotations;
}

// Creates the table of top players for the board with the ID "boardID",
// first retrieving the data and then displaying it. Allows
// modification of the table. "size" is the number of rows in the 
// table, i.e. the number of entries to be displayed.
function TopPlayers(boardID, size) {
    var statusNode; // node of the info in the DOM tree
    var node; // node of the top players table in the DOM tree

    // in case a new entry is to be inserted, 
    // its name, position and recording of rotations:
    var newName = "";
    var newPosition;
    var newRotations;
    
    // top players entries (sorted):
    var topPlayers = [];

    // displays the top players, including - if requested 
    // - a prompt for a new entry.
    function render() {
        var html = '<table>';
        var containsForm = false;
        for (i = 0; i < topPlayers.length && i < size; i++) {
            var entry = topPlayers[i];
            var position = parseInt(i) + 1;
            html += '<tr><td class="position">' + position + '.</td><td>';
            if (entry == null) {
                html += 
                    '<form action="" ' + 
					'onsubmit="game.topPlayers.submitNew(); return false">' +
                    '<input type="text" id="nameField" size="10" ' + 
					'maxLength="16" name="name">' + 
                    '<input type="submit" name="submit" value="Go">' + 
                    '</form>';
                containsForm = true;
            } else if (entry == 'failed') {
                html += '<span class="failed">failed</span>';
            } else if (entry == 'saving') {
                html += '<span class="saving">saving...</span>';
            } else {
                html += dojox.atom.io.model.util.escapeHtml(entry.name) + 
					' (' + entry.nRotations + ')';
            }
            html += '</td></tr>';
        }
        html += '</html>';
        node.innerHTML = html;
        if (containsForm)
            window.setTimeout(function () {
                dojo.byId("nameField").focus();
            }, 1);
    }
    
    // Returns true, iff a user who just completed the board
    // using "nRotations" number of rotations is allowed into
    // the top players table. A user is allowed, if he has used no
    // more rotations than the last user in the top players table.
    // In case of an identical number of rotations, new users
    // are moved to the top.
    function isAllowed(nRotations) {
        return true;
    }
    
    // Finds the position within the top players table for 
    // a user who needed "nRotations" rotations to complete
    // the board. Stores the result in "newPosition". In case 
    // of an identical number of rotations, the topmost 
    // position is used. Iff there is no position between 1 
    // and "size", then "false" is returned.
    function setNewPosition(nRotations) {
        if (topPlayers.length == 0) {
            newPosition = 1;
            return true;
        } else {
            for (i = 0; i < topPlayers.length && i < size; i++) {
                var entry = topPlayers[i];
                if (nRotations <= entry.nRotations) {
                    newPosition = i + 1;
                    return true;
                }
            }
            if (i < size) {
                newPosition = i + 1;
                return true;
            }
            return false;
        }
    }

    // Tries to insert a new user into the top players table.
    // If the user is allowed into the table, then a prompt
    // is displayed where he may enter his name. Otherwise,
    // simply nothing happens. The recording, "rotations", 
    // of the player's moves is used to verify the validity of 
    // the request on the server side.
    this.tryToInsertNew = function(rotations) {
        if (setNewPosition(rotations.length)) {
            newRotations = rotations;

            // Creates space for the new entry:
            if (topPlayers.length == 0)
                topPlayers.push(null);
            else
                topPlayers.splice(newPosition - 1, 0, null);

            render();
        }
    }

    // Called if storing a new entry succeeded. Removes the "saving"
    // information.
    function storeNewEntrySucceeded() {
        topPlayers[newPosition - 1] = new TopPlayer(newName, 
			newRotations.length);
        render();
    }

    // Called if storing a new entry failed. Prints an error message
    // in place of the new entry.
    function storeNewEntryFailed() {
        topPlayers[newPosition - 1] = 'failed'; // indicates an error
        render();
    }
    
    // Permanently stores the newly top player entry on the server.
    function storeNewEntry() {
        dojo.xhrPost({
            url: "/rpc/insert",
            content: {
                "board_id": boardID,
                "name": newName,
                "rotations": newRotations
            },
            load: storeNewEntrySucceeded,
            error: storeNewEntryFailed
        });
    }

    // Called when the user clicks on the submit button
    // after having filled out the prompt, allowing him to
    // enter the top players table. Updates the top players table
    // on screen and on the server where it is stored.
    // If the name field is empty, then nothing else is done,
    // aside from returning focus to that field.
    this.submitNew = function() {
        newName = dojo.byId("nameField").value;
        if (newName != "") {
            topPlayers[newPosition - 1] = 'saving';
            render();
            storeNewEntry();
        } else {
            dojo.byId("nameField").focus();
        }
    }

    // Second step of the show process (see "show()").
    function show2(data, ioargs) {
        for (i in data.topPlayerDescriptions) {
            var tpd = data.topPlayerDescriptions[i];
            topPlayers.push(new TopPlayer(tpd.name, tpd.nRotations));
        }
        statusNode = dojo.byId("topPlayersStatus");
        node = dojo.byId("topPlayers");
        render();
    }
    
    // Displays the top players table for the first time:
    this.show = function() {
        dojo.xhrGet({
            url: "/rpc/top_players",
            preventCache: true,
            content: {
                "board_id": boardID,
                "size": size
            },
            handleAs: "json",
            load: show2
        });
    }
}

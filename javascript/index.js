// Functionality for displaying the index.
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

function Index() {
    var that = this;
    var boardIDs = [];
    this.boards = [];

    // Second step of the show process. Sets up the board and proceeds with the
    // display. Also places a link pointing to more information about Roto
    // Game.
    function show2(data, ioargs) {
        boardIDs = data.boardIDs;
        for (var i in boardIDs) {
            var boardID = boardIDs[i];
            that.boards.push(new IndexBoard(boardID));
        }
        setDimensionsAndCenter(data.width, data.height);
        var indexNode = dojo.byId('index');
        for (var i in that.boards) {
            var board = that.boards[i];
            indexNode.appendChild(board.node);
            board.show();
        }
    }
    
    // Sets the dimensions of the index to "width" x "height" and 
    // centers it.
    function setDimensionsAndCenter(width, height) {
        var indexNode = dojo.byId('index');
        indexNode.style.width = width + 'px';
        indexNode.style.height = height + 'px';
        indexNode.style.marginLeft = '-' + Math.round(width / 2) + 'px';
        indexNode.style.marginTop = '-' + Math.round(height / 2) + 'px';
    }

    // Shows and populates the index page.
    this.show = function() {
        // First step of the show process. Requests board IDs from the server:
        dojo.xhrGet({
            url: "/rpc/index",
            handleAs: "json",
            load: show2
        });
    }
}

// Creates a board with the board key "boardID" to be displayed in the index.
function IndexBoard(boardID) {
    Board.call(this);
    var that = this;
    this.surface = null;
    this.pieces = [];

    this.node = document.createElement('a');
    this.node.id = 'board' + boardID;
    this.node.className = 'boardLink';
    this.node.style.cursor = 'pointer'; // necessary for IE
    this.node.setAttribute('href', '/games/' + boardID);

    this.spacing = 1;
    
    // Second step of the show process. Sets the board data
    // and renders the board.
    function show2(data, ioargs) {
        // Offset of board position relative to the upper left hand corner:
        var offsetX = 20, offsetY = 20;

        that.unitLength = data.unitLength;
        that.node.style.position = 'absolute';
        that.node.style.left = (offsetX + data.x) + 'px';
        that.node.style.top = (offsetY + data.y) + 'px';
        that.pieces = that.fromPieceDescriptions(data.pieceDescriptions);
        that.create();
    }

    // Displays the board.
    this.show = function() {
        // First step of the show process, requests the board data
        // from the server:
        dojo.xhrGet({
            url: "/rpc/index_board",
            content: {
                "board_id": boardID
            },
            handleAs: "json",
            load: show2
        });
    }
}

IndexBoard.prototype = new Board();
IndexBoard.prototype.constructor = IndexBoard;
# -*- coding: utf-8 -*-

# Copyright 2009, 2011 Felix E. Klee <felix.klee@inka.de>
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy of
# the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.

import logging
import os
from google.appengine.ext.webapp import template
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext import zipserve
from django.utils import simplejson

# Whether debugging should be turned on (also affects JavaScript code):
debug = False

# Returns the spacing for the pieces in the interactive display
# of the board "board".
def interactive_spacing(board):
    # only integer calculations are used, for predictable results
    x = board.interactive_unit_length / 2
    y = board.interactive_unit_length / 20
    if x < 10 * y + 5:
        return y
    else:
        return y + 1

# Dumps the data "data" as JSON response, with the correct MIME type.
# "obj" is the object from which the response is generated.
def dumpJson(obj, data):
    obj.response.headers['Content-Type'] = 'application/json; charset=utf-8';
    obj.response.out.write(simplejson.dumps(data))
        
# For testing the validity of a sequence of moves, to complete
# a board.
class TestBoard():
    def __init__(self, board):
        query = Piece.all()
        query.filter('board = ', board)
        query.filter('is_final = ', False)
        self.pieces = []
        for piece in query:
            self.pieces.append(piece)
        query = Piece.all()
        query.filter('board = ', board)
        query.filter('is_final = ', True)
        self.final_pieces = []
        for piece in query:
            self.final_pieces.append(piece)
    
    # Returns true, iff the piece "piece" is selected. A piece is selected if 
    # there is an overlap between the piece and the area described by the
    # x1_p, y1_p, x2_p, y2_p.
    def isSelected(self, piece, x1_p, y1_p, x2_p, y2_p):
        piece_x1_p = piece.x_p
        piece_y1_p = piece.y_p
        piece_x2_p = piece.x_p + piece.width_p - 1
        piece_y2_p = piece.y_p + piece.height_p - 1
        tmp = ((x1_p <= piece_x1_p and x2_p >= piece_x1_p) or \
            (x1_p > piece_x1_p and x1_p <= piece_x2_p)) and \
            ((y1_p <= piece_y1_p and y2_p >= piece_y1_p) or \
            (y1_p > piece_y1_p and y1_p <= piece_y2_p))
        return tmp
    
    # Returns true, iff the pieces "pieces" form a filled rectangle
    # whose size is width_p x height_p.
    def areRotatable(self, pieces, width_p, height_p):
        occupiedFields = 0
        for piece in pieces:
            occupiedFields += piece.width_p * piece.height_p
        return occupiedFields == width_p * height_p
        
    # Returns true, iff a rectangle with dimensions width_p x height_p
    # needs to be rotated by 180° (instead of 90°), in order for the
    # rotation to be congruent.
    def angleIs180(self, width_p, height_p):
        return width_p != height_p

    # Rotates the pieces "pieces" by 180° around their center.
    # Before the rotation, the pieces are circumscribed by the
    # rectangle described by "x_p", "y_p", "width_p", "height_p".
    def rotate180(self, pieces, x_p, y_p, width_p, height_p):
        for piece in pieces:
            piece.x_p = width_p - (piece.x_p + piece.width_p - x_p) + x_p
            piece.y_p = height_p - (piece.y_p + piece.height_p - y_p) + y_p

    # Rotates the pieces "pieces" by 90° clock wise around their center.
    # Before the rotation, the pieces are circumscribed by the
    # rectangle described by "x_p", "y_p", "width_p", "height_p".
    def rotate90CW(self, pieces, x_p, y_p, width_p, height_p):
        for piece in pieces:
            tmp = piece.y_p
            piece.y_p = (piece.x_p - x_p) + y_p;
            piece.x_p = height_p - (tmp - y_p) + x_p - piece.height_p
            tmp = piece.width_p
            piece.width_p = piece.height_p
            piece.height_p = tmp
    
    # Rotates the pieces "pieces" by 90° counter clock wise around their 
    # center. Before the rotation, the pieces are circumscribed by the
    # rectangle described by "x_p", "y_p", "width_p", "height_p".
    def rotate90CCW(self, pieces, x_p, y_p, width_p, height_p):
        for piece in pieces:
            tmp = piece.x_p
            piece.x_p = (piece.y_p- y_p) + x_p;
            piece.y_p = width_p - (tmp - x_p) + y_p - piece.width_p
            tmp = piece.width_p
            piece.width_p = piece.height_p
            piece.height_p = tmp

    # Rotates the pieces "pieces" by the smallest possible angle
    # (either 90° or 180°) clock wise ("rotate_cw" = true) or 
    # counter clock wise. The rectangle circumscribing the pieces
    # is described by "x_p", "y_p", "width_p", "height_p".
    def rotate(self, pieces, rotate_cw, x_p, y_p, width_p, height_p):
        if self.angleIs180(width_p, height_p):
            self.rotate180(pieces, x_p, y_p, width_p, height_p)
        else:
            if rotate_cw:
                self.rotate90CW(pieces, x_p, y_p, width_p, height_p)
            else:
                self.rotate90CCW(pieces, x_p, y_p, width_p, height_p)

    # Returns the pieces selected by the rubberband described by
    # x_p, y_p, width_p, height_p.
    def selectedPieces(self, x_p, y_p, width_p, height_p):
        x1_p = x_p
        y1_p = y_p
        x2_p = x_p + width_p - 1
        y2_p = y_p + height_p - 1
        selected_pieces = []
        for piece in self.pieces:
            if self.isSelected(piece, x1_p, y1_p, x2_p, y2_p):
                selected_pieces.append(piece)
        return selected_pieces

    # Returns true, iff the pieces "piece1" and "piece2"
    # have the same position and dimensions.
    def areEqualPieces(self, piece1, piece2):
        return \
            piece1.x_p == piece2.x_p and \
            piece1.y_p == piece2.y_p and \
            piece1.width_p == piece2.width_p and \
            piece1.height_p == piece2.height_p

    # Returns true, iff the pieces are arranged in their final configuration.
    def isFinal(self):
        n_pieces_found = 0
        for final_piece in self.final_pieces:
            for piece in self.pieces:
                if self.areEqualPieces(final_piece, piece):
                    n_pieces_found += 1
                    break
        return n_pieces_found == len(self.final_pieces)

    # Returns true, iff the sequence of rotations "rotations" transforms
    # the pieces into the final pieces.
    def validateRotations(self, rotations):
        try:
            for rotation in rotations:
                tmp = rotation.split(',')
                if tmp[0] == 'true':
                    rotate_cw = True
                else:
                    rotate_cw = False
                x_p = int(tmp[1])
                y_p = int(tmp[2])
                width_p = int(tmp[3])
                height_p = int(tmp[4])
                selected_pieces = self.selectedPieces(x_p, y_p, width_p, height_p)
                if self.areRotatable(selected_pieces, width_p, height_p):
                    self.rotate(selected_pieces, rotate_cw, x_p, y_p, 
                        width_p, height_p)
                else:
                    return False
            return self.isFinal()
        except:
            return False

class Board(db.Model):
    index_x = db.IntegerProperty()
    index_y = db.IntegerProperty()
    index_unit_length = db.IntegerProperty()
    preview_unit_length = db.IntegerProperty()
    interactive_unit_length = db.IntegerProperty()
    interactive_spacing_divisor = db.IntegerProperty()
    show = db.BooleanProperty(default = False)

class Piece(db.Model):
    board = db.ReferenceProperty(Board)
    x_p = db.IntegerProperty()
    y_p = db.IntegerProperty()
    width_p = db.IntegerProperty()
    height_p = db.IntegerProperty()
    is_final = db.BooleanProperty(default = False)

class TopPlayer(db.Model):
    board = db.ReferenceProperty(Board)
    name = db.StringProperty(multiline=False)
    n_rotations = db.IntegerProperty()
    date_time = db.DateTimeProperty(auto_now_add=True)

class Index(webapp.RequestHandler):
    def get(self):
        if debug:
            is_debug = 'true'
        else:
            is_debug = 'false'
        template_values = {'is_debug': is_debug}

        # Adds the IE7 compatibility header. Using the corresponding meta tag
        # doesn't work reliable, at least with IE8 8.0.6001.18702 on 
        # Win XP Pro 32, connected via T-Mobile Germany UMTS.
        self.response.headers.add_header('X-UA-Compatible', 'IE=EmulateIE7');

        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(template.render(path, template_values))

# Serves a page displaying a game. If the game ID is incorrect, then
# it redirects to the home page.
class Game(webapp.RequestHandler):
    def get(self, board_id):
        try:
            board_id = int(board_id)
        except:
            self.redirect('/')
            return
        board = Board.get_by_id(board_id)
        if board == None:
            self.redirect('/')
        if debug:
            is_debug = 'true'
        else:
            is_debug = 'false'
        template_values = {
            'is_debug': is_debug,
            'board_id': board_id}

        # See corresponding comment in "Index.get()".
        self.response.headers.add_header('X-UA-Compatible', 'IE=EmulateIE7');

        path = os.path.join(os.path.dirname(__file__), 'game.html')
        self.response.out.write(template.render(path, template_values))

# Data for displaying the list of top players.
class RPCTopPlayers(webapp.RequestHandler):
    def get(self):
        board_id = int(self.request.get('board_id'))
        board = Board.get_by_id(board_id)
        size = int(self.request.get('size', default_value = 0))
        query = TopPlayer.all().order('n_rotations').order('-date_time')
        query.filter('board = ', board)
        top_players = query.fetch(size)
        top_player_descriptions = []
        for top_player in top_players:
            top_player_descriptions.append({
                'name': top_player.name,
                'nRotations': top_player.n_rotations})
        data = {
            'topPlayerDescriptions': top_player_descriptions}
        dumpJson(self, data)

# Data for displaying the index giving an overview over all boards.
class RPCIndex(webapp.RequestHandler):
    def get(self):
        query = Board.all()
        board_ids = []
        for board in query:
            board_ids.append(board.key().id())
        data = {
            'width': 340,
            'height': 240,
            'boardIDs': board_ids}
        dumpJson(self, data)

# Data for displaying the game.
class RPCGame(webapp.RequestHandler):
    def get(self):
        board_id = int(self.request.get('board_id'))
        board = Board.get_by_id(board_id)
        i_spacing = interactive_spacing(board)
        preview_padding_top = i_spacing - 1
        status_img_margin_bottom = i_spacing
        data = {
            'previewPaddingTop': preview_padding_top,
            'statusImgMarginBottom': status_img_margin_bottom}
        dumpJson(self, data)

# Data for displaying a board in the index.
class RPCIndexBoard(webapp.RequestHandler):
    def get(self):
        board_id = int(self.request.get('board_id'))
        board = Board.get_by_id(board_id)
        query = Piece.all()
        query.filter('board = ', board)
        query.filter('is_final = ', True)
        piece_descriptions = []
        for piece in query:
            piece_descriptions.append({
                'xP': piece.x_p, 
                'yP': piece.y_p, 
                'widthP': piece.width_p, 
                'heightP': piece.height_p})
        data = {
            'x': board.index_x,
            'y': board.index_y,
            'x': board.index_x,
            'y': board.index_y,
            'unitLength': board.index_unit_length,
            'pieceDescriptions': piece_descriptions}
        dumpJson(self, data)

# Data for displaying a board in the preview.
class RPCPreviewBoard(webapp.RequestHandler):
    def get(self):
        board_id = int(self.request.get('board_id'))
        board = Board.get_by_id(board_id)
        query = Piece.all()
        query.filter('board = ', board)
        query.filter('is_final = ', True)
        piece_descriptions = []
        for piece in query:
            piece_descriptions.append({
                'xP': piece.x_p, 
                'yP': piece.y_p, 
                'widthP': piece.width_p, 
                'heightP': piece.height_p})
        data = {
            'unitLength': board.preview_unit_length,
            'pieceDescriptions': piece_descriptions}
        dumpJson(self, data)

# Data for displaying a board for interaction.
class RPCInteractiveBoard(webapp.RequestHandler):
    def get(self):
        board_id = int(self.request.get('board_id'))
        board = Board.get_by_id(board_id)
        spacing = interactive_spacing(board)
        query = Piece.all()
        query.filter('board = ', board)
        query.filter('is_final = ', False)
        piece_descriptions = []
        for piece in query:
            piece_descriptions.append({
                'xP': piece.x_p, 
                'yP': piece.y_p, 
                'widthP': piece.width_p, 
                'heightP': piece.height_p})
        query = Piece.all()
        query.filter('board = ', board)
        query.filter('is_final = ', True)
        final_piece_descriptions = []
        for piece in query:
            final_piece_descriptions.append({
                'xP': piece.x_p, 
                'yP': piece.y_p, 
                'widthP': piece.width_p, 
                'heightP': piece.height_p})
        data = {
            'unitLength': board.interactive_unit_length,
            'spacing': spacing,
            'pieceDescriptions': piece_descriptions,
            'finalPieceDescriptions': final_piece_descriptions}
        dumpJson(self, data)

# Inserts a new top player.
class RPCInsert(webapp.RequestHandler):
    def post(self):
        board_id = int(self.request.get('board_id'))
        board = Board.get_by_id(board_id)
        rotations = self.request.get('rotations', allow_multiple=True)
        testBoard = TestBoard(board)
        if testBoard.validateRotations(rotations):
            top_player = TopPlayer()
            top_player.board = board
            top_player.name = self.request.get('name')
            top_player.n_rotations = len(rotations)
            top_player.put()
        else:
            self.error(400) # Invalid rotations

# Updates the database. Use with caution.
class AdminUpdate(webapp.RequestHandler):
    def get(self):
        if not debug:
            print 'Only available in debug mode.'
            return
        
        # deletes all entries:
        queries = [Piece.all(), Board.all(), TopPlayer.all()]
        for query in queries:
            for result in query:
                result.delete()
    
        # creates board (4x4):
        board = Board()
        board.index_x = 236; board.index_y = 12
        board.index_unit_length = 8
        board.preview_unit_length = 8
        board.interactive_unit_length = 80
        board.interactive_spacing_divisor = 20;
        board.show = True; board.put()
        ads = [
            [0, 0, 2, 2], [2, 0, 1, 1], [3, 0, 1, 1], 
            [2, 1, 2, 2], [0, 2, 1, 2], [1, 2, 1, 1],
            [1, 3, 2, 1], [3, 3, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 2, 2], [2, 0, 1, 2], [3, 0, 1, 1],
            [3, 1, 1, 1], [0, 2, 2, 2], [2, 2, 1, 2],
            [3, 2, 1, 1], [3, 3, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()
        ads = [
            ["Sam", 5], ["Liz", 6], ["Hugh", 6], 
            ["Bobby", 12], ["Jane", 35]]
        for ad in ads:
            a = TopPlayer()
            a.name = ad[0]; a.n_rotations = ad[1]
            a.board = board
            a.put()

        # creates board (4x4):
        board = Board()
        board.index_x = 46; board.index_y = 12
        board.index_spacing = 1; board.index_unit_length = 7
        board.preview_spacing = 1; board.preview_unit_length = 7
        board.interactive_spacing = 4; board.interactive_unit_length = 70
        board.show = True; board.put()
        ads = [
            [0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 2, 2],
            [0, 1, 1, 1], [1, 1, 1, 1], [0, 2, 2, 1],
            [2, 2, 2, 1], [0, 3, 2, 1], [2, 3, 2, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 1, 1], [1, 0, 2, 1], [3, 0, 1, 1],
            [0, 1, 1, 2], [1, 1, 2, 2], [3, 1, 1, 2],
            [0, 3, 1, 1], [1, 3, 2, 1], [3, 3, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()
        ads = [
            ["Zach", 7], ["Lisa", 11]]
        for ad in ads:
            a = TopPlayer()
            a.name = ad[0]; a.n_rotations = ad[1]
            a.board = board
            a.put()

        # creates board (3x4):
        board = Board()
        board.index_x = 275; board.index_y = 80
        board.index_spacing = 1; board.index_unit_length = 7
        board.preview_spacing = 1; board.preview_unit_length = 7
        board.interactive_spacing = 3; board.interactive_unit_length = 70
        board.show = True; board.put()
        ads = [
            [0, 0, 1, 2], [0, 2, 1, 2], [1, 0, 1, 2],
            [1, 2, 1, 2], [2, 0, 1, 1], [2, 1, 1, 1],
            [2, 2, 1, 2]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 1, 1], [0, 1, 1, 2], [0, 3, 2, 1],
            [1, 0, 2, 1], [1, 1, 1, 2], [2, 1, 1, 2],
            [2, 3, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()

        # creates board (4x5):
        board = Board()
        board.index_x = 41; board.index_y = 141
        board.index_spacing = 1; board.index_unit_length = 7
        board.preview_spacing = 1; board.preview_unit_length = 7
        board.interactive_spacing = 3; board.interactive_unit_length = 70
        board.show = True; board.put()
        ads = [
            [0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1], [3, 0, 1, 1], 
            [0, 1, 1, 2], [1, 1, 1, 1], [2, 1, 1, 1], [3, 1, 1, 2], 
            [1, 2, 2, 1],
            [0, 3, 1, 2], [1, 3, 1, 2], [2, 3, 1, 2], [3, 3, 1, 2]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 1, 1], [1, 0, 2, 1], [3, 0, 1, 1], 
            [0, 1, 2, 1], [2, 1, 2, 1], 
            [0, 2, 1, 1], [1, 2, 2, 1], [3, 2, 1, 1], 
            [0, 3, 2, 1], [2, 3, 2, 1],
            [0, 4, 1, 1], [1, 4, 2, 1], [3, 4, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()

        # creates board (8x4):
        board = Board()
        board.index_x = 124; board.index_y = 0
        board.index_spacing = 1; board.index_unit_length = 7
        board.preview_spacing = 1; board.preview_unit_length = 7
        board.interactive_spacing = 3; board.interactive_unit_length = 70
        board.show = True; board.put()
        ads = [
            [0, 0, 1, 2], [1, 0, 1, 2], [2, 0, 1, 2], [3, 0, 1, 2], 
            [4, 0, 1, 2], [5, 0, 1, 2], [6, 0, 1, 1], [7, 0, 1, 1],
            [6, 1, 1, 1], [7, 1, 1, 1],
            [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 2, 2], 
            [6, 2, 1, 1], [7, 2, 1, 1],
            [6, 3, 2, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 2, 2], [2, 0, 1, 1], [3, 0, 2, 1], [5, 0, 1, 1], [6, 0, 2, 2],
            [2, 1, 2, 1], [4, 1, 2, 1],
            [0, 2, 1, 1], [1, 2, 2, 1], [3, 2, 2, 2], [5, 2, 2, 1], [7, 2, 1, 1],
            [0, 3, 2, 1], [2, 3, 1, 1], [5, 3, 1, 1], [6, 3, 2, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()

        # creates board (5x5):
        board = Board()
        board.index_x = 0; board.index_y = 70
        board.index_spacing = 1; board.index_unit_length = 6
        board.preview_spacing = 1; board.preview_unit_length = 7
        board.interactive_spacing = 3; board.interactive_unit_length = 60
        board.show = True; board.put()
        ads = [
            [0, 0, 2, 2], [2, 0, 2, 2], [4, 0, 1, 2],
            [0, 2, 2, 2], [2, 2, 2, 2], [4, 2, 1, 2],
            [0, 4, 2, 1], [2, 4, 2, 1], [4, 4, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 2, 2], [2, 0, 1, 2], [3, 0, 2, 2],
            [0, 2, 2, 1], [2, 2, 1, 1], [3, 2, 2, 1],
            [0, 3, 2, 2], [2, 3, 1, 2], [3, 3, 2, 2]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()

        # creates board (9x7):
        board = Board()
        board.index_x = 84; board.index_y = 69
        board.index_spacing = 1; board.index_unit_length = 5
        board.preview_spacing = 1; board.preview_unit_length = 5
        board.interactive_spacing = 2; board.interactive_unit_length = 50
        board.show = True; board.put()
        ads = [
            [0, 0, 2, 1], [2, 0, 1, 1], [3, 0, 1, 2], [4, 0, 2, 1], [6, 0, 1, 1], [7, 0, 1, 2], [8, 0, 1, 1],
            [0, 1, 1, 2], [1, 1, 2, 1], [4, 1, 1, 2], [5, 1, 2, 1], [8, 1, 1, 2],
            [1, 2, 1, 2], [2, 2, 2, 1], [5, 2, 1, 2], [6, 2, 2, 1],
            [0, 3, 1, 1], [2, 3, 1, 2], [3, 3, 2, 1], [6, 3, 1, 2], [7, 3, 2, 1],
            [0, 4, 2, 1], [3, 4, 1, 2], [4, 4, 2, 1], [7, 4, 1, 2], [8, 4, 1, 1],
            [0, 5, 1, 2], [1, 5, 2, 1], [4, 5, 1, 2], [5, 5, 2, 1], [8, 5, 1, 2],
            [1, 6, 1, 1], [2, 6, 2, 1], [5, 6, 1, 1], [6, 6, 2, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 2, 1], [2, 0, 2, 1], [4, 0, 1, 1], [5, 0, 2, 1], [7, 0, 2, 1],
            [0, 1, 2, 1], [2, 1, 2, 1], [4, 1, 1, 1], [5, 1, 2, 1], [7, 1, 2, 1],
            [0, 2, 2, 1], [2, 2, 2, 1], [4, 2, 1, 1], [5, 2, 2, 1], [7, 2, 2, 1],
            [0, 3, 2, 1], [2, 3, 2, 1], [4, 3, 1, 1], [5, 3, 2, 1], [7, 3, 2, 1],
            [0, 4, 2, 1], [2, 4, 2, 1], [4, 4, 1, 1], [5, 4, 2, 1], [7, 4, 2, 1],
            [0, 5, 2, 1], [2, 5, 2, 1], [4, 5, 1, 1], [5, 5, 2, 1], [7, 5, 2, 1],
            [0, 6, 2, 1], [2, 6, 2, 1], [4, 6, 1, 1], [5, 6, 2, 1], [7, 6, 2, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()

        # creates board (10x9):
        board = Board()
        board.index_x = 122; board.index_y = 153
        board.index_spacing = 1; board.index_unit_length = 4
        board.preview_spacing = 1; board.preview_unit_length = 5
        board.interactive_spacing = 2; board.interactive_unit_length = 50
        board.show = True; board.put()
        ads = [
            [0, 0, 2, 2], [2, 0, 2, 1], [4, 0, 1, 1], [5, 0, 2, 2], [7, 0, 2, 1], [9, 0, 1, 1],
            [2, 1, 1, 1], [3, 1, 2, 2], [7, 1, 1, 1], [8, 1, 2, 2],
            [0, 2, 1, 1], [1, 2, 2, 2], [5, 2, 1, 1], [6, 2, 2, 2],
            [0, 3, 1, 2], [3, 3, 1, 1], [4, 3, 2, 2], [8, 3, 1, 1], [9, 3, 1, 2],
            [1, 4, 1, 1], [2, 4, 2, 2], [6, 4, 1, 1], [7, 4, 2, 2],
            [0, 5, 2, 2], [4, 5, 1, 1], [5, 5, 2, 2], [9, 5, 1, 1],
            [2, 6, 1, 1], [3, 6, 2, 2], [7, 6, 1, 1], [8, 6, 2, 2],
            [0, 7, 1, 1], [1, 7, 2, 2], [5, 7, 1, 1], [6, 7, 2, 2],
            [0, 8, 1, 1], [3, 8, 1, 1], [4, 8, 2, 1], [8, 8, 1, 1], [9, 8, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1], [3, 0, 1, 1], [4, 0, 1, 1], [5, 0, 1, 1], [6, 0, 1, 1], [7, 0, 1, 1], [8, 0, 1, 1], [9, 0, 1, 1], 
            [0, 1, 1, 1], [1, 1, 1, 1], [2, 1, 1, 1], [3, 1, 1, 1], [4, 1, 1, 1], [5, 1, 1, 1], [6, 1, 1, 1], [7, 1, 1, 1], [8, 1, 1, 1], [9, 1, 1, 1], 
            [0, 2, 2, 1], [2, 2, 2, 1], [4, 2, 2, 1], [6, 2, 2, 1], [8, 2, 2, 1], 
            [0, 3, 2, 2], [2, 3, 2, 2], [4, 3, 2, 2], [6, 3, 2, 2], [8, 3, 2, 2], 
            [0, 5, 2, 2], [2, 5, 2, 2], [4, 5, 2, 2], [6, 5, 2, 2], [8, 5, 2, 2], 
            [0, 7, 2, 2], [2, 7, 2, 2], [4, 7, 2, 2], [6, 7, 2, 2], [8, 7, 2, 2]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()

        # creates board (6x6):
        board = Board()
        board.index_x = 180; board.index_y = 75
        board.index_spacing = 1; board.index_unit_length = 6
        board.preview_spacing = 1; board.preview_unit_length = 6
        board.interactive_spacing = 3; board.interactive_unit_length = 60
        board.show = True; board.put()
        ads = [
            [0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1], [3, 0, 2, 1], [5, 0, 1, 1],
            [0, 1, 1, 1], [1, 1, 1, 1], [2, 1, 2, 1], [4, 1, 1, 1], [5, 1, 1, 2],
            [0, 2, 1, 1], [1, 2, 2, 1], [3, 2, 1, 1], [4, 2, 1, 2],
            [0, 3, 2, 1], [2, 3, 1, 1], [3, 3, 1, 2], [5, 3, 1, 1],
            [0, 4, 2, 2], [2, 4, 1, 2], [4, 4, 1, 1], [5, 4, 1, 1],
            [3, 5, 1, 1], [4, 5, 1, 1], [5, 5, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 2], [3, 0, 1, 2], [4, 0, 1, 1], [5, 0, 1, 1],
            [0, 1, 1, 1], [1, 1, 1, 1], [4, 1, 1, 1], [5, 1, 1, 1],
            [0, 2, 2, 1], [2, 2, 2, 2], [4, 2, 2, 1],
            [0, 3, 2, 1], [4, 3, 2, 1],
            [0, 4, 1, 1], [1, 4, 1, 1], [2, 4, 1, 2], [3, 4, 1, 2], [4, 4, 1, 1], [5, 4, 1, 1],
            [0, 5, 1, 1], [1, 5, 1, 1], [4, 5, 1, 1], [5, 5, 1, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()

        # creates board (5x5):
        board = Board()
        board.index_x = 225; board.index_y = 146
        board.index_spacing = 1; board.index_unit_length = 7
        board.preview_spacing = 1; board.preview_unit_length = 7
        board.interactive_spacing = 3; board.interactive_unit_length = 70
        board.show = True; board.put()
        ads = [
            [0, 0, 1, 2], [1, 0, 1, 2], [2, 0, 1, 2], [3, 0, 2, 1], 
            [3, 1, 2, 1],
            [0, 2, 2, 1], [2, 2, 1, 1], [3, 2, 2, 1],
            [0, 3, 2, 1], [2, 3, 1, 2], [3, 3, 1, 2], [4, 3, 1, 2],
            [0, 4, 2, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board
            a.put()
        ads = [
            [0, 0, 1, 2], [1, 0, 2, 1], [3, 0, 2, 1],
            [1, 1, 1, 2], [2, 1, 2, 1], [4, 1, 1, 2],
            [0, 2, 1, 2], [2, 2, 1, 1], [3, 2, 1, 2],
            [1, 3, 2, 1], [4, 3, 1, 2],
            [0, 4, 2, 1], [2, 4, 2, 1]]
        for ad in ads:
            a = Piece()
            a.x_p = ad[0]; a.y_p = ad[1]
            a.width_p = ad[2]; a.height_p = ad[3]
            a.board = board; a.is_final = True
            a.put()

        print 'Done.'

# Runs code for testing / trying things out.
class AdminTest(webapp.RequestHandler):
    def get(self):
        print 'Content-Type: text/plain'
        print ''

        # ID of the following board (final config):
        # 4421
        # 4421
        # 4421
        # 4421
        #board_id = 11403
        board_id = 4001
        
        # should be true:
        testBoard = TestBoard(Board.get_by_id(board_id))
        print testBoard.validateRotations([
            'true,2,0,2,3', 'true,1,2,3,2', 'true,0,2,2,2', 'false,0,0,4,4'])

        # should be false:
        testBoard = TestBoard(Board.get_by_id(board_id))
        print testBoard.validateRotations([
            'true,2,0,2,3', 'true,1,2,3,2', 'false,0,0,4,4'])

        # should be false:
        testBoard = TestBoard(Board.get_by_id(board_id))
        print testBoard.validateRotations([])

        # should be false:
        testBoard = TestBoard(Board.get_by_id(board_id))
        print testBoard.validateRotations([
            'true,2'])

application = webapp.WSGIApplication([
    ('/', Index), ('/games', Index), (r'/games/([^/]*)', Game), 
    ('/admin/update', AdminUpdate),
    ('/admin/test', AdminTest),
    ('/rpc/index', RPCIndex), 
    ('/rpc/game', RPCGame), 
    ('/rpc/index_board', RPCIndexBoard), 
    ('/rpc/preview_board', RPCPreviewBoard), 
    ('/rpc/interactive_board', RPCInteractiveBoard), 
    ('/rpc/top_players', RPCTopPlayers), 
    ('/rpc/insert', RPCInsert)],
    debug = debug)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()

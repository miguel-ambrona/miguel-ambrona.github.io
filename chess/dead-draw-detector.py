#!/usr/bin/env python3

import chess
import sys

from copy import deepcopy

MUST_WIN = 1
MUST_LOSE = 2

DRAW = 0
SUCCESS = 1
FAILURE = 2
UNKNOWN = 3

DRAWN = 0
BLACK = 1
WHITE = 2

VISITED_POSITIONS = {}

def negate_goal(goal):
    if goal == MUST_WIN:  return MUST_LOSE
    else:                 return MUST_WIN


def sfen(board):
    return ' '.join(board.fen().split(' ')[:4])


def visited(board):
    global VISITED_POSITIONS
    fen = sfen(board)

    try:
        n = VISITED_POSITIONS[fen]
        return n

    except:
        VISITED_POSITIONS[fen] = board.fullmove_number
        return 0

def square_distance(sq1, sq2):
    rank_distance = chess.square_rank(sq1) - chess.square_rank(sq2)
    file_distance = chess.square_file(sq1) - chess.square_file(sq2)

    return rank_distance**2 + file_distance**2

def is_pawn(board, square):
    piece = board.piece_at(square)
    return piece and piece.piece_type == chess.PAWN

def just_the_king(board, turn):
    for p in chess.PIECE_TYPES:
        if p != chess.KING and board.pieces(p, turn) != 0:
            return False
    return True

def move_weight(board, move, goal):
    score = 0
    if goal == MUST_WIN:

        if board.is_capture(move):
            score += 500

        board2 = deepcopy(board)
        board2.push(move)

        must_be_captured = len([m for m in board2.legal_moves if m.to_square != move.to_square]) == 0
        can_be_captured  = len([m for m in board2.legal_moves if m.to_square == move.to_square]) > 0

        if board2.is_checkmate():
            return 10**4

        if can_be_captured:
            score -= 300

        if must_be_captured:
            score -= 1000

        rank_from = chess.square_rank(move.from_square)
        rank_to   = chess.square_rank(move.to_square)

        if str(board.piece_at(move.from_square)).lower() == 'p':
            if rank_from > rank_to:
                score += rank_to
            else:
                score += 200*(8 - rank_to + 1)

        opp_king = board.king(not board.turn)
        distance_before = square_distance(opp_king, move.from_square)
        distance_after  = square_distance(opp_king, move.to_square)

        score += (distance_before - distance_after)

    if goal == MUST_LOSE:
        if board.is_capture(move):
            score -= 1000

        pawn_squares = [(chess.square_rank(s), chess.square_file(s)) for s in chess.SQUARES \
                        if is_pawn(board,s) and board.piece_at(s).color == board.turn]

        if len(pawn_squares) > 0:
            if board.turn:
                (prank, pfile) = max(pawn_squares)
            else:
                (prank, pfile) = min(pawn_squares)

            score -= abs(chess.square_file(move.to_square) - pfile)

        last_rank = 8 if board.turn else 1
        if is_pawn(board, move.from_square) and chess.square_rank(move.to_square) == last_rank:
            score -= 500

    return score


def print_variation(variation, turn):
    link = '...' if not turn else ' '
    cnt = 1
    output = '  '
    for san_move in variation:
        if turn:
            output += str(cnt) + '.' + san_move
            cnt += 1
        else:
            output += link + san_move + ' '
            link = ' '
        turn = not turn

    if len(variation) > 0:
        print(output)


def search(board, goal, variation):

    global VISITED_POSITIONS

    if board.is_game_over():
        if not board.is_checkmate():
            return DRAW, []

        elif goal == MUST_LOSE:
            return SUCCESS, variation

        elif goal == MUST_WIN:
            return FAILURE, []


    # The following two lines are a quite interesting optimization, but they risk
    # the identification of a position with victory as the single possible outcome
    # In case there is a player with only the king and all lines lose for them.
    # This is an example: k7/P7/KP6/PP6/8/8/8/8 w - - 0 1.
    if just_the_king(board, not board.turn) and goal == MUST_LOSE:
        return DRAW, []

    def weight(move):
        return move_weight(board, move, goal)

    failure = True

    for move in sorted(board.legal_moves, key = weight, reverse = True):

        board2 = deepcopy(board)
        board2.push(move)

        movenumber = visited(board2)
        if movenumber:
            if movenumber > board2.fullmove_number:
                failure = False
            continue

        san_move = board.san(move)
        result, solution = search(board2, negate_goal(goal), deepcopy(variation)+[san_move])

        if result == DRAW:
            failure = False
            continue

        elif result == FAILURE:
            continue

        elif result == SUCCESS:
            return SUCCESS, solution

    output = FAILURE if failure else DRAW
    return output, []


def analyze(fen):

    global VISITED_POSITIONS
    board = chess.Board(fen)

    VISITED_POSITIONS = {}
    result_lose, solution_lose = search(board, MUST_LOSE, [])

    if result_lose == FAILURE:
        if board.turn:  return 4 | WHITE, [], []
        else:           return 4 | BLACK, [], []

    VISITED_POSITIONS = {}
    result_win, solution_win = search(board, MUST_WIN, [])

    if result_lose == DRAWN and result_win == DRAWN:
        return DRAWN, [], []

    if result_win == FAILURE:
        if board.turn:  return 4 | BLACK, [], []
        else:           return 4 | WHITE, [], []

    output = 0
    if result_lose == SUCCESS:
        if board.turn:  output |= BLACK
        else:           output |= WHITE

    if result_win == SUCCESS:
        if board.turn:  output |= WHITE
        else:           output |= BLACK

    if board.turn:
        white_wins = solution_win
        black_wins = solution_lose
    else:
        white_wins = solution_lose
        black_wins = solution_win

    return output, white_wins, black_wins


def process_fen(fen, options):
    human_readable = 'h' in options
    show_solutions = 's' in options

    output, white_wins, black_wins = analyze(fen)

    if human_readable:
        if output & 2:
            print (' White can win')
            if show_solutions:
                print_variation(white_wins, True)

        if output & 1:
            print (' Black can win')
            if show_solutions:
                print_variation(black_wins, False)

        if output & 4:   print (' (It is the only possible outcome)')
        if output == 0:  print (' Dead draw')
        print()

    else:
        print (output)

def main():

    options = ''.join([opt for opt in sys.argv if opt[0] == '-'])

    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        puzzles = [
            'Bb2kb2/bKp1p1p1/1pP1P1P1/pP6/6P1/P7/8/8 b - - 0 1', \
            'Bb2kb2/bKp1p1p1/1pP1P1P1/1P6/p5P1/P7/8/8 b - - 0 1', \
            'K1k5/P1Pp4/1p1P4/8/p7/P2P4/8/8 w - - 0 1', \
            '8/8/5pk1/p6p/P1p2p1P/2P2P2/4K3/8 w - - 7 44', \
            '7k/1p1p4/pP1Pp3/P1n1P2p/p3p2P/Pp1pP3/1P1P4/7K b - - 0 1', \
            '1N5B/p5K1/P2p4/2pPk1p1/2P1p1P1/b3P1P1/2P5/8 b - - 0 1',\
            '8/8/2k2N2/8/1K6/8/4N3/8 w - - 0 1',\
            '5b1k/4p1p1/4P1P1/8/8/4p1p1/2B1P1P1/5B1K w - - 0 1',\
            '6k1/5pPp/5P1P/1p6/8/3p4/1P1P4/qKB5 w - - 0 1',\
            '7R/7k/5K2/8/8/8/1B6/8 b - - 0 1',\
        ]

        for fen in puzzles:
            print(fen)
            process_fen(fen, options)

    else:
        while True:
            fen = input()
            process_fen(fen, options)


if __name__ == '__main__':
    main()

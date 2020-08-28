#!/usr/bin/env python3

import chess
import sys

from copy import deepcopy

MUST_WIN = 1
MUST_LOSE = 2

DEAD_DRAW = 1
LOSS_IS_POSSIBLE = 2
VICTORY_IS_UNAVOIDABLE = 3
UNKNOWN = 4

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
        p = VISITED_POSITIONS[fen]
        return True

    except:
        VISITED_POSITIONS[fen] = 1
        return False


def move_weight(board, move, goal):
    return 1


def search(board, goal, variation):

    global VISITED_POSITIONS

    if board.is_game_over():
        if not board.is_checkmate():
            return DEAD_DRAW

        elif goal == MUST_LOSE:
            for san_move in variation[:-1]:
                print (san_move, end = ", ")
            print (variation[-1])

            return LOSS_IS_POSSIBLE

        elif goal == MUST_WIN:
            return VICTORY_IS_UNAVOIDABLE

    def weight(move):
        return move_weight(board, move, goal)

    unavoidable_victory = True

    for move in sorted(board.legal_moves, key = weight, reverse = True):

        board2 = deepcopy(board)
        board2.push(move)

        if visited(board2):
            unavoidable_victory = False
            continue

        san_move = board.san(move)
        result = search(board2, negate_goal(goal), deepcopy(variation)+[san_move])

        if result == DEAD_DRAW:  # Keep looking
            unavoidable_victory = False
            continue

        elif result == LOSS_IS_POSSIBLE:  # We stop since the position can be helpmated
            return LOSS_IS_POSSIBLE

        elif result == VICTORY_IS_UNAVOIDABLE:  # We have to keep looking
            continue

    if unavoidable_victory:
        return VICTORY_IS_UNAVOIDABLE

    else:
        return DEAD_DRAW


def is_dead_draw(board):

    global VISITED_POSITIONS
    VISITED_POSITIONS = {}

    try:
        result = search(board, MUST_LOSE, [])

        if result == DEAD_DRAW:
            print ("Dead draw")

        elif result == LOSS_IS_POSSIBLE:
            print ("Loss is possible")

        elif result == VICTORY_IS_UNAVOIDABLE:
            print ("Victory is unavoidable")

        else:
            print ("Unknown", result)

    except:
        print ("Unknown")


def main():

    while True:
        fen = input()
        board = chess.Board(fen)
        is_dead_draw(board)


if __name__ == '__main__':
    main()

# Loss is possible         Bb2kb2/bKp1p1p1/1pP1P1P1/pP6/6P1/P7/8/8 b - - 0 1
# Dead draw                Bb2kb2/bKp1p1p1/1pP1P1P1/1P6/p5P1/P7/8/8 b - - 0 1
# Winning is unavoidable   K1k5/P1Pp4/1p1P4/8/p7/P2P4/8/8 w - - 0 1 (https://en.wikipedia.org/wiki/Joke_chess_problem)
# Dead draw                8/8/5pk1/p6p/P1p2p1P/2P2P2/4K3/8 w - - 7 44

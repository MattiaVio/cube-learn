import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern, KPatternData, KPuzzle } from 'cubing/kpuzzle';
import {
    CORNER_MAPPING,
    EDGE_MAPPING,
    FACE_ORDER,
    REID_CENTER_ORDER,
    REID_CORNER_ORDER,
    REID_EDGE_ORDER,
    REID_TO_FACELETS_MAP,
} from './constants.ts';

let KPUZZLE_333: KPuzzle;
cube3x3x3.kpuzzle().then((v) => (KPUZZLE_333 = v));

interface PieceInfo {
    piece: number;
    orientation: number;
}

const PIECE_MAP: { [s: string]: PieceInfo } = {};

REID_EDGE_ORDER.forEach((edge, idx) => {
    for (let i = 0; i < 2; i++) {
        PIECE_MAP[rotateLeft(edge, i)] = { piece: idx, orientation: i };
    }
});

REID_CORNER_ORDER.forEach((corner, idx) => {
    for (let i = 0; i < 3; i++) {
        PIECE_MAP[rotateLeft(corner, i)] = { piece: idx, orientation: i };
    }
});

function rotateLeft(s: string, i: number): string {
    return s.slice(i) + s.slice(0, i);
}

function toReid333Struct(pattern: KPattern): string[][] {
    const output: string[][] = [[], []];
    for (let i = 0; i < 6; i++) {
        if (pattern.patternData['CENTERS'].pieces[i] !== i) {
            throw new Error('non-oriented puzzles are not supported');
        }
    }
    for (let i = 0; i < 12; i++) {
        output[0].push(
            rotateLeft(
                REID_EDGE_ORDER[pattern.patternData['EDGES'].pieces[i]],
                pattern.patternData['EDGES'].orientation[i]
            )
        );
    }
    for (let i = 0; i < 8; i++) {
        output[1].push(
            rotateLeft(
                REID_CORNER_ORDER[pattern.patternData['CORNERS'].pieces[i]],
                pattern.patternData['CORNERS'].orientation[i]
            )
        );
    }
    output.push(REID_CENTER_ORDER);
    return output;
}

/**
 * Convert cubing.js KPattern object to the facelets string in the Kociemba notation
 * @param pattern Source KPattern object
 * @returns String representing cube faceletsin the Kociemba notation
 */
function patternToFacelets(pattern: KPattern): string {
    const reid = toReid333Struct(pattern);
    return REID_TO_FACELETS_MAP.map(([orbit, perm, ori]) => reid[orbit][perm][ori]).join('');
}

/**
 * Convert facelets string in the Kociemba notation to the cubing.js KPattern object
 * @param facelets Source string with facelets in the Kociemba notation
 * @returns KPattern object representing cube state
 */
function faceletsToPattern(facelets: string): KPattern {
    const stickers: number[] = [];
    facelets.match(/.{9}/g)?.forEach((face) => {
        face.split('')
            .reverse()
            .forEach((s, i) => {
                if (i != 4) stickers.push(FACE_ORDER.indexOf(s));
            });
    });

    const patternData: KPatternData = {
        CORNERS: {
            pieces: [],
            orientation: [],
        },
        EDGES: {
            pieces: [],
            orientation: [],
        },
        CENTERS: {
            pieces: [0, 1, 2, 3, 4, 5],
            orientation: [0, 0, 0, 0, 0, 0],
            orientationMod: [1, 1, 1, 1, 1, 1],
        },
    };

    for (const cm of CORNER_MAPPING) {
        const pi: PieceInfo = PIECE_MAP[cm.map((i) => FACE_ORDER[stickers[i]]).join('')];
        patternData.CORNERS.pieces.push(pi.piece);
        patternData.CORNERS.orientation.push(pi.orientation);
    }

    for (const em of EDGE_MAPPING) {
        const pi: PieceInfo = PIECE_MAP[em.map((i) => FACE_ORDER[stickers[i]]).join('')];
        patternData.EDGES.pieces.push(pi.piece);
        patternData.EDGES.orientation.push(pi.orientation);
    }

    return new KPattern(KPUZZLE_333, patternData);
}

export { patternToFacelets, faceletsToPattern };

// Helper to format timer value
export function formatTimerValue(timestamp: number) {
    const minutes = Math.floor(timestamp / 60000);
    const seconds = Math.floor((timestamp % 60000) / 1000)
        .toString()
        .padStart(2, '0');
    const milliseconds = Math.floor(timestamp % 1000)
        .toString()
        .padStart(3, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
}

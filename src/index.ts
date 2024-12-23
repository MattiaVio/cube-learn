import './style.css';

import $ from 'jquery';
import { Subscription, interval } from 'rxjs';
import { TwistyPlayer } from 'cubing/twisty';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';

import * as THREE from 'three';

import {
    now,
    connectGanCube,
    GanCubeConnection,
    GanCubeEvent,
    GanCubeMove,
    MacAddressProvider,
    makeTimeFromTimestamp,
    cubeTimestampCalcSkew,
    cubeTimestampLinearFit,
} from 'gan-web-bluetooth';

import { faceletsToPattern, patternToFacelets } from './utils';

const SOLVED_STATE = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

const twistyPlayer = new TwistyPlayer({
    puzzle: '3x3x3',
    visualization: 'PG3D',
    alg: '',
    experimentalSetupAnchor: 'start',
    background: 'none',
    controlPanel: 'none',
    hintFacelets: 'none',
    experimentalDragInput: 'none',
    cameraLatitude: 0,
    cameraLongitude: 0,
    cameraLatitudeLimit: 0,
    tempoScale: 5,
});

$('#cube').append(twistyPlayer);

let conn: GanCubeConnection | null;
let lastMoves: GanCubeMove[] = [];
let solutionMoves: GanCubeMove[] = [];

let twistyScene: THREE.Scene;
let twistyVantage: any;

const HOME_ORIENTATION = new THREE.Quaternion().setFromEuler(
    new THREE.Euler((15 * Math.PI) / 180, (-20 * Math.PI) / 180, 0)
);
const cubeQuaternion: THREE.Quaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler((30 * Math.PI) / 180, (-30 * Math.PI) / 180, 0)
);

async function amimateCubeOrientation() {
    if (!twistyScene || !twistyVantage) {
        const vantageList = await twistyPlayer.experimentalCurrentVantages();
        twistyVantage = [...vantageList][0];
        twistyScene = await twistyVantage.scene.scene();
    }
    twistyScene.quaternion.slerp(cubeQuaternion, 0.25);
    twistyVantage.render();
    requestAnimationFrame(amimateCubeOrientation);
}
requestAnimationFrame(amimateCubeOrientation);

let basis: THREE.Quaternion | null;

async function handleGyroEvent(event: GanCubeEvent) {
    if (event.type == 'GYRO') {
        const { x: qx, y: qy, z: qz, w: qw } = event.quaternion;
        const quat = new THREE.Quaternion(qx, qz, -qy, qw).normalize();
        if (!basis) {
            basis = quat.clone().conjugate();
        }
        cubeQuaternion.copy(quat.premultiply(basis).premultiply(HOME_ORIENTATION));
        $('#quaternion').val(`x: ${qx.toFixed(3)}, y: ${qy.toFixed(3)}, z: ${qz.toFixed(3)}, w: ${qw.toFixed(3)}`);
        if (event.velocity) {
            const { x: vx, y: vy, z: vz } = event.velocity;
            $('#velocity').val(`x: ${vx}, y: ${vy}, z: ${vz}`);
        }
    }
}

async function handleMoveEvent(event: GanCubeEvent) {
    if (event.type == 'MOVE') {
        if (timerState == 'READY') {
            setTimerState('RUNNING');
        }
        twistyPlayer.experimentalAddMove(event.move, { cancel: false });
        lastMoves.push(event);
        if (timerState == 'RUNNING') {
            solutionMoves.push(event);
        }
        if (lastMoves.length > 256) {
            lastMoves = lastMoves.slice(-256);
        }
        if (lastMoves.length > 10) {
            const skew = cubeTimestampCalcSkew(lastMoves);
            $('#skew').val(skew + '%');
        }
    }
}

let cubeStateInitialized = false;

async function handleFaceletsEvent(event: GanCubeEvent) {
    if (event.type == 'FACELETS' && !cubeStateInitialized) {
        if (event.facelets != SOLVED_STATE) {
            const kpattern = faceletsToPattern(event.facelets);
            const solution = await experimentalSolve3x3x3IgnoringCenters(kpattern);
            const scramble = solution.invert();
            twistyPlayer.alg = scramble;
        } else {
            twistyPlayer.alg = '';
        }
        cubeStateInitialized = true;
        console.log('Initial cube state is applied successfully', event.facelets);
    }
}

const handleCubeEvent = (event: GanCubeEvent) => {
    if (event.type != 'GYRO') console.log('GanCubeEvent', event);
    if (event.type == 'GYRO') {
        handleGyroEvent(event);
    } else if (event.type == 'MOVE') {
        handleMoveEvent(event);
    } else if (event.type == 'FACELETS') {
        handleFaceletsEvent(event);
    } else if (event.type == 'HARDWARE') {
        $('#hardwareName').val(event.hardwareName || '- n/a -');
        $('#hardwareVersion').val(event.hardwareVersion || '- n/a -');
        $('#softwareVersion').val(event.softwareVersion || '- n/a -');
        $('#productDate').val(event.productDate || '- n/a -');
        $('#gyroSupported').val(event.gyroSupported ? 'YES' : 'NO');
    } else if (event.type == 'BATTERY') {
        $('#batteryLevel').val(event.batteryLevel + '%');
    } else if (event.type == 'DISCONNECT') {
        twistyPlayer.alg = '';
        $('.info input').val('- n/a -');
        $('#connect').html('Connect');
    }
};

const customMacAddressProvider: MacAddressProvider = async (device, isFallbackCall): Promise<string | null> => {
    if (isFallbackCall) {
        return prompt('Unable do determine cube MAC address!\nPlease enter MAC address manually:');
    } else {
        return typeof device.watchAdvertisements == 'function'
            ? null
            : prompt(
                  'Seems like your browser does not support Web Bluetooth watchAdvertisements() API. Enable following flag in Chrome:\n\nchrome://flags/#enable-experimental-web-platform-features\n\nor enter cube MAC address manually:'
              );
    }
};

$('#reset-state').on('click', async () => {
    await conn?.sendCubeCommand({ type: 'REQUEST_RESET' });
    twistyPlayer.alg = '';
});

$('#reset-gyro').on('click', async () => {
    basis = null;
});

$('#connect').on('click', async () => {
    if (conn) {
        conn.disconnect();
        conn = null;
    } else {
        conn = await connectGanCube(customMacAddressProvider);
        conn.events$.subscribe(handleCubeEvent);
        await conn.sendCubeCommand({ type: 'REQUEST_HARDWARE' });
        await conn.sendCubeCommand({ type: 'REQUEST_FACELETS' });
        await conn.sendCubeCommand({ type: 'REQUEST_BATTERY' });
        $('#deviceName').val(conn.deviceName);
        $('#deviceMAC').val(conn.deviceMAC);
        $('#connect').html('Disconnect');
    }
});

let timerState: 'IDLE' | 'READY' | 'RUNNING' | 'STOPPED' = 'IDLE';

const setTimerState = (state: typeof timerState) => {
    timerState = state;
    switch (state) {
        case 'IDLE':
            stopLocalTimer();
            $('#timer').hide();
            break;
        case 'READY':
            setTimerValue(0);
            $('#timer').show();
            $('#timer').css('color', '#0f0');
            break;
        case 'RUNNING':
            solutionMoves = [];
            startLocalTimer();
            $('#timer').css('color', '#999');
            break;
        case 'STOPPED':
            stopLocalTimer();
            $('#timer').css('color', '#fff');
            var fittedMoves = cubeTimestampLinearFit(solutionMoves);
            var lastMove = fittedMoves.slice(-1).pop();
            setTimerValue(lastMove ? lastMove.cubeTimestamp! : 0);
            break;
    }
};

twistyPlayer.experimentalModel.currentPattern.addFreshListener(async (kpattern) => {
    const facelets = patternToFacelets(kpattern);
    if (facelets == SOLVED_STATE) {
        if (timerState == 'RUNNING') {
            setTimerState('STOPPED');
        }
        twistyPlayer.alg = '';
    }
});

const setTimerValue = (timestamp: number) => {
    const t = makeTimeFromTimestamp(timestamp);
    $('#timer').html(
        `${t.minutes}:${t.seconds.toString(10).padStart(2, '0')}.${t.milliseconds.toString(10).padStart(3, '0')}`
    );
};

let localTimer: Subscription | null = null;
const startLocalTimer = () => {
    const startTime = now();
    localTimer = interval(30).subscribe(() => {
        setTimerValue(now() - startTime);
    });
};

const stopLocalTimer = () => {
    localTimer?.unsubscribe();
    localTimer = null;
};

const activateTimer = () => {
    if (timerState == 'IDLE' && conn) {
        setTimerState('READY');
    } else {
        setTimerState('IDLE');
    }
};

$(document).on('keydown', (event) => {
    if (event.which == 32) {
        event.preventDefault();
        activateTimer();
    }
});

$('#cube').on('touchstart', () => {
    activateTimer();
});

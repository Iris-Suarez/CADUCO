(function () {
    'use strict';

    var catalogo = {
        pasos:             { archivo: 'pasos.mp3',                 volumen: 0.36, duracion: 445 },
        puertaAbrir:       { archivo: 'puerta_abrir.mp3',          volumen: 0.27, duracion: 1800 },
        puertaCerrar:      { archivo: 'puerta_cerrar.mp3',         volumen: 0.48, duracion: 575 },
        interruptorTecho:  { archivo: 'interruptor_techo.mp3',     volumen: 0.43, duracion: 1334 },
        silla:             { archivo: 'mover_silla.mp3',           volumen: 0.51, duracion: 2712 },
        interruptorMesa:   { archivo: 'interruptor_lampara.mp3',   volumen: 0.48, duracion: 1543 },
        interaccionAbrir:  { archivo: 'interaccion_abrir.mp3',     volumen: 0.78, duracion: 480 },
        interaccionCerrar: { archivo: 'interaccion_cerrar.mp3',    volumen: 0.58, duracion: 889 },
        mama01:            { archivo: 'mama_01.mp3',              volumen: 0.95, duracion: 2154 },
        mama02:            { archivo: 'mama_02.mp3',              volumen: 0.95, duracion: 2454 },
        mama03:            { archivo: 'mama_03.mp3',              volumen: 0.95, duracion: 3193 }
    };

    var ContextoAudio = window.AudioContext || window.webkitAudioContext;
    var contexto = null;
    var master = null;
    var buffers = Object.create(null);
    var cargas = Object.create(null);
    var activado = false;
    var indiceUltimaVoz = -1;

    function crearContexto() {
        if (!ContextoAudio) return null;
        if (!contexto) {
            contexto = new ContextoAudio();
            master = contexto.createGain();
            master.gain.value = 0.86;
            master.connect(contexto.destination);
        }
        return contexto;
    }

    function cargar(nombre) {
        if (!catalogo[nombre]) return Promise.resolve(null);
        if (buffers[nombre]) return Promise.resolve(buffers[nombre]);
        if (cargas[nombre]) return cargas[nombre];
        var ctx = crearContexto();
        if (!ctx) return Promise.resolve(null);
        cargas[nombre] = fetch('assets/sonidos/' + catalogo[nombre].archivo)
            .then(function (respuesta) {
                if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
                return respuesta.arrayBuffer();
            })
            .then(function (datos) { return ctx.decodeAudioData(datos); })
            .then(function (buffer) {
                buffers[nombre] = buffer;
                catalogo[nombre].duracion = Math.round(buffer.duration * 1000);
                return buffer;
            })
            .catch(function (error) {
                console.warn('CADUCO: no se pudo cargar el audio ' + nombre + ':', error);
                return null;
            });
        return cargas[nombre];
    }

    function precargar() {
        if (!crearContexto()) return;
        Object.keys(catalogo).forEach(cargar);
    }

    function activar() {
        var ctx = crearContexto();
        if (!ctx) return;
        if (ctx.state === 'running') {
            activado = true;
            return;
        }
        ctx.resume().then(function () { activado = ctx.state === 'running'; })
            .catch(function () { activado = false; });
    }

    function reproducirBuffer(nombre, buffer) {
        if (!buffer || !contexto || contexto.state !== 'running') return false;
        var efecto = contexto.createBufferSource();
        var volumen = contexto.createGain();
        efecto.buffer = buffer;
        volumen.gain.value = catalogo[nombre].volumen;
        efecto.connect(volumen);
        volumen.connect(master);
        efecto.onended = function () {
            try { efecto.disconnect(); volumen.disconnect(); } catch (error) {}
        };
        efecto.start(0);
        return true;
    }

    function reproducir(nombre) {
        if (!catalogo[nombre]) return false;
        if (!contexto || contexto.state !== 'running') {
            return false;
        }
        if (buffers[nombre]) return reproducirBuffer(nombre, buffers[nombre]);
        cargar(nombre);
        return false;
    }

    function duracion(nombre) {
        return catalogo[nombre] ? catalogo[nombre].duracion : 0;
    }

    function vozAleatoria() {
        var opciones = ['mama01', 'mama02', 'mama03'];
        var i = Math.floor(Math.random() * opciones.length);
        if (i === indiceUltimaVoz) i = (i + 1 + Math.floor(Math.random() * 2)) % opciones.length;
        indiceUltimaVoz = i;
        return opciones[i];
    }

    window.CADUCOSonidos = {
        reproducir: reproducir,
        duracion: duracion,
        vozAleatoria: vozAleatoria,
        activar: activar,
        estaActivo: function () { return !!(contexto && contexto.state === 'running'); }
    };

    document.addEventListener('DOMContentLoaded', precargar);
    document.addEventListener('pointerdown', activar, { passive: true });
    document.addEventListener('keydown', activar);
})();

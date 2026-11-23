AFRAME.registerComponent('interruptor-luz-caduco', {
    init: function () {
        var componente = this;
        this.encendida = true;
        this.temporizadores = [];
        this.alClic = function (event) {
            if (event.stopPropagation) event.stopPropagation();
            componente.alternar();
        };
        this.iniciarControl = function () {
            componente.tecla = componente.el.querySelector('#tecla-interruptor');
            componente.area = componente.el.querySelector('#area-interruptor');
            componente.esferaIzq = document.getElementById('bombilla-izquierda');
            componente.esferaDer = document.getElementById('bombilla-derecha');
            componente.ambiente = document.getElementById('luz-ambiente');
            componente.direccional = document.getElementById('luz-direccional');
            componente.ventana = document.getElementById('luz-ventana');
            componente.focoIzq = document.getElementById('luz-foco-izquierdo');
            componente.focoDer = document.getElementById('luz-foco-derecho');
            if (componente.area) componente.area.addEventListener('click', componente.alClic);
            if (componente.tecla) componente.tecla.addEventListener('click', componente.alClic);
            componente.aplicar(true, false);
        };
        this.escena = this.el.sceneEl;
        if (this.escena && !this.escena.hasLoaded) {
            this.escena.addEventListener('loaded', this.iniciarControl, { once: true });
        } else {
            this.iniciarControl();
        }
    },

    fijarLuz: function (entidad, intensidad) {
        if (entidad) entidad.setAttribute('light', 'intensity', intensidad);
    },

    bombilla: function (entidad, prendida) {
        if (!entidad) return;
        entidad.setAttribute('material', 'emissive', prendida ? '#FFF1B9' : '#000000');
        entidad.setAttribute('material', 'color', prendida ? '#FFF4D7' : '#B4B6B5');
    },

    limpiar: function () {
        this.temporizadores.forEach(function (id) { window.clearTimeout(id); });
        this.temporizadores = [];
    },

    fijarEstado: function (prendida, potencia) {
        var f = prendida ? (potencia === undefined ? 1 : potencia) : 0;
        this.fijarLuz(this.ambiente, prendida ? 0.63 : 0);
        this.fijarLuz(this.direccional, prendida ? 0.23 : 0);
        this.fijarLuz(this.ventana, prendida ? 0.22 : 0.27);
        this.fijarLuz(this.focoIzq, 1.35 * f);
        this.fijarLuz(this.focoDer, 1.08 * f);
        this.bombilla(this.esferaIzq, f > 0.12);
        this.bombilla(this.esferaDer, f > 0.12);
        if (this.tecla) this.tecla.setAttribute('position', prendida ? '-0.012 0.018 0' : '-0.012 -0.018 0');
        document.body.setAttribute('data-luz-habitacion', prendida ? 'on' : 'off');
    },

    aplicar: function (prendida, titileo) {
        var componente = this;
        this.limpiar();
        if (!titileo || !prendida) {
            this.fijarEstado(prendida);
            return;
        }
        [0.08, 0, 0.48, 0.13, 1].forEach(function (potencia, i) {
            var id = window.setTimeout(function () { componente.fijarEstado(true, potencia); }, i * 100);
            componente.temporizadores.push(id);
        });
    },

    alternar: function () {
        if (window.CADUCOSonidos) window.CADUCOSonidos.reproducir('interruptorTecho');
        this.encendida = !this.encendida;
        this.aplicar(this.encendida, true);
        this.el.sceneEl.emit('energia-habitacion', { encendida: this.encendida }, false);
    },

    remove: function () {
        this.limpiar();
        if (this.escena) this.escena.removeEventListener('loaded', this.iniciarControl);
        if (this.area) this.area.removeEventListener('click', this.alClic);
        if (this.tecla) this.tecla.removeEventListener('click', this.alClic);
    }
});

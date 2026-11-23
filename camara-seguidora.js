AFRAME.registerComponent('camara-seguidora', {
    init: function () {
        this.jugador = document.getElementById('camara-principal');
        this.cabezal = null;
        this.modelo = null;
        this.posicionJugador = new THREE.Vector3();

        this.preparar = this.preparar.bind(this);

        this.el.addEventListener('model-loaded', this.preparar);

        if (this.el.getObject3D('mesh')) {
            this.preparar();
        }
    },

    preparar: function () {
        if (this.cabezal) return;

        var modelo = this.el.getObject3D('mesh');
        if (!modelo) return;

        // Piezas que forman el cabezal de la cámara.
        var nombres = ['Object_8', 'Object_10', 'Object_12', 'Object_14'];

        var piezas = nombres.map(function (nombre) {
            return modelo.getObjectByName(nombre);
        });

        if (piezas.some(function (pieza) { return !pieza; })) {
            console.warn('No se encontraron las piezas del cabezal.');
            return;
        }

        var cabezal = new THREE.Group();
        cabezal.name = 'CabezalMovilCamara';
        cabezal.position.set(3.22, -1.22, 0);
        cabezal.rotation.order = 'YZX';

        modelo.add(cabezal);
        modelo.updateMatrixWorld(true);

        piezas.forEach(function (pieza) {
            cabezal.attach(pieza);
        });

        this.modelo = modelo;
        this.cabezal = cabezal;

        // LED roja fija en el cabezal móvil.
        var led = new THREE.Mesh(
            new THREE.SphereGeometry(0.24, 16, 12),
            new THREE.MeshBasicMaterial({
                color: 0xFF2020,
                toneMapped: false
            })
        );

        led.position.set(-2.82, 2.12, 0.80);

        cabezal.add(led);
        this.led = led;

        var resplandor = new THREE.Mesh(
            new THREE.SphereGeometry(0.42, 16, 12),
            new THREE.MeshBasicMaterial({
                color: 0xFF3030,
                transparent: true,
                opacity: 0.22,
                depthWrite: false,
                toneMapped: false
            })
        );

        led.add(resplandor);
        this.resplandorLed = resplandor;
    },

    tick: function (tiempo, delta) {
        if (!this.cabezal || !this.jugador) return;

        if (this.led) {
            var encendida = (tiempo % 1600) < 1100;

            this.led.visible = encendida;
        }

        this.jugador.object3D.getWorldPosition(this.posicionJugador);

        this.modelo.updateMatrixWorld(true);

        var objetivo = this.modelo.worldToLocal(
            this.posicionJugador.clone()
        );

        var diferencia = objetivo.sub(this.cabezal.position);

        var yaw = Math.atan2(diferencia.z, -diferencia.x);

        var pitch = -Math.atan2(
            diferencia.y,
            Math.hypot(diferencia.x, diferencia.z)
        );

        // Limitar el giro para que sea natural.
        yaw = THREE.MathUtils.clamp(
            yaw,
            -Math.PI / 4,
            Math.PI / 4
        );

        pitch = THREE.MathUtils.clamp(
            pitch,
            -Math.PI / 10,
            Math.PI / 10
        );

        // Suavizar el seguimiento.
        var factor = 1 - Math.exp(
            -2.4 * Math.min(delta || 0, 60) / 1000
        );

        this.cabezal.rotation.y +=
            (yaw - this.cabezal.rotation.y) * factor;

        this.cabezal.rotation.z +=
            (pitch - this.cabezal.rotation.z) * factor;
    },

    remove: function () {
        this.el.removeEventListener('model-loaded', this.preparar);
        this.el.removeEventListener('click', this.alClic);
    }
});

AFRAME.registerComponent('mensaje-camara-seguridad', {
    init: function () {
        this.alClic = function (evento) {
            evento.stopPropagation();

            if (window.CADUCOUI) {
                window.CADUCOUI.mensaje(
                    'La cámara me sigue a todas partes... Mamá siempre me está vigilando.'
                );
            }
        };

        this.el.addEventListener('click', this.alClic);
    },

    remove: function () {
        this.el.removeEventListener('click', this.alClic);
    }
});

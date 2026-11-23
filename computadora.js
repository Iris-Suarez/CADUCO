AFRAME.registerComponent('pantalla-interactiva', {
    init: function () {
        var componente = this;
        this.modelo = document.getElementById('modelo-computadora-retro');
        this.estado = 'apagada';
        this.fotograma = 0;
        this.temporizador = null;
        this.intervalo = null;
        this.cristales = [];
        this.texturas = [];
        this.luzPc = document.getElementById('luz-computadora');

        this.onModeloCargado = function () {
            componente.prepararCristal();
        };
        this.onClick = function () {
            componente.cambiarEstado();
        };

        this.modelo.addEventListener('model-loaded', this.onModeloCargado);
        this.el.addEventListener('click', this.onClick);
        if (this.modelo.getObject3D('mesh')) {
            this.prepararCristal();
        }
    },

    prepararCristal: function () {
        var raiz = this.modelo.getObject3D('mesh');
        if (!raiz || this.cristales.length) return;

        raiz.updateMatrixWorld(true);
        var mallas = [];
        raiz.traverse(function (objeto) {
            if (!objeto.isMesh) return;
            var materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
            if (materiales.some(function (material) {
                return material && material.name === 'Monitor_Glass';
            })) mallas.push(objeto);
        });
        if (!mallas.length) {
            console.warn('CADUCO: no se encontró el cristal Monitor_Glass de la computadora.');
            return;
        }

        var inversaRaiz = raiz.matrixWorld.clone().invert();
        var vertices = [];
        var minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
        mallas.forEach(function (malla) {
            var transformacion = inversaRaiz.clone().multiply(malla.matrixWorld);
            var posiciones = malla.geometry.attributes.position;
            var puntos = [];
            for (var i = 0; i < posiciones.count; i++) {
                var p = new THREE.Vector3().fromBufferAttribute(posiciones, i).applyMatrix4(transformacion);
                puntos.push(p);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
                minZ = Math.min(minZ, p.z);
                maxZ = Math.max(maxZ, p.z);
            }
            vertices.push(puntos);
        });

        var ancho = maxZ - minZ, alto = maxY - minY;
        if (ancho <= 0 || alto <= 0) return;

        mallas.forEach(function (malla, j) {
            var geometria = malla.geometry.clone();
            var uv = geometria.attributes.uv;
            if (!uv) {
                uv = new THREE.BufferAttribute(new Float32Array(vertices[j].length * 2), 2);
                geometria.setAttribute('uv', uv);
            }
            vertices[j].forEach(function (p, i) {
                uv.setXY(i, (maxZ - p.z) / ancho, (p.y - minY) / alto);
            });
            uv.needsUpdate = true;
            malla.geometry = geometria;
        });

        this.texturas = [];
        this.luzPc = document.getElementById('luz-computadora');
        for (var i = 0; i <= 8; i++) {
            var imagen = document.getElementById('pantalla-pc-' + i);
            if (!imagen) {
                console.error('CADUCO: falta la imagen pantalla_' + i + '.png');
                return;
            }
            var textura = new THREE.Texture(imagen);
            textura.flipY = true;
            if (THREE.SRGBColorSpace) textura.colorSpace = THREE.SRGBColorSpace;
            textura.minFilter = THREE.LinearFilter;
            textura.magFilter = THREE.LinearFilter;
            textura.generateMipmaps = false;
            textura.needsUpdate = true;
            this.texturas.push(textura);
        }

        var componente = this;
        mallas.forEach(function (malla) {
            malla.material = new THREE.MeshBasicMaterial({
                color: '#FFFFFF', map: componente.texturas[0],
                side: THREE.DoubleSide, toneMapped: false
            });
        });
        this.cristales = mallas;
        this.mostrar(0);
    },

    mostrar: function (numero) {
        this.fotograma = numero;
        if (!this.cristales.length || !this.texturas[numero]) return;
        var textura = this.texturas[numero];
        this.cristales.forEach(function (malla) {
            malla.material.map = textura;
            malla.material.needsUpdate = true;
        });
        if (this.luzPc) {
            var intensidad = 0;
            
            if (numero === 1) {
                intensidad = 0.45;
                this.luzPc.setAttribute('light', 'color', '#A7BDE9');
            } else if (numero >= 2 && numero <= 6) {
                intensidad = 0.32;
                this.luzPc.setAttribute('light', 'color', '#91DDAA');
            } else if (numero >= 7) {
                intensidad = 0.47;
                this.luzPc.setAttribute('light', 'color', '#66D88A');
            }
            this.luzPc.setAttribute('light', 'intensity', intensidad);
        }
    },

    detener: function () {
        if (this.temporizador !== null) window.clearTimeout(this.temporizador);
        if (this.intervalo !== null) window.clearInterval(this.intervalo);
        this.temporizador = null;
        this.intervalo = null;
    },

    cambiarEstado: function () {
        var componente = this;
        this.detener();
        if (this.estado === 'apagada' || this.estado === 'apagando') {
            this.estado = 'encendiendo';
            this.mostrar(1);
            var paso = 1;
            function siguiente() {
                if (componente.estado !== 'encendiendo') return;
                paso++;
                componente.mostrar(paso);
                if (paso < 8) {
                    componente.temporizador = window.setTimeout(siguiente, 340);
                } else {
                    componente.estado = 'encendida';
                    componente.intervalo = window.setInterval(function () {
                        componente.mostrar(componente.fotograma === 7 ? 8 : 7);
                    }, 520);
                }
            }
            this.temporizador = window.setTimeout(siguiente, 900);
        } else {
            this.estado = 'apagando';
            this.mostrar(1);
            this.temporizador = window.setTimeout(function () {
                componente.mostrar(0);
                if (componente.luzPc) componente.luzPc.setAttribute('light', 'intensity', 0);
                componente.estado = 'apagada';
                componente.temporizador = null;
            }, 550);
        }
    },

    remove: function () {
        this.detener();
        this.el.removeEventListener('click', this.onClick);
        this.modelo.removeEventListener('model-loaded', this.onModeloCargado);
        this.cristales.forEach(function (malla) {
            malla.material.dispose();
        });
        this.texturas.forEach(function (textura) { textura.dispose(); });
        this.cristales = [];
    }
});

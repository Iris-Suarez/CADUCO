
AFRAME.registerComponent('textiles-cama', {
    init: function () {
        var grupo = new THREE.Group();

        // COLCHÓN CON BORDES REDONDEADOS
        var anchoColchon = 1.35;
        var altoColchon = 0.16;
        var largoColchon = 1.95;
        var radio = 0.065;

        var geometriaColchon = new THREE.BoxGeometry(
            anchoColchon, altoColchon, largoColchon, 12, 4, 18
        );

        var puntosColchon = geometriaColchon.attributes.position;
        var interior = new THREE.Vector3();
        var diferencia = new THREE.Vector3();
        var vertice = new THREE.Vector3();

        var limite = new THREE.Vector3(
            anchoColchon / 2 - radio,
            altoColchon / 2 - radio,
            largoColchon / 2 - radio
        );

        for (var i = 0; i < puntosColchon.count; i++) {
            vertice.fromBufferAttribute(puntosColchon, i);

            interior.set(
                THREE.MathUtils.clamp(vertice.x, -limite.x, limite.x),
                THREE.MathUtils.clamp(vertice.y, -limite.y, limite.y),
                THREE.MathUtils.clamp(vertice.z, -limite.z, limite.z)
            );

            diferencia.subVectors(vertice, interior)
                .normalize()
                .multiplyScalar(radio);

            vertice.copy(interior).add(diferencia);

            puntosColchon.setXYZ(
                i, vertice.x, vertice.y, vertice.z
            );
        }

        geometriaColchon.computeVertexNormals();

        var colchon = new THREE.Mesh(
            geometriaColchon,
            new THREE.MeshStandardMaterial({
                color: 0xB5BDC7,
                roughness: 1
            })
        );

        colchon.position.y = 0.48;
        grupo.add(colchon);

        // MATERIAL DE LA MANTA
        var materialManta = new THREE.MeshStandardMaterial({
            color: 0x596D83,
            roughness: 1,
            metalness: 0,
            side: THREE.DoubleSide
        });

        var imagen = document.getElementById('textura-manta');

        if (imagen) {
            var textura = new THREE.Texture(imagen);

            textura.wrapS = THREE.RepeatWrapping;
            textura.wrapT = THREE.RepeatWrapping;
            textura.repeat.set(1.5, 1.5);

            if (THREE.SRGBColorSpace) {
                textura.colorSpace = THREE.SRGBColorSpace;
            }

            var activarTextura = function () {
                if (!imagen.naturalWidth) return;

                textura.needsUpdate = true;
                materialManta.map = textura;
                materialManta.color.setHex(0xFFFFFF);
                materialManta.needsUpdate = true;
            };

            if (imagen.complete) {
                activarTextura();
            } else {
                imagen.addEventListener('load', activarTextura, {
                    once: true
                });
            }
        }

        // MANTA AMPLIA CON CAÍDA EN LOS COSTADOS
        
        // MANTA CON BORDES CURVOS Y CAÍDA DE TELA
        var geometriaManta = new THREE.PlaneGeometry(
            2.20, 2.00, 80, 80
        );

        geometriaManta.rotateX(-Math.PI / 2);

        var puntosManta = geometriaManta.attributes.position;

        // Construye una curva redondeada que después
        // continúa hacia abajo, como tela colgante.
        function perfilCaida(distancia, radio) {
            if (distancia <= 0) {
                return { afuera: 0, baja: 0 };
            }

            var largoCurva = Math.PI * radio / 2;

            if (distancia < largoCurva) {
                var angulo = distancia / radio;

                return {
                    afuera: radio * Math.sin(angulo),
                    baja: radio * (1 - Math.cos(angulo))
                };
            }

            return {
                afuera: radio,
                baja: radio + (distancia - largoCurva)
            };
        }

        for (var j = 0; j < puntosManta.count; j++) {
            var u = puntosManta.getX(j);
            var v = puntosManta.getZ(j) + 0.42;

            // Curvatura en ambos costados de la cama.
            var lateral = perfilCaida(
                Math.abs(u) - 0.64, 0.10
            );

            // Curvatura en el pie de la cama.
            var frontal = perfilCaida(
                v - 0.93, 0.10
            );

            // La tela se curva hacia afuera en los costados.
            var x = Math.abs(u) > 0.64
                ? Math.sign(u) * (0.64 + lateral.afuera)
                : u;

            // En el pie se curva hacia adelante
            // y luego baja verticalmente.
            var z = v > 0.93
                ? 0.93 + frontal.afuera
                : v;

            // Caída combinada de costados y pie.
            var caida = Math.max(
                lateral.baja,
                frontal.baja
            ) + 0.04 * Math.min(
                lateral.baja,
                frontal.baja
            );

            // Arrugas suaves e irregulares.
            var pliegues =
                0.009 * Math.sin(14 * u + 4 * v) +
                0.006 * Math.sin(23 * u - 6 * v);

            var intensidadCaida = Math.min(
                1, caida / 0.44
            );

            pliegues *= 1 - 0.45 * intensidadCaida;

            // Doblez superior integrado en la tela.
            var doblez = 0.016 * Math.exp(
                -Math.pow((v + 0.47) / 0.08, 2)
            );

            // Pequeñas ondas en los bordes inferiores.
            var ondasBorde =
                0.014 * Math.sin(
                    10 * u + 0.8 * Math.sin(3 * u)
                ) * Math.pow(
                    Math.min(1, frontal.baja / 0.43), 2
                ) +
                0.008 * Math.sin(12 * v) * Math.pow(
                    Math.min(1, lateral.baja / 0.43), 2
                );

            var y =
                0.63 -
                caida +
                pliegues +
                doblez +
                ondasBorde;

            puntosManta.setXYZ(j, x, y, z);
        }

        geometriaManta.computeVertexNormals();

        var manta = new THREE.Mesh(
            geometriaManta,
            materialManta
        );

        grupo.add(manta);


        // ALMOHADAS MULLIDAS, NO ESFERAS APLASTADAS
        function hacerAlmohada(ancho, profundidad, color) {
            var segmentos = 44;
            var anillos = 12;
            var vertices = [];
            var indices = [];

            function superficie(esSuperior) {
                var inicio = vertices.length / 3;

                for (var r = 0; r <= anillos; r++) {
                    var t = r / anillos;

                    for (var s = 0; s <= segmentos; s++) {
                        var angulo = s * Math.PI * 2 / segmentos;

                        var c = Math.cos(angulo);
                        var sn = Math.sin(angulo);

                        // Contorno rectangular con esquinas suaves.
                        var x = Math.sign(c) *
                            Math.pow(Math.abs(c), 0.62) *
                            (ancho / 2) * t;

                        var z = Math.sign(sn) *
                            Math.pow(Math.abs(sn), 0.62) *
                            (profundidad / 2) * t;

                        var curva = Math.pow(
                            Math.max(0, 1 - t * t), 0.8
                        );

                        var y = esSuperior
                            ? 0.585 + 0.100 * curva
                            : 0.585 - 0.031 * curva;

                        if (esSuperior) {
                            y += 0.003 *
                                Math.sin(x * 25 + z * 18) *
                                curva;
                        }

                        vertices.push(x, y, z);
                    }
                }

                var fila = segmentos + 1;

                for (var a = 0; a < anillos; a++) {
                    for (var b = 0; b < segmentos; b++) {
                        var n1 = inicio + a * fila + b;
                        var n2 = n1 + fila;

                        if (esSuperior) {
                            indices.push(
                                n1, n2 + 1, n2,
                                n1, n1 + 1, n2 + 1
                            );
                        } else {
                            indices.push(
                                n1, n2, n2 + 1,
                                n1, n2 + 1, n1 + 1
                            );
                        }
                    }
                }
            }

            superficie(true);
            superficie(false);

            var geometria = new THREE.BufferGeometry();

            geometria.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(vertices, 3)
            );

            geometria.setIndex(indices);
            geometria.computeVertexNormals();

            return new THREE.Mesh(
                geometria,
                new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 1,
                    side: THREE.DoubleSide
                })
            );
        }

        // ALMOHADA IZQUIERDA
        var almohadaIzq = hacerAlmohada(
            0.63, 0.37, 0xCFD5DC
        );

        almohadaIzq.position.set(-0.30, 0, -0.78);
        almohadaIzq.rotation.y = -0.07;

        grupo.add(almohadaIzq);

        // ALMOHADA DERECHA
        var almohadaDer = hacerAlmohada(
            0.55, 0.35, 0xBCC7D2
        );

        almohadaDer.position.set(0.30, -0.007, -0.77);
        almohadaDer.rotation.y = 0.09;

        grupo.add(almohadaDer);

        this.grupo = grupo;
        this.el.setObject3D('mesh', grupo);
    },

    remove: function () {
        if (!this.grupo) return;

        this.grupo.traverse(function (obj) {
            if (!obj.isMesh) return;

            obj.geometry.dispose();

            if (obj.material.map) {
                obj.material.map.dispose();
            }

            obj.material.dispose();
        });

        this.el.removeObject3D('mesh');
    }
});

window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.centre = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('b', 'd', 0, 0, 0, 0.5, 0.2, 0.5); // solid plinth
        add('p8', 'm', 0, 0.2, 0, 0.3, 1.2, 0.3); // sleek obelisk
        add('s', 'g', 0, 1.45, 0, 0.1, 0.1, 0.1).userData.anim = "flicker"; // glowing tip
    } else if (tier === 2) {
        add('b', 'd', 0, 0, 0, 0.7, 0.2, 0.7);
        add('c', 'l', 0, 0.2, 0, 0.5, 1.2, 0.5); // strong tower
        add('s', 'a', 0, 1.4, 0, 0.5, 0.5, 0.5); // majestic dome
        add('c', 'g', 0, 0.5, 0.26, 0.2, 0.6, 0.05); // lit entryway
    } else if (tier === 3) {
        add('b', 'd', 0, 0, 0, 0.9, 0.3, 0.9);
        add('c', 'm', 0, 0.3, 0, 0.4, 2.2, 0.4); // towering core
        // Flanking pillars
        [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]].forEach(([x, z]) => {
            add('c', 'l', x, 0.3, z, 0.15, 1.5, 0.15);
            add('p8', 'a', x, 1.8, z, 0.15, 0.4, 0.15);
        });
    } else if (tier === 4) {
        add('c', 'd', 0, 0, 0, 1.0, 0.3, 1.0); // massive round base
        
        let core = add('c', 'g', 0, 0.3, 0, 0.45, 3.5, 0.45); // highly visible glowing core
        core.userData.anim = "flicker";
        
        // Surrounding asymmetrical skyline
        add('b', 'm', -0.25, 0.3, -0.25, 0.3, 2.8, 0.3);
        add('b', 'a', 0.3, 0.3, -0.2, 0.3, 2.2, 0.3);
        add('b', 'l', -0.2, 0.3, 0.3, 0.3, 1.8, 0.3);
        add('b', 'm', 0.25, 0.3, 0.25, 0.3, 3.2, 0.3);

        // Orbital ring
        let ring = add('t05w', 'd', 0, 1.8, 0, 1.5, 1.5, 1.5, Math.PI/2);
        ring.userData.anim = "spin";
    } else if (tier === 5) {
        // Mega-Spire
        add('c', 'd', 0, 0, 0, 1.0, 0.5, 1.0);
        add('p8', 'm', 0, 0.5, 0, 0.8, 4.5, 0.8); // piercing the sky
        add('c', 'g', 0, 0.5, 0, 0.75, 4.0, 0.75); // internal glow bleeding through
        
        // Tiered orbital rings
        let rings = new THREE.Group();
        rings.position.set(0, 0, 0);
        [1.5, 2.5, 3.5].forEach((y, i) => {
            let r = new THREE.Mesh(geos.t05w, mats.a);
            r.position.y = y;
            r.scale.set(1.5 - i*0.2, 1.5 - i*0.2, 1.5 - i*0.2);
            r.rotation.x = Math.PI/2;
            rings.add(r);
        });
        rings.userData.anim = "spin";
        group.add(rings);
    } else {
        // Space Elevator / Ethereal Citadel
        // The base floats slightly off the ground
        let citadel = new THREE.Group();
        citadel.position.y = 0.5;
        citadel.userData.anim = "bob";
        
        let b = new THREE.Mesh(geos.p8, mats.d); // inverted pyramid
        b.rotation.x = Math.PI;
        b.scale.set(1.0, 1.0, 1.0);
        citadel.add(b);

        let body = new THREE.Mesh(geos.c, mats.l);
        body.position.y = 0.5;
        body.scale.set(0.6, 2.0, 0.6);
        citadel.add(body);
        
        // Massive beam of pure energy shooting into space
        let beam = new THREE.Mesh(geos.c, mats.g);
        beam.position.y = 3.5;
        beam.scale.set(0.2, 6.0, 0.2);
        citadel.add(beam);
        
        // Floating monoliths rotating around the beam
        let monoliths = new THREE.Group();
        monoliths.position.y = 3.0;
        for(let i=0; i<4; i++) {
            let angle = (i/4)*Math.PI*2;
            let m = new THREE.Mesh(geos.b, mats.m);
            m.scale.set(0.2, 1.5, 0.2);
            m.position.set(Math.cos(angle)*0.6, 0, Math.sin(angle)*0.6);
            monoliths.add(m);
        }
        monoliths.userData.anim = "spin";
        citadel.add(monoliths);
        
        group.add(citadel);
    }
    return window.CityUtils.finishBuilding(group);
};

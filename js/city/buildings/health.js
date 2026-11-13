window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.health = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('b', 'd', -0.2, 0, 0, 0.05, 0.5, 0.05); // higher posts
        add('b', 'd', 0.2, 0, 0, 0.05, 0.5, 0.05);
        add('c', 'l', 0, 0.48, 0, 0.03, 0.45, 0.03, 0, 0, Math.PI/2);
        add('b', 'a', 0, 0.1, 0.3, 0.4, 0.05, 0.2); // nicer bench
        add('c', 'm', 0.2, 0, -0.2, 0.1, 0.15, 0.1); // kettlebell
    } else if (tier === 2) {
        add('b', 'l', 0, 0, 0, 0.7, 0.5, 0.6);
        add('b', 'g', 0, 0.1, 0.31, 0.5, 0.3, 0.05); // massive glass front
        add('b', 'd', 0, 0.5, 0, 0.8, 0.1, 0.7); // overhanging roof
        add('c', 'a', 0.2, 0.6, 0.2, 0.05, 0.3, 0.05, 0, 0, Math.PI/2); // dumbbell sign
    } else if (tier === 3) {
        add('b', 'l', 0, 0, 0, 0.9, 0.6, 0.7);
        add('c', 'm', 0, 0.6, 0, 0.8, 0.3, 0.8); // domed arena roof
        add('b', 'a', 0, 0.02, 0.5, 1.0, 0.02, 0.2); // running track
        [-0.4, -0.2, 0, 0.2, 0.4].forEach(x => add('b', 'd', x, 0.2, 0.36, 0.05, 0.3, 0.05)); // facade fins
    } else if (tier === 4) {
        add('c', 'l', 0, 0, 0, 0.95, 0.6, 0.95); // huge circular arena
        add('c', 'd', 0, 0.6, 0, 1.0, 0.15, 1.0); // upper tier
        let roof = add('s', 'g', 0, 0.75, 0, 0.9, 0.4, 0.9); // glowing pool roof
        let sign = add('c8', 'a', 0, 1.3, 0.4, 0.2, 0.2, 0.2); // animated sign
        sign.userData.anim = "spin";
        add('t05', 'm', 0, 0.02, 0, 1.0, 1.0, 1.0, Math.PI/2); // outer track ring
    } else if (tier === 5) {
        // Massive Colosseum Stadium
        add('c', 'd', 0, 0, 0, 1.0, 0.2, 1.0); // base
        add('c', 'l', 0, 0.2, 0, 0.95, 0.8, 0.95); // main body
        add('c', 'm', 0, 1.0, 0, 1.0, 0.2, 1.0); // grand rim
        add('c', 'a', 0, 1.2, 0, 0.9, 0.1, 0.9); // inner rim
        // Colosseum arches
        for(let i=0; i<8; i++) {
            let angle = (i / 8) * Math.PI * 2;
            let x = Math.cos(angle) * 0.48;
            let z = Math.sin(angle) * 0.48;
            add('c', 'g', x, 0.4, z, 0.15, 0.4, 0.15); // glowing entryways
        }
        // Floating jumbotron
        let jumbo = add('c8', 'd', 0, 2.0, 0, 0.4, 0.4, 0.4);
        jumbo.userData.anim = "bob";
        add('c8', 'g', 0, 2.0, 0, 0.42, 0.3, 0.42); // screen part
    } else {
        // Sci-Fi Wellness Biodome
        add('c', 'd', 0, 0, 0, 1.0, 0.3, 1.0); 
        let dome = add('s', 'l', 0, 0.3, 0, 0.9, 0.9, 0.9); // glass biodome
        add('s', 'g', 0, 0.3, 0, 0.85, 0.85, 0.85).userData.anim = "flicker"; // inner glow
        
        // High-tech support arms
        for(let i=0; i<4; i++) {
            let angle = (i / 4) * Math.PI * 2;
            add('b', 'a', Math.cos(angle)*0.45, 0.3, Math.sin(angle)*0.45, 0.1, 1.0, 0.1);
        }

        // Glowing Genetic Helix / Energy Spire on top
        let helixGroup = new THREE.Group();
        helixGroup.position.set(0, 1.4, 0);
        add('c', 'm', 0, 0, 0, 0.05, 1.2, 0.05); // central rod
        for(let i=0; i<6; i++) {
            let step = (i / 6) * Math.PI * 2;
            let y = i * 0.15 + 0.1;
            let cross = new THREE.Mesh(geos.b, mats.g);
            cross.scale.set(0.3, 0.02, 0.05);
            cross.position.y = y;
            cross.rotation.y = step;
            helixGroup.add(cross);
        }
        helixGroup.userData.anim = "spin";
        group.add(helixGroup);
    }
    return window.CityUtils.finishBuilding(group);
};

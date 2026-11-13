window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.park = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('b', 'm', 0, 0, 0, 0.6, 0.1, 0.6); // grass patch
        add('c', 'd', 0, 0.1, 0, 0.05, 0.2, 0.05); // tiny trunk
        add('s', 'a', 0, 0.3, 0, 0.2, 0.2, 0.2); // tiny canopy
    } else if (tier === 2) {
        add('b', 'm', 0, 0, 0, 0.9, 0.05, 0.9); // bigger grass
        add('b', 'l', 0, 0.05, 0, 0.3, 0.02, 0.9); // dirt path
        // Two trees
        [-0.25, 0.25].forEach(x => {
            add('c', 'd', x, 0.05, 0, 0.08, 0.3, 0.08);
            add('p8', 'm', x, 0.35, 0, 0.3, 0.4, 0.3);
        });
    } else if (tier === 3) {
        add('b', 'm', 0, 0, 0, 1.0, 0.05, 1.0);
        add('c', 'l', 0, 0.05, 0, 0.8, 0.02, 0.8); // circular plaza
        add('c', 'd', 0, 0.07, 0, 0.3, 0.1, 0.3); // fountain base
        add('c', 'a', 0, 0.17, 0, 0.25, 0.05, 0.25).userData.anim = "bob"; // water
        // Benches
        add('b', 'd', -0.3, 0.07, 0, 0.05, 0.1, 0.2);
        add('b', 'd', 0.3, 0.07, 0, 0.05, 0.1, 0.2);
    } else if (tier === 4) {
        add('b', 'm', 0, 0, 0, 1.0, 0.05, 1.0);
        // Cross paths
        add('b', 'l', 0, 0.05, 0, 0.2, 0.02, 1.0);
        add('b', 'l', 0, 0.05, 0, 1.0, 0.02, 0.2);
        // Gazebo
        add('c', 'd', 0, 0.07, 0, 0.4, 0.05, 0.4);
        [[-0.15,-0.15], [0.15,-0.15], [-0.15,0.15], [0.15,0.15]].forEach(([x,z]) => {
            add('c', 'l', x, 0.12, z, 0.02, 0.4, 0.02); // pillars
        });
        add('p8', 'a', 0, 0.52, 0, 0.4, 0.3, 0.4); // gazebo roof
        // Glowing lamps
        [[-0.35,-0.35], [0.35,0.35]].forEach(([x,z]) => {
            add('c', 'd', x, 0.05, z, 0.02, 0.3, 0.02);
            add('s', 'g', x, 0.35, z, 0.05, 0.05, 0.05).userData.anim = "flicker";
        });
    } else if (tier === 5) {
        // Botanical Garden Dome
        add('b', 'm', 0, 0, 0, 1.0, 0.1, 1.0);
        add('c', 'l', 0, 0.1, 0, 0.9, 0.05, 0.9);
        let dome = add('s', 'g', 0, 0.15, 0, 0.85, 0.85, 0.85); // glass greenhouse
        dome.material.transparent = true; dome.material.opacity = 0.6; // slightly see-through
        // Exotic plant inside
        add('c', 'd', 0, 0.15, 0, 0.1, 0.4, 0.1);
        add('p8', 'a', 0, 0.55, 0, 0.4, 0.5, 0.4);
        // Outer hedges
        add('b', 'd', -0.4, 0.15, 0, 0.1, 0.2, 0.8);
        add('b', 'd', 0.4, 0.15, 0, 0.1, 0.2, 0.8);
    } else {
        // Floating Mystical Eden
        let island = add('p8', 'd', 0, 0.5, 0, 1.0, 1.0, 1.0, Math.PI);
        island.userData.anim = "bob";
        add('c', 'm', 0, 1.0, 0, 1.0, 0.1, 1.0); // grass crust
        // Glowing giant tree
        add('c', 'd', 0, 1.1, 0, 0.15, 0.8, 0.15);
        let canopy = add('s', 'g', 0, 1.9, 0, 0.7, 0.5, 0.7);
        canopy.userData.anim = "flicker";
        // Floating glowing petals/wisps
        let wisps = new THREE.Group();
        wisps.position.set(0, 1.5, 0);
        for(let i=0; i<5; i++) {
            let angle = (i/5)*Math.PI*2;
            let w = new THREE.Mesh(geos.s, mats.a);
            w.scale.set(0.08, 0.08, 0.08);
            w.position.set(Math.cos(angle)*0.5, Math.sin(angle)*0.2, Math.sin(angle)*0.5);
            wisps.add(w);
        }
        wisps.userData.anim = "spin";
        group.add(wisps);
    }
    return window.CityUtils.finishBuilding(group);
};

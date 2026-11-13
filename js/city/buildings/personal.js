window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.personal = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('c', 'd', -0.1, 0, 0, 0.08, 0.2, 0.08); // thicker trunk
        add('s', 'm', -0.1, 0.2, 0, 0.35, 0.35, 0.35); // nice round foliage
        add('b', 'a', 0.25, 0.1, 0, 0.25, 0.05, 0.15); // solid bench
    } else if (tier === 2) {
        add('b', 'l', 0, 0, 0, 0.6, 0.5, 0.6); // cozy cabin
        add('p4', 'm', 0, 0.5, 0, 0.7, 0.4, 0.7); 
        add('s', 'a', 0.35, 0, 0.35, 0.3, 0.4, 0.3); // decorative bush
    } else if (tier === 3) {
        add('b', 'd', 0, 0, 0, 0.9, 0.05, 0.9);
        add('b', 'l', -0.15, 0.05, -0.15, 0.5, 0.6, 0.5); // villa
        add('p4', 'm', -0.15, 0.65, -0.15, 0.6, 0.5, 0.6);
        add('c', 'a', 0.25, 0.05, 0.25, 0.35, 0.05, 0.35); // circular pond
        add('c', 'g', 0.25, 0.08, 0.25, 0.3, 0.05, 0.3).userData.anim = "bob"; // glowing water
    } else if (tier === 4) {
        add('b', 'd', 0, 0, 0, 1.0, 0.05, 1.0);
        add('b', 'l', -0.2, 0.05, -0.2, 0.5, 0.7, 0.5); // large house
        add('p4', 'm', -0.2, 0.75, -0.2, 0.6, 0.5, 0.6);
        // Beautiful Greenhouse attachment
        add('b', 'g', 0.25, 0.05, -0.2, 0.4, 0.4, 0.4);
        add('c', 'l', 0.25, 0.45, -0.2, 0.4, 0.2, 0.4, 0, 0, Math.PI/2); // curved glass roof
        // Pond & Lights
        add('c', 'a', 0.15, 0.05, 0.35, 0.4, 0.02, 0.4);
        [[-0.3, 0.4], [0, 0.4], [0.3, 0.4]].forEach(([x,z]) => {
            add('c', 'd', x, 0.05, z, 0.02, 0.5, 0.02);
            add('s', 'g', x, 0.55, z, 0.08, 0.08, 0.08).userData.anim = "flicker";
        });
    } else if (tier === 5) {
        // Zen Sanctuary
        add('b', 'd', 0, 0, 0, 1.0, 0.2, 1.0); // elevated base
        add('c', 'l', 0, 0.2, 0, 0.8, 0.8, 0.8); // circular temple
        add('p4', 'm', 0, 1.0, 0, 0.9, 0.5, 0.9); // sweeping roof
        
        // Cascading waterfalls (glowing)
        add('b', 'g', -0.4, 0.2, 0.5, 0.2, 0.8, 0.05).userData.anim = "bob";
        add('b', 'g', 0.4, 0.2, 0.5, 0.2, 0.8, 0.05).userData.anim = "bob";
        
        // Giant lotus/crystal
        add('p4', 'a', 0, 1.5, 0, 0.3, 0.6, 0.3, Math.PI); 
        add('p4', 'a', 0, 1.5, 0, 0.3, 0.6, 0.3); 
    } else {
        // Floating Island Oasis
        let island = add('p4', 'd', 0, 0.5, 0, 1.0, 1.0, 1.0, Math.PI);
        island.userData.anim = "bob";
        
        add('c', 'm', 0, 1.0, 0, 1.0, 0.1, 1.0); // grass top
        
        // Ethereal tree
        add('c', 'l', 0, 1.1, 0, 0.1, 1.5, 0.1); 
        add('s', 'g', 0, 2.6, 0, 0.8, 0.8, 0.8); // massive glowing canopy
        
        // Floating crystals
        [-0.5, 0.5].forEach(x => {
            let crystal = add('p4', 'a', x, 1.5, 0, 0.2, 0.6, 0.2);
            crystal.userData.anim = "bob";
        });
    }
    return window.CityUtils.finishBuilding(group);
};

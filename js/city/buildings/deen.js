window.CityBuildings = window.CityBuildings || {};
window.CityBuildings.deen = function (tier, palette) {
    const group = new THREE.Group();
    const { geos, mats } = window.CityUtils.setup(palette);
    const add = window.CityUtils.createAdder(group, geos, mats);

    if (tier === 1) {
        add('b', 'l', 0, 0, 0, 0.5, 0.4, 0.5);
        add('s', 'm', 0, 0.4, 0, 0.25, 0.25, 0.25);
        add('b', 'g', 0, 0.1, 0.26, 0.15, 0.2, 0.05); // warm lit door
    } else if (tier === 2) {
        add('b', 'l', 0, 0, -0.1, 0.6, 0.5, 0.6);
        add('s', 'm', 0, 0.5, -0.1, 0.35, 0.35, 0.35); // larger smooth dome
        add('c8', 'd', 0.3, 0, 0.2, 0.12, 0.9, 0.12); // minaret base
        add('c', 'l', 0.3, 0.9, 0.2, 0.1, 0.3, 0.1); // minaret top
        add('s', 'a', 0.3, 1.2, 0.2, 0.08, 0.08, 0.08); // finial
    } else if (tier === 3) {
        add('b', 'l', 0, 0, -0.1, 0.7, 0.6, 0.7);
        add('c8', 'd', 0, 0.6, -0.1, 0.4, 0.1, 0.4); // dome drum
        add('s', 'm', 0, 0.7, -0.1, 0.45, 0.45, 0.45);
        [-0.35, 0.35].forEach(x => {
            add('c', 'l', x, 0, 0.25, 0.1, 1.2, 0.1);
            add('c', 'a', x, 1.2, 0.25, 0.12, 0.2, 0.12);
        });
    } else if (tier === 4) {
        add('b', 'd', 0, 0, 0, 0.9, 0.1, 0.9); // grand courtyard platform
        add('b', 'l', 0, 0.1, -0.15, 0.7, 0.6, 0.6);
        add('c8', 'm', 0, 0.7, -0.15, 0.5, 0.15, 0.5); 
        add('s', 'm', 0, 0.85, -0.15, 0.48, 0.48, 0.48); // majestic dome
        
        [-0.4, 0.4].forEach(x => {
            add('c8', 'l', x, 0.1, 0.3, 0.12, 1.6, 0.12);
            add('c', 'm', x, 1.7, 0.3, 0.14, 0.3, 0.14);
            add('tArc', 'a', x, 2.05, 0.3, 0.15, 0.15, 0.15, 0, 0, Math.PI/4); // crescents
        });
        
        // Courtyard fountain
        add('c8', 'a', 0, 0.1, 0.3, 0.2, 0.05, 0.2);
        add('c', 'g', 0, 0.15, 0.3, 0.15, 0.05, 0.15).userData.anim = "bob";
    } else if (tier === 5) {
        add('b', 'd', 0, 0, 0, 1.0, 0.1, 1.0);
        add('c8', 'l', 0, 0.1, -0.1, 0.8, 0.7, 0.8); // massive octagonal main hall
        add('c8', 'd', 0, 0.8, -0.1, 0.6, 0.2, 0.6); // multi-tiered dome base
        add('s', 'm', 0, 1.0, -0.1, 0.55, 0.55, 0.55);
        
        // 4 Minarets
        [[-0.4, 0.3], [0.4, 0.3], [-0.4, -0.4], [0.4, -0.4]].forEach(([x, z]) => {
            add('c', 'l', x, 0.1, z, 0.1, 2.0, 0.1);
            add('c', 'a', x, 2.1, z, 0.12, 0.3, 0.12);
            add('tArc', 'm', x, 2.45, z, 0.1, 0.1, 0.1, 0, 0, Math.PI/4);
        });
        
        // Glowing arches
        for(let i=0; i<4; i++) {
            add('b', 'g', 0, 0.2, 0.31, 0.2, 0.3, 0.05);
        }
    } else {
        // Floating Serene Complex
        let base = add('c', 'd', 0, 0.2, 0, 0.95, 0.3, 0.95);
        base.userData.anim = "bob"; // Entire platform floats gently
        
        // Water base
        add('c', 'g', 0, 0.5, 0, 0.9, 0.05, 0.9); 

        add('c8', 'l', 0, 0.55, 0, 0.7, 1.0, 0.7); // ethereal tall structure
        add('s', 'm', 0, 1.55, 0, 0.6, 0.6, 0.6); // glowing crystal dome style
        
        // Floating glowing crescents / geometry
        let cresGroup = new THREE.Group();
        cresGroup.position.set(0, 2.6, 0);
        let bigCres = new THREE.Mesh(geos.tArc, mats.g);
        bigCres.scale.set(0.6, 0.6, 0.6);
        bigCres.rotation.z = Math.PI/4;
        cresGroup.add(bigCres);
        cresGroup.userData.anim = "spin";
        group.add(cresGroup);
        
        // Ethereal floating pillars
        [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]].forEach(([x, z]) => {
            let pillar = add('c', 'l', x, 0.2, z, 0.05, 1.5, 0.05);
            pillar.userData.anim = "bob";
        });
    }
    return window.CityUtils.finishBuilding(group);
};

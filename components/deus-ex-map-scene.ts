import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {modelPoint, modelFloorElevation, mapDestination, type MapModel, type ModelPlace, type MapLocale} from '@/lib/dx-map-model';

export type MapSelection = {floor: string; place?: string; building?: string; kind: 'floor' | 'wall' | 'place' | 'building'};
export type SceneOptions = {floor: string; exploded: boolean; xray: boolean; labels: boolean; walls: boolean};
export type MapSceneController = {
    update: (options: SceneOptions, selected: string | null) => void;
    reset: (top?: boolean) => void;
    zoom: (factor: number) => void;
    rotate: (direction: number) => void;
    focus: (id: string) => void;
    dispose: () => void;
};

export function createMapScene(host: HTMLDivElement, model: MapModel, places: ModelPlace[], locale: MapLocale,
    onSelect: (selection: MapSelection) => void, onError: () => void): MapSceneController
{
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#10140f');
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 8000);
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, powerPreference: 'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', locale === 'ru' ? 'Объёмный макет. Стрелки — перемещение, мышь — вращение.' : locale === 'uk' ? 'Об’ємний макет. Стрілки — переміщення, миша — обертання.' : '3D model. Arrow keys pan; drag to rotate.');
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = true;
    controls.minPolarAngle = .025;
    controls.maxPolarAngle = Math.PI * .85;
    controls.zoomSpeed = .8;
    controls.rotateSpeed = .65;
    controls.listenToKeyEvents(renderer.domElement);
    scene.add(new THREE.HemisphereLight('#fff4cf', '#191d13', 2.6));
    const light = new THREE.DirectionalLight('#ffe7aa', 3.1);
    light.position.set(-90, 150, 70);
    scene.add(light);

    const root = new THREE.Group();
    scene.add(root);
    const floorGroups = new Map<string, THREE.Group>();
    const wallGroups: THREE.Group[] = [];
    const stairGroups: {group: THREE.Group; from: string; to: string; mesh: THREE.Mesh; rise: number}[] = [];
    const targets: THREE.Object3D[] = [];
    const markers = new Map<string, THREE.Mesh>();
    const buildingMeshes = new Map<string, THREE.Mesh>();
    const labelNodes: {element: HTMLButtonElement; point: THREE.Vector3; floor: string; id: string}[] = [];
    const overlay = document.createElement('div');
    overlay.className = 'dx-model-labels';
    host.appendChild(overlay);
    let options: SceneOptions = {floor: 'all', exploded: false, xray: false, labels: true, walls: true};
    let dead = false;
    let request = 0;
    let dragging = false;
    let pointerStart = {x: 0, y: 0};
    let selectedId: string | null = null;
    const edgeMaterial = new THREE.LineBasicMaterial({color: '#d2bd78', transparent: true, opacity: .68});

    for (const floor of model.floors)
    {
        const group = new THREE.Group();
        group.position.y = modelFloorElevation(model, floor.id);
        root.add(group);
        floorGroups.set(floor.id, group);
        const material = new THREE.MeshStandardMaterial({color: '#665932', roughness: .92, metalness: .14, side: THREE.DoubleSide});
        const wallsMaterial = new THREE.MeshStandardMaterial({color: '#b8a267', roughness: .72, metalness: .23, side: THREE.DoubleSide});
        const floorEdgeMaterial = edgeMaterial.clone();
        const floorGeometry: THREE.BufferGeometry[] = [];
        for (const polygon of floor.shapes)
        {
            const vector = (p: [number, number]) => new THREE.Vector2(p[0] - model.center[0], -(p[1] - model.center[1]));
            const shape = new THREE.Shape(polygon.outer.map(vector));
            shape.holes = polygon.holes.map(hole => new THREE.Path(hole.map(vector)));
            const geometry = new THREE.ExtrudeGeometry(shape, {depth: model.slabDepth, bevelEnabled: false, steps: 1, curveSegments: 1});
            geometry.rotateX(-Math.PI / 2);
            geometry.translate(0, -model.slabDepth, 0);
            floorGeometry.push(geometry);
        }
        if (floorGeometry.length)
        {
            const geometry = mergeGeometries(floorGeometry, false)!;
            floorGeometry.forEach(item => item.dispose());
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData = {floor: floor.id, kind: 'floor'};
            group.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), floorEdgeMaterial));
            targets.push(mesh);
        }
        const wallGroup = new THREE.Group();
        group.add(wallGroup);
        wallGroups.push(wallGroup);
        const wallGeometry: THREE.BufferGeometry[] = [];
        for (const polygon of floor.wallShapes)
        {
            const vector = (p: [number, number]) => new THREE.Vector2(p[0]-model.center[0], -(p[1]-model.center[1]));
            const shape = new THREE.Shape(polygon.outer.map(vector));
            shape.holes = polygon.holes.map(hole => new THREE.Path(hole.map(vector)));
            const geometry = new THREE.ExtrudeGeometry(shape, {depth: model.wallHeight, bevelEnabled: false, steps: 1, curveSegments: 1});
            geometry.rotateX(-Math.PI/2);
            wallGeometry.push(geometry);
        }
        if (wallGeometry.length)
        {
            const geometry = mergeGeometries(wallGeometry, false)!;
            wallGeometry.forEach(item => item.dispose());
            const walls = new THREE.Mesh(geometry, wallsMaterial);
            walls.userData = {floor: floor.id, kind: 'wall'};
            wallGroup.add(walls, new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), floorEdgeMaterial));
            targets.push(walls);
        }
        for (const stair of floor.stairs)
        {
            const stairGroup = new THREE.Group();
            stairGroup.position.set(stair.center[0]-model.center[0], group.position.y, stair.center[1]-model.center[1]);
            const rise = modelFloorElevation(model, stair.toFloor)-group.position.y;
            stairGroup.rotation.y = -stair.angle*Math.PI/180;
            root.add(stairGroup);
            const steps: THREE.BufferGeometry[] = [];
            const count = 10;
            const run = stair.run*.8;
            for (let flight = 0; flight < 2; flight++)
            {
                for (let q = 0; q < count; q++)
                {
                    const height = (q+1)/count*rise/2;
                    const step = new THREE.BoxGeometry(stair.width*.46, .15, run/count);
                    step.translate((flight ? 1 : -1)*stair.width*.26, flight*rise/2+height-.075,
                        (flight ? -1 : 1)*(q/count-.5)*run);
                    steps.push(step);
                }
            }
            const landing = new THREE.BoxGeometry(stair.width, .25, stair.run*.2);
            landing.translate(0, rise/2-.125, run*.5);
            steps.push(landing);
            const geometry = mergeGeometries(steps, false)!;
            steps.forEach(step => step.dispose());
            const mesh = new THREE.Mesh(geometry, wallsMaterial.clone());
            mesh.userData = {floor: floor.id, kind: 'floor'};
            stairGroup.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial.clone()));
            stairGroups.push({group: stairGroup, from: floor.id, to: stair.toFloor, mesh, rise});
            targets.push(mesh);
        }
    }

    for (const building of model.buildings || [])
    {
        const group = floorGroups.get(building.floor);
        if (!group) continue;
        const vector = (p: [number, number]) => new THREE.Vector2(p[0]-model.center[0], -(p[1]-model.center[1]));
        const shape = new THREE.Shape(building.shape.outer.map(vector));
        shape.holes = building.shape.holes.map(hole => new THREE.Path(hole.map(vector)));
        const geometry = new THREE.ExtrudeGeometry(shape, {depth: building.height, bevelEnabled: false, steps: 1, curveSegments: 1});
        geometry.rotateX(-Math.PI/2);
        const material = new THREE.MeshStandardMaterial({color: '#aa9158', roughness: .85, metalness: .16});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = {floor: building.floor, building: building.id, kind: 'building'};
        const buildingGroup = new THREE.Group();
        buildingGroup.add(mesh, new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMaterial.clone()));
        group.add(buildingGroup);
        wallGroups.push(buildingGroup);
        buildingMeshes.set(building.id, mesh);
        targets.push(mesh);
    }

    const markerGeometry = new THREE.OctahedronGeometry(.72);
    const markerMaterial = new THREE.MeshStandardMaterial({color: '#efcf7b', emissive: '#987836', emissiveIntensity: .45, roughness: .3});
    const stemMaterial = new THREE.LineBasicMaterial({color: '#e7cb7c', transparent: true, opacity: .65});
    for (const place of places)
    {
        const floorGroup = floorGroups.get(place.floor);
        if (!floorGroup) continue;
        const point = modelPoint(model, place);
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(point[0], model.wallHeight + 1.5, point[2]);
        marker.userData = {floor: place.floor, place: place.id, kind: 'place'};
        floorGroup.add(marker);
        targets.push(marker);
        markers.set(place.id, marker);
        const stem = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(point[0], .15, point[2]), marker.position]);
        const stemLine = new THREE.Line(stem, stemMaterial);
        stemLine.userData = {floor: place.floor, kind: 'markerStem'};
        floorGroup.add(stemLine);
        const label = document.createElement('button');
        label.type = 'button';
        const destination = mapDestination(model, {place: place.id});
        label.textContent = place.name[locale] + (destination ? ' ↗' : '');
        label.title = destination ? `${place.name[locale]} — ${locale === 'ru' ? 'Открыть карту' : locale === 'uk' ? 'Відкрити мапу' : 'Open map'}` : place.name[locale];
        label.addEventListener('click', () => onSelect({floor: place.floor, place: place.id, kind: 'place'}));
        overlay.appendChild(label);
        labelNodes.push({element: label, point: marker.position.clone(), floor: place.floor, id: place.id});
    }
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.z, size.y, 20);
    controls.minDistance = 4;
    controls.maxDistance = span * 7;
    const grid = new THREE.GridHelper(Math.ceil(span * 2 / 10) * 10, Math.ceil(span * 2 / 10), '#424531', '#22291e');
    grid.position.y = -2;
    scene.add(grid);

    function visible(object: THREE.Object3D): boolean
    {
        let current: THREE.Object3D | null = object;
        while (current) {if (!current.visible) return false; current = current.parent;}
        return true;
    }
    function pickable(object: THREE.Object3D): boolean
    {
        return visible(object) && (options.floor === 'all' || object.userData.floor === options.floor);
    }
    function setOpacity(group: THREE.Group, opacity: number)
    {
        group.traverse(object => {
            const mesh = object as THREE.Mesh;
            if (object.userData.kind === 'place' || object.userData.kind === 'markerStem')
            {
                object.visible = options.floor === 'all' || object.userData.floor === options.floor;
                return;
            }
            if (!mesh.material) return;
            const line = object instanceof THREE.Line;
            for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
            {
                const transparent = line || opacity < 1;
                if (material.transparent !== transparent) {material.transparent = transparent; material.needsUpdate = true;}
                material.opacity = opacity*(line ? .68 : 1);
                material.depthWrite = !line && opacity === 1;
            }
        });
    }
    function paint()
    {
        request = 0;
        if (dead) return;
        renderer.render(scene, camera);
        const width = host.clientWidth, height = host.clientHeight;
        const occupied: {x: number; y: number; width: number}[] = [];
        const labels = [...labelNodes].sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId));
        for (const label of labels)
        {
            const group = floorGroups.get(label.floor)!;
            const point = label.point.clone();
            point.y += group.position.y + 1.5;
            point.project(camera);
            const x = (point.x*.5+.5)*width, y = (-point.y*.5+.5)*height;
            const labelWidth = Math.min(170, label.element.offsetWidth || 150);
            const overlap = occupied.some(box => Math.abs(box.y-y) < 29 && Math.abs(box.x-x) < (labelWidth+box.width)/2+6);
            const show = options.labels && (options.floor === 'all' || options.floor === label.floor) && group.visible && point.z < 1 && point.z > -1 && x > 12 && x < width-12 && y > 14 && y < height-35 && (!overlap || label.id === selectedId);
            label.element.hidden = !show;
            label.element.classList.toggle('selected', label.id === selectedId);
            if (show)
            {
                label.element.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
                occupied.push({x, y, width: labelWidth});
            }
        }
    }
    function render() {if (!dead && !request) request = requestAnimationFrame(paint);}
    function reset(top = false)
    {
        const box = new THREE.Box3();
        for (const group of floorGroups.values()) if (group.visible) box.union(new THREE.Box3().setFromObject(group));
        for (const stair of stairGroups) if (stair.group.visible) box.union(new THREE.Box3().setFromObject(stair.group));
        const center = box.getCenter(new THREE.Vector3());
        const extent = box.getSize(new THREE.Vector3());
        const distance = Math.max(extent.x, extent.z, extent.y, 15) * (camera.aspect < 1 ? 2.6/camera.aspect : 2.05);
        controls.target.copy(center);
        camera.position.copy(center).add(top ? new THREE.Vector3(0, distance, .01) : new THREE.Vector3(-distance*.52, distance*.8, distance*.68));
        camera.near = Math.max(.05, distance / 3000);
        camera.far = Math.max(8000, distance * 15);
        camera.updateProjectionMatrix();
        controls.update();
        render();
    }
    function resize()
    {
        const width = host.clientWidth, height = host.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        render();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const raycaster = new THREE.Raycaster();
    function pointerDown(event: PointerEvent) {pointerStart = {x: event.clientX, y: event.clientY}; dragging = false;}
    function pointerMove(event: PointerEvent)
    {
        if (Math.hypot(event.clientX-pointerStart.x, event.clientY-pointerStart.y) > 5) dragging = true;
        const rect = renderer.domElement.getBoundingClientRect();
        raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1), camera);
        const hit = raycaster.intersectObjects(targets, false).find(item => pickable(item.object));
        renderer.domElement.style.cursor = event.buttons ? 'grabbing' : hit && mapDestination(model, hit.object.userData) ? 'pointer' : 'grab';
    }
    function pointerUp(event: PointerEvent)
    {
        if (dragging || event.button !== 0) return;
        const rect = renderer.domElement.getBoundingClientRect();
        raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1), camera);
        const hit = raycaster.intersectObjects(targets, false).find(item => pickable(item.object));
        if (hit) onSelect(hit.object.userData as MapSelection);
    }
    function contextLost(event: Event) {event.preventDefault(); onError();}
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    controls.addEventListener('change', render);
    resize();
    reset();

    return {
        update(next, selected)
        {
            options = next;
            selectedId = selected;
            for (const floor of model.floors)
            {
                const group = floorGroups.get(floor.id)!;
                group.visible = true;
                group.position.y = modelFloorElevation(model, floor.id, next.exploded);
                const active = next.floor === 'all' || next.floor === floor.id;
                setOpacity(group, active ? (next.xray ? .3 : 1) : .1);
            }
            for (const stair of stairGroups)
            {
                const active = next.floor === 'all' || next.floor === stair.from || next.floor === stair.to;
                stair.group.visible = true;
                stair.group.position.y = floorGroups.get(stair.from)!.position.y;
                stair.group.scale.y = (floorGroups.get(stair.to)!.position.y-stair.group.position.y)/stair.rise;
                stair.mesh.userData.floor = active && next.floor !== 'all' ? next.floor : stair.from;
                setOpacity(stair.group, active ? (next.xray ? .3 : 1) : .1);
            }
            wallGroups.forEach(group => {group.visible = next.walls;});
            markers.forEach((mesh, id) => {mesh.scale.setScalar(selected === id ? 1.6 : 1);});
            buildingMeshes.forEach((mesh, id) => {
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.emissive.set(selected === id ? '#987836' : '#000000');
                material.emissiveIntensity = selected === id ? .45 : 0;
            });
            render();
        },
        reset,
        zoom(factor)
        {
            const offset = camera.position.clone().sub(controls.target);
            const distance = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
            camera.position.copy(controls.target).add(offset.setLength(distance));
            controls.update(); render();
        },
        rotate(direction)
        {
            const offset = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 12);
            camera.position.copy(controls.target).add(offset);
            controls.update(); render();
        },
        focus(id)
        {
            const place = places.find(item => item.id === id);
            if (!place) return;
            const p = modelPoint(model, place);
            const target = new THREE.Vector3(p[0], floorGroups.get(place.floor)!.position.y+1, p[2]);
            const offset = camera.position.clone().sub(controls.target).setLength(Math.min(70, span));
            controls.target.copy(target);
            camera.position.copy(target).add(offset);
            controls.update(); render();
        },
        dispose()
        {
            dead = true;
            cancelAnimationFrame(request);
            observer.disconnect();
            controls.dispose();
            renderer.domElement.removeEventListener('webglcontextlost', contextLost);
            renderer.domElement.removeEventListener('pointerdown', pointerDown);
            renderer.domElement.removeEventListener('pointermove', pointerMove);
            renderer.domElement.removeEventListener('pointerup', pointerUp);
            const geometries = new Set<THREE.BufferGeometry>();
            const materials = new Set<THREE.Material>();
            scene.traverse(object => {
                const mesh = object as THREE.Mesh;
                if (mesh.geometry) geometries.add(mesh.geometry);
                if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
            });
            geometries.forEach(geometry => geometry.dispose());
            materials.forEach(material => material.dispose());
            edgeMaterial.dispose();
            renderer.dispose();
            renderer.domElement.remove();
            overlay.remove();
        },
    };
}
